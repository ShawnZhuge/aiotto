use crate::codex_home::resolve_codex_home;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    time::UNIX_EPOCH,
};
use toml::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexExtensionInventoryRead {
    pub source_label: String,
    pub codex_home: String,
    pub config_path: String,
    pub config_updated_at_epoch_ms: Option<u64>,
    pub config_size_bytes: Option<u64>,
    pub skill_root_statuses: Vec<CodexSkillRootStatus>,
    pub mcp_servers: Vec<CodexMcpServerConfig>,
    pub skills: Vec<CodexSkillDefinition>,
    pub prompts: Vec<CodexPromptDefinition>,
    pub health_checks: Vec<CodexExtensionHealthCheck>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexMcpServerConfig {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub command: String,
    pub args: Vec<String>,
    pub config_path: String,
    pub scope: String,
    pub health: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSkillDefinition {
    pub id: String,
    pub name: String,
    pub source: String,
    pub path: String,
    pub status: String,
    pub description: String,
    pub size_bytes: Option<u64>,
    pub updated_at_epoch_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSkillRootStatus {
    pub root_path: String,
    pub status: String,
    pub skill_count: usize,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexPromptDefinition {
    pub id: String,
    pub name: String,
    pub scope: String,
    pub target_path: String,
    pub description: String,
    pub content_preview: String,
    pub content: String,
    pub size_bytes: Option<u64>,
    pub updated_at_epoch_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PromptBackfillDiffRow {
    pub line: usize,
    pub expected: String,
    pub current: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PromptBackfillProtectionRead {
    pub status: String,
    pub status_label: String,
    pub preset_name: String,
    pub target_path: String,
    pub can_switch_preset: bool,
    pub added_lines: usize,
    pub removed_lines: usize,
    pub diff_rows: Vec<PromptBackfillDiffRow>,
    pub message: String,
    pub primary_action_label: String,
    pub secondary_action_label: String,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PromptBackfillInspectionRequest {
    pub target_path: String,
    pub expected_content: String,
    pub preset_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexExtensionHealthCheck {
    pub id: String,
    pub name: String,
    pub path_exists: bool,
    pub parse_state: String,
    pub disabled_reason: Option<String>,
    pub recommendation: String,
    pub status: String,
}

pub fn read_codex_extension_inventory_in(
    codex_home: &Path,
    agents_skills_dir: &Path,
    project_path: Option<&Path>,
) -> Result<CodexExtensionInventoryRead, String> {
    let config_path = codex_home.join("config.toml");
    let config_read = read_config_for_mcp(&config_path);
    let config_metadata = read_config_file_metadata(&config_path);
    let mcp_servers = match &config_read {
        ConfigRead::Parsed(root) => read_mcp_servers(root, &config_path),
        ConfigRead::Missing => Vec::new(),
        ConfigRead::Broken(_) => Vec::new(),
    };

    let skill_roots = vec![
        SkillRoot {
            path: codex_home.join("skills"),
            source: "user",
        },
        SkillRoot {
            path: agents_skills_dir.to_path_buf(),
            source: "user",
        },
    ];
    let skills = read_skills(&skill_roots);
    let skill_root_statuses = build_skill_root_statuses(&skill_roots, &skills);
    let prompts = read_prompts(codex_home, project_path);
    let health_checks = build_health_checks(
        &config_path,
        &config_read,
        &mcp_servers,
        &skill_roots,
        &skills,
        &prompts,
    );

    Ok(CodexExtensionInventoryRead {
        source_label: "真实 Codex extensions".to_string(),
        codex_home: codex_home.to_string_lossy().to_string(),
        config_path: config_path.to_string_lossy().to_string(),
        config_updated_at_epoch_ms: config_metadata.updated_at_epoch_ms,
        config_size_bytes: config_metadata.size_bytes,
        skill_root_statuses,
        mcp_servers,
        skills,
        prompts,
        health_checks,
    })
}

#[tauri::command]
pub fn read_codex_extension_inventory(
    manual_path: Option<String>,
    project_path: Option<String>,
) -> Result<CodexExtensionInventoryRead, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);
    let agents_skills_dir = Path::new(&home_dir).join(".agents/skills");
    let project_path = project_path
        .as_deref()
        .filter(|path| !path.trim().is_empty())
        .map(|path| expand_user_path(path, &home_dir));

    read_codex_extension_inventory_in(
        Path::new(&resolved),
        &agents_skills_dir,
        project_path.as_deref(),
    )
}

#[tauri::command]
pub fn inspect_prompt_backfill(
    request: PromptBackfillInspectionRequest,
) -> Result<PromptBackfillProtectionRead, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let target_path = normalize_path(&expand_user_path(&request.target_path, &home_dir));

    inspect_prompt_backfill_in(
        &target_path,
        &request.expected_content,
        &request.preset_name,
    )
}

pub fn inspect_prompt_backfill_in(
    target_path: &Path,
    expected_content: &str,
    preset_name: &str,
) -> Result<PromptBackfillProtectionRead, String> {
    let current_content = fs::read_to_string(target_path)
        .map_err(|error| format!("读取 Prompt 文件失败：{}：{error}", target_path.display()))?;

    let expected_lines = split_prompt_lines(expected_content);
    let current_lines = split_prompt_lines(&current_content);
    let max_lines = expected_lines.len().max(current_lines.len());
    let mut diff_rows = Vec::new();

    for index in 0..max_lines {
        let expected = expected_lines.get(index).copied().unwrap_or_default();
        let current = current_lines.get(index).copied().unwrap_or_default();

        if expected != current {
            diff_rows.push(PromptBackfillDiffRow {
                line: index + 1,
                expected: expected.to_string(),
                current: current.to_string(),
            });
        }
    }

    let added_lines = current_lines.len().saturating_sub(expected_lines.len());
    let removed_lines = expected_lines.len().saturating_sub(current_lines.len());
    let modified = !diff_rows.is_empty();

    Ok(PromptBackfillProtectionRead {
        status: if modified { "modified" } else { "clean" }.to_string(),
        status_label: if modified {
            "检测到外部修改"
        } else {
            "可安全切换"
        }
        .to_string(),
        preset_name: preset_name.to_string(),
        target_path: target_path.to_string_lossy().to_string(),
        can_switch_preset: !modified,
        added_lines,
        removed_lines,
        diff_rows,
        message: if modified {
            "不会覆盖用户手改，请先回填到当前预设或放弃切换。"
        } else {
            "当前文件仍与预设一致，切换前会继续创建备份。"
        }
        .to_string(),
        primary_action_label: "回填到当前预设".to_string(),
        secondary_action_label: "放弃切换".to_string(),
    })
}

enum ConfigRead {
    Missing,
    Parsed(Value),
    Broken(String),
}

struct SkillRoot {
    path: PathBuf,
    source: &'static str,
}

#[derive(Debug, Clone, Copy, Default)]
struct ConfigFileMetadata {
    updated_at_epoch_ms: Option<u64>,
    size_bytes: Option<u64>,
}

fn read_config_file_metadata(config_path: &Path) -> ConfigFileMetadata {
    let Ok(metadata) = fs::metadata(config_path) else {
        return ConfigFileMetadata::default();
    };

    let updated_at_epoch_ms = metadata
        .modified()
        .ok()
        .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64);

    ConfigFileMetadata {
        updated_at_epoch_ms,
        size_bytes: Some(metadata.len()),
    }
}

fn read_config_for_mcp(config_path: &Path) -> ConfigRead {
    match fs::read_to_string(config_path) {
        Ok(contents) => match contents.parse::<Value>() {
            Ok(value) => ConfigRead::Parsed(value),
            Err(error) => ConfigRead::Broken(error.to_string()),
        },
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => ConfigRead::Missing,
        Err(error) => ConfigRead::Broken(error.to_string()),
    }
}

fn read_mcp_servers(root: &Value, config_path: &Path) -> Vec<CodexMcpServerConfig> {
    let Some(root_table) = root.as_table() else {
        return Vec::new();
    };
    let Some(Value::Table(mcp_servers)) = root_table
        .get("mcp_servers")
        .or_else(|| root_table.get("mcpServers"))
    else {
        return Vec::new();
    };

    let mut servers = mcp_servers
        .iter()
        .filter_map(|(id, value)| {
            let table = value.as_table()?;
            let command = read_string(table, "command")
                .or_else(|| read_string(table, "command_path"))
                .unwrap_or_default();
            let args = read_string_array(table, "args");
            let enabled = !read_bool(table, "disabled").unwrap_or(false);
            Some(CodexMcpServerConfig {
                id: id.to_string(),
                name: read_string(table, "name").unwrap_or_else(|| id.to_string()),
                enabled,
                command: command.clone(),
                args,
                config_path: config_path.to_string_lossy().to_string(),
                scope: "user".to_string(),
                health: mcp_command_health(&command),
            })
        })
        .collect::<Vec<_>>();

    servers.sort_by(|left, right| {
        right
            .enabled
            .cmp(&left.enabled)
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
    });
    servers
}

fn mcp_command_health(command: &str) -> String {
    let command = command.trim();
    if command.is_empty() {
        return "needs_config".to_string();
    }

    if command.contains(std::path::MAIN_SEPARATOR) || Path::new(command).is_absolute() {
        return if Path::new(command).is_file() {
            "healthy"
        } else {
            "command_missing"
        }
        .to_string();
    }

    let Some(path_env) = std::env::var_os("PATH") else {
        return "command_missing".to_string();
    };

    if std::env::split_paths(&path_env).any(|directory| directory.join(command).is_file()) {
        "healthy".to_string()
    } else {
        "command_missing".to_string()
    }
}

fn read_skills(roots: &[SkillRoot]) -> Vec<CodexSkillDefinition> {
    let mut skills = Vec::new();
    for root in roots {
        collect_skill_files(root, &root.path, 0, &mut skills);
    }
    skills.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    skills.dedup_by(|left, right| left.path == right.path);
    skills
}

fn build_skill_root_statuses(
    roots: &[SkillRoot],
    skills: &[CodexSkillDefinition],
) -> Vec<CodexSkillRootStatus> {
    roots
        .iter()
        .map(|root| {
            let skill_count = skills
                .iter()
                .filter(|skill| Path::new(&skill.path).starts_with(&root.path))
                .count();
            let (status, error_message) = match fs::metadata(&root.path) {
                Ok(metadata) if metadata.is_dir() => match fs::read_dir(&root.path) {
                    Ok(_) => ("available".to_string(), None),
                    Err(error) => ("unreadable".to_string(), Some(error.to_string())),
                },
                Ok(_) => (
                    "not_directory".to_string(),
                    Some("skill root is not a directory".to_string()),
                ),
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                    ("missing".to_string(), None)
                }
                Err(error) => ("unreadable".to_string(), Some(error.to_string())),
            };

            CodexSkillRootStatus {
                root_path: root.path.to_string_lossy().to_string(),
                status,
                skill_count,
                error_message,
            }
        })
        .collect()
}

fn read_prompts(codex_home: &Path, project_path: Option<&Path>) -> Vec<CodexPromptDefinition> {
    let mut prompts = Vec::new();
    push_prompt_file(
        &mut prompts,
        codex_home.join("AGENTS.md"),
        "用户 AGENTS.md".to_string(),
        "user",
    );
    collect_prompt_markdown_files(&mut prompts, &codex_home.join("prompts"), "user", 0);

    if let Some(project_path) = project_path {
        let normalized_project = normalize_path(project_path);
        push_prompt_file(
            &mut prompts,
            normalized_project.join("AGENTS.md"),
            "项目 AGENTS.md".to_string(),
            "project",
        );
        collect_prompt_markdown_files(
            &mut prompts,
            &normalized_project.join(".codex/prompts"),
            "project",
            0,
        );
    }

    prompts.sort_by(|left, right| {
        scope_rank(&left.scope)
            .cmp(&scope_rank(&right.scope))
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
    });
    prompts.dedup_by(|left, right| left.target_path == right.target_path);
    prompts
}

fn collect_prompt_markdown_files(
    prompts: &mut Vec<CodexPromptDefinition>,
    directory: &Path,
    scope: &str,
    depth: usize,
) {
    if depth > 3 || !directory.exists() {
        return;
    }

    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_prompt_markdown_files(prompts, &path, scope, depth + 1);
            continue;
        }
        if path.extension().and_then(|value| value.to_str()) == Some("md") {
            let name = path
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("prompt")
                .to_string();
            push_prompt_file(prompts, path, name, scope);
        }
    }
}

fn push_prompt_file(
    prompts: &mut Vec<CodexPromptDefinition>,
    path: PathBuf,
    name: String,
    scope: &str,
) {
    if !path.is_file() {
        return;
    }

    let Ok(contents) = fs::read_to_string(&path) else {
        return;
    };
    let metadata = read_config_file_metadata(&path);
    let content_preview = prompt_preview(&contents);
    prompts.push(CodexPromptDefinition {
        id: format!("{}-{}", scope, slug_from_path(&path)),
        name,
        scope: scope.to_string(),
        target_path: path.to_string_lossy().to_string(),
        description: "读取本地 Prompt 文件，切换前继续备份。".to_string(),
        content_preview,
        content: contents,
        size_bytes: metadata.size_bytes,
        updated_at_epoch_ms: metadata.updated_at_epoch_ms,
    });
}

fn collect_skill_files(
    root: &SkillRoot,
    directory: &Path,
    depth: usize,
    skills: &mut Vec<CodexSkillDefinition>,
) {
    if depth > 4 || !directory.exists() {
        return;
    }

    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let skill_md = path.join("SKILL.md");
            if skill_md.is_file() {
                skills.push(read_skill_definition(root, &path, &skill_md));
            } else {
                collect_skill_files(root, &path, depth + 1, skills);
            }
        }
    }
}

