use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ThreadTerminalApp {
    Terminal,
    ITerm2,
    Ghostty,
    Warp,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TerminalLaunchPlan {
    pub program: String,
    pub args: Vec<String>,
    pub launch_config_path: Option<String>,
    pub launch_config_contents: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenThreadRestoreTerminalRequest {
    pub terminal_app: String,
    pub workdir: String,
    pub command: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenThreadRestoreTerminalResult {
    pub terminal_app: String,
    pub workdir: String,
    pub command: String,
    pub status: String,
    pub fallback_required: bool,
    pub message: String,
}

pub fn build_terminal_launch_plan(
    app: ThreadTerminalApp,
    workdir: &str,
    restore_command: &str,
) -> Result<TerminalLaunchPlan, String> {
    validate_restore_input(workdir, restore_command)?;
    let shell_command = format!("cd {} && {}", shell_quote(workdir), restore_command.trim());

    match app {
        ThreadTerminalApp::Terminal => Ok(TerminalLaunchPlan {
            program: "/usr/bin/osascript".to_string(),
            args: vec![
                "-e".to_string(),
                "tell application \"Terminal\" to activate".to_string(),
                "-e".to_string(),
                format!(
                    "tell application \"Terminal\" to do script \"{}\"",
                    applescript_escape(&shell_command)
                ),
            ],
            launch_config_path: None,
            launch_config_contents: None,
        }),
        ThreadTerminalApp::ITerm2 => Ok(TerminalLaunchPlan {
            program: "/usr/bin/osascript".to_string(),
            args: vec![
                "-e".to_string(),
                "tell application \"iTerm2\"".to_string(),
                "-e".to_string(),
                "activate".to_string(),
                "-e".to_string(),
                format!(
                    "create window with default profile command \"{}\"",
                    applescript_escape(&shell_command)
                ),
                "-e".to_string(),
                "end tell".to_string(),
            ],
            launch_config_path: None,
            launch_config_contents: None,
        }),
        ThreadTerminalApp::Ghostty => Ok(TerminalLaunchPlan {
            program: "/usr/bin/open".to_string(),
            args: vec![
                "-na".to_string(),
                "Ghostty".to_string(),
                "--args".to_string(),
                "-e".to_string(),
                "/bin/zsh".to_string(),
                "-lc".to_string(),
                shell_command,
            ],
            launch_config_path: None,
            launch_config_contents: None,
        }),
        ThreadTerminalApp::Warp => {
            let path = default_warp_launch_config_path()?;
            let contents = build_warp_launch_config(workdir, restore_command);
            Ok(TerminalLaunchPlan {
                program: "/usr/bin/open".to_string(),
                args: vec![format!("warp://launch/{}", percent_encode(&path))],
                launch_config_path: Some(path),
                launch_config_contents: Some(contents),
            })
        }
    }
}

#[tauri::command]
pub fn open_thread_restore_in_terminal(
    request: OpenThreadRestoreTerminalRequest,
) -> Result<OpenThreadRestoreTerminalResult, String> {
    let app = parse_terminal_app(&request.terminal_app)?;
    let plan = build_terminal_launch_plan(app, &request.workdir, &request.command)?;

    if let (Some(path), Some(contents)) = (&plan.launch_config_path, &plan.launch_config_contents) {
        let path = PathBuf::from(path);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("无法创建 Warp Launch Configuration 目录：{error}"))?;
        }
        fs::write(&path, contents)
            .map_err(|error| format!("无法写入 Warp Launch Configuration：{error}"))?;
    }

    let status = Command::new(&plan.program)
        .args(&plan.args)
        .status()
        .map_err(|error| format!("无法打开 {}：{error}", request.terminal_app))?;

    if !status.success() {
        return Err(format!(
            "{} 打开失败，退出码：{}",
            request.terminal_app,
            status
                .code()
                .map(|code| code.to_string())
                .unwrap_or_else(|| "unknown".to_string())
        ));
    }

    Ok(OpenThreadRestoreTerminalResult {
        terminal_app: request.terminal_app,
        workdir: request.workdir,
        command: request.command,
        status: "opened".to_string(),
        fallback_required: false,
        message: "终端已打开恢复命令。".to_string(),
    })
}

fn parse_terminal_app(value: &str) -> Result<ThreadTerminalApp, String> {
    match value {
        "Terminal" => Ok(ThreadTerminalApp::Terminal),
        "iTerm2" | "ITerm2" => Ok(ThreadTerminalApp::ITerm2),
        "Ghostty" => Ok(ThreadTerminalApp::Ghostty),
        "Warp" => Ok(ThreadTerminalApp::Warp),
        _ => Err("不支持的终端应用。".to_string()),
    }
}

fn validate_restore_input(workdir: &str, restore_command: &str) -> Result<(), String> {
    validate_no_control_chars(workdir, "工作目录")?;
    validate_no_control_chars(restore_command, "恢复命令")?;

    let workdir = workdir.trim();
    let command = restore_command.trim();

    if workdir.is_empty() {
        return Err("工作目录不能为空。".to_string());
    }

    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.len() < 3 || parts[0] != "codex" || parts[1] != "resume" {
        return Err("恢复命令必须是 codex resume <thread-id>。".to_string());
    }

    if parts[2..]
        .iter()
        .any(|part| part.is_empty() || !part.chars().all(is_safe_resume_arg_char))
    {
        return Err("恢复命令包含不安全参数。".to_string());
    }

    Ok(())
}

fn validate_no_control_chars(value: &str, label: &str) -> Result<(), String> {
    if value.chars().any(|character| character.is_control()) {
        return Err(format!("{label}不能包含控制字符。"));
    }
    Ok(())
}

fn is_safe_resume_arg_char(character: char) -> bool {
    character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.' | ':' | '/' | '@')
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn applescript_escape(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
}

fn yaml_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

fn build_warp_launch_config(workdir: &str, restore_command: &str) -> String {
    format!(
        "name: Aiotto Thread Restore\nwindows:\n  - tabs:\n      - title: Aiotto Restore\n        layout:\n          cwd: {}\n        commands:\n          - exec: {}\n",
        yaml_quote(workdir),
        yaml_quote(restore_command.trim())
    )
}

fn default_warp_launch_config_path() -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|_| "无法定位 HOME 目录。".to_string())?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "系统时间异常，无法创建 Warp 配置。".to_string())?
        .as_millis();

    Ok(format!(
        "{home}/.warp/launch_configurations/aiotto-thread-restore-{timestamp}.yaml"
    ))
}

fn percent_encode(value: &str) -> String {
    let mut encoded = String::new();
    for byte in value.as_bytes() {
        let character = *byte as char;
        if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.' | '~' | '/') {
            encoded.push(character);
        } else {
            encoded.push_str(&format!("%{byte:02X}"));
        }
    }
    encoded
}