fn read_skill_definition(
    root: &SkillRoot,
    skill_dir: &Path,
    skill_md: &Path,
) -> CodexSkillDefinition {
    let contents = fs::read_to_string(skill_md).unwrap_or_default();
    let name = read_frontmatter_field(&contents, "name").unwrap_or_else(|| {
        skill_dir
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("unknown-skill")
            .to_string()
    });
    let description = read_frontmatter_field(&contents, "description")
        .or_else(|| first_non_empty_markdown_line(&contents))
        .unwrap_or_else(|| "未提供说明。".to_string());
    let source = if skill_dir.to_string_lossy().contains("/.system/") {
        "bundled"
    } else {
        root.source
    };
    let status = if description == "未提供说明。" {
        "needs_update"
    } else {
        "available"
    };
    let metadata = read_config_file_metadata(skill_md);

    CodexSkillDefinition {
        id: name.to_lowercase().replace(' ', "-"),
        name,
        source: source.to_string(),
        path: skill_dir.to_string_lossy().to_string(),
        status: status.to_string(),
        description,
        size_bytes: metadata.size_bytes,
        updated_at_epoch_ms: metadata.updated_at_epoch_ms,
    }
}

fn build_health_checks(
    config_path: &Path,
    config_read: &ConfigRead,
    mcp_servers: &[CodexMcpServerConfig],
    skill_roots: &[SkillRoot],
    skills: &[CodexSkillDefinition],
    prompts: &[CodexPromptDefinition],
) -> Vec<CodexExtensionHealthCheck> {
    let (mcp_parse_state, mcp_status, mcp_reason) = match config_read {
        ConfigRead::Parsed(_) if mcp_servers.is_empty() => (
            "skipped".to_string(),
            "missing".to_string(),
            Some("config.toml 中未发现 MCP 配置。".to_string()),
        ),
        ConfigRead::Parsed(_) => ("passed".to_string(), "healthy".to_string(), None),
        ConfigRead::Missing => (
            "skipped".to_string(),
            "missing".to_string(),
            Some("config.toml 不存在。".to_string()),
        ),
        ConfigRead::Broken(error) => (
            "failed".to_string(),
            "broken".to_string(),
            Some(format!("config.toml 解析失败：{error}")),
        ),
    };
    let skills_root_exists = skill_roots.iter().any(|root| root.path.exists());
    let skills_missing_reason = if skills.is_empty() {
        Some("未发现可读取的 SKILL.md。".to_string())
    } else {
        None
    };

    vec![
        CodexExtensionHealthCheck {
            id: "mcp-config".to_string(),
            name: "MCP 配置".to_string(),
            path_exists: config_path.exists(),
            parse_state: mcp_parse_state,
            disabled_reason: mcp_reason,
            recommendation: if mcp_servers.is_empty() {
                "先只读展示配置状态；需要新增 MCP 时走备份确认流程。".to_string()
            } else {
                "保持只读展示，启用或修改前继续走备份事务。".to_string()
            },
            status: mcp_status,
        },
        CodexExtensionHealthCheck {
            id: "skills-dir".to_string(),
            name: "Skills 目录".to_string(),
            path_exists: skills_root_exists,
            parse_state: if skills.is_empty() {
                "skipped"
            } else {
                "passed"
            }
            .to_string(),
            disabled_reason: skills_missing_reason,
            recommendation: if skills.is_empty() {
                "未发现 Skills 时保持空态，不使用示例数据冒充真实安装。".to_string()
            } else {
                "先展示来源和路径，安装或删除能力留到独立确认流程。".to_string()
            },
            status: if skills.is_empty() {
                "missing"
            } else {
                "healthy"
            }
            .to_string(),
        },
        CodexExtensionHealthCheck {
            id: "prompt-presets".to_string(),
            name: "Prompt 预设".to_string(),
            path_exists: !prompts.is_empty(),
            parse_state: if prompts.is_empty() {
                "skipped"
            } else {
                "passed"
            }
            .to_string(),
            disabled_reason: if prompts.is_empty() {
                Some("未发现 AGENTS.md 或本地 Prompt markdown 文件。".to_string())
            } else {
                None
            },
            recommendation: if prompts.is_empty() {
                "保持空态，不用演示 Prompt 冒充真实文件。".to_string()
            } else {
                "切换前继续检查回填保护，避免覆盖用户手改。".to_string()
            },
            status: if prompts.is_empty() {
                "missing"
            } else {
                "healthy"
            }
            .to_string(),
        },
        CodexExtensionHealthCheck {
            id: "project-memory".to_string(),
            name: "PROJECT.md".to_string(),
            path_exists: false,
            parse_state: "skipped".to_string(),
            disabled_reason: Some("请先检测项目路径。".to_string()),
            recommendation: "生成模板前先创建 project-memory 备份。".to_string(),
            status: "missing".to_string(),
        },
    ]
}

fn prompt_preview(contents: &str) -> String {
    let preview = contents
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .take(3)
        .collect::<Vec<_>>()
        .join("\n");

    if preview.chars().count() > 180 {
        format!("{}...", preview.chars().take(180).collect::<String>())
    } else {
        preview
    }
}

fn split_prompt_lines(content: &str) -> Vec<&str> {
    if content.is_empty() {
        Vec::new()
    } else {
        content.lines().collect()
    }
}

fn slug_from_path(path: &Path) -> String {
    path.file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("prompt")
        .to_lowercase()
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character
            } else {
                '-'
            }
        })
        .collect::<String>()
        .trim_matches('-')
        .to_string()
}

fn scope_rank(scope: &str) -> u8 {
    if scope == "project" { 0 } else { 1 }
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            std::path::Component::CurDir => {}
            other => normalized.push(other.as_os_str()),
        }
    }
    normalized
}

fn expand_user_path(path: &str, home_dir: &str) -> PathBuf {
    if path == "~" {
        return PathBuf::from(home_dir);
    }
    if let Some(rest) = path.strip_prefix("~/") {
        return Path::new(home_dir).join(rest);
    }

    PathBuf::from(path)
}

fn read_frontmatter_field(contents: &str, key: &str) -> Option<String> {
    let mut lines = contents.lines();
    if lines.next()?.trim() != "---" {
        return None;
    }

    let prefix = format!("{key}:");
    for line in lines {
        let trimmed = line.trim();
        if trimmed == "---" {
            break;
        }
        if let Some(value) = trimmed.strip_prefix(&prefix) {
            return Some(value.trim().trim_matches('"').to_string())
                .filter(|value| !value.is_empty());
        }
    }

    None
}

fn first_non_empty_markdown_line(contents: &str) -> Option<String> {
    contents
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty() && *line != "---" && !line.contains(':'))
        .map(|line| line.trim_start_matches('#').trim().to_string())
        .filter(|line| !line.is_empty())
}

fn read_string(table: &toml::map::Map<String, Value>, key: &str) -> Option<String> {
    table.get(key)?.as_str().map(ToString::to_string)
}

fn read_bool(table: &toml::map::Map<String, Value>, key: &str) -> Option<bool> {
    table.get(key)?.as_bool()
}

fn read_string_array(table: &toml::map::Map<String, Value>, key: &str) -> Vec<String> {
    table
        .get(key)
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(ToString::to_string)
                .collect()
        })
        .unwrap_or_default()
}
