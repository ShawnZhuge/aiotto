use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    io::{BufRead, BufReader, Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

use crate::backup::create_backup_snapshot_in;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct CodexHomeStatus {
    pub path: String,
    pub status: String,
    pub suggestion: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexKeyFileScan {
    pub codex_home: String,
    pub total_size_bytes: u64,
    pub existing_count: usize,
    pub missing_count: usize,
    pub candidates: Vec<CodexKeyFileCandidate>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexKeyFileCandidate {
    pub path: String,
    pub relative_path: String,
    pub category: String,
    pub kind: String,
    pub exists: bool,
    pub size_bytes: u64,
    pub modified_at_epoch_ms: Option<u64>,
    pub risk_level: String,
    pub protected: bool,
    pub recommended_action: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionSource {
    pub source_file: String,
    pub content: String,
    pub size_bytes: u64,
    pub modified_at_epoch_ms: Option<u64>,
    pub content_excerpted: bool,
    pub excerpt_head_bytes: Option<u64>,
    pub excerpt_tail_bytes: Option<u64>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexUnreadableSessionSource {
    pub source_file: String,
    pub error_message: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionScanRootStatus {
    pub root_path: String,
    pub status: String,
    pub source_file_count: usize,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionSourceScan {
    pub codex_home: String,
    pub scanned_roots: Vec<String>,
    pub scanned_root_statuses: Vec<CodexSessionScanRootStatus>,
    pub source_file_count: usize,
    pub returned_source_count: usize,
    pub truncated: bool,
    pub unreadable_source_count: usize,
    pub unreadable_sources: Vec<CodexUnreadableSessionSource>,
    pub sources: Vec<CodexSessionSource>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionMeta {
    pub source_id: String,
    pub session_id: String,
    pub title: Option<String>,
    pub summary: Option<String>,
    pub project_dir: Option<String>,
    pub created_at: Option<u64>,
    pub last_active_at: Option<u64>,
    pub source_path: String,
    pub source_size_bytes: u64,
    pub source_modified_at: Option<u64>,
    pub resume_command: Option<String>,
    pub message_count_estimate: Option<usize>,
    pub indexed_at: u64,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionMetaScan {
    pub codex_home: String,
    pub scanned_roots: Vec<String>,
    pub scanned_root_statuses: Vec<CodexSessionScanRootStatus>,
    pub source_file_count: usize,
    pub returned_source_count: usize,
    pub truncated: bool,
    pub unreadable_source_count: usize,
    pub unreadable_sources: Vec<CodexUnreadableSessionSource>,
    pub sessions: Vec<CodexSessionMeta>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionMessage {
    pub role: String,
    pub content: String,
    pub ts: Option<u64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreadFileActionRequest {
    pub manual_path: Option<String>,
    pub action: String,
    pub thread_ids: Vec<String>,
    pub source_files: Vec<String>,
    pub note: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ThreadFileActionMovedPath {
    pub source_path: String,
    pub target_path: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ThreadFileActionResult {
    pub action: String,
    pub status: String,
    pub backup_id: String,
    pub thread_ids: Vec<String>,
    pub source_files: Vec<String>,
    pub moved_paths: Vec<ThreadFileActionMovedPath>,
    pub deleted_paths: Vec<String>,
    pub skipped_paths: Vec<String>,
    pub log_path: String,
    pub note: String,
    pub message: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnvConflictScan {
    pub conflict_count: usize,
    pub scanned_shell_files: Vec<String>,
    pub conflicts: Vec<EnvConflictRecord>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EnvConflictRecord {
    pub variable_name: String,
    pub masked_value: String,
    pub source: String,
    pub source_path: String,
    pub risk_level: String,
    pub impact: String,
    pub recommended_action: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CliCommandCheck {
    pub command: String,
    pub available: bool,
    pub status: String,
    pub suggestion: String,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexCliStatus {
    pub command: String,
    pub installed: bool,
    pub version: String,
    pub path: String,
    pub status: String,
    pub suggestion: String,
    pub checked_commands: Vec<CliCommandCheck>,
}

struct KeyFileSpec {
    relative_path: &'static str,
    category: &'static str,
    protected: bool,
    recommended_action: &'static str,
}

const KEY_FILE_SPECS: &[KeyFileSpec] = &[
    KeyFileSpec {
        relative_path: "state_5.sqlite",
        category: "state_db",
        protected: false,
        recommended_action: "先备份，再判断是否需要归档旧状态库。",
    },
    KeyFileSpec {
        relative_path: "logs_2.sqlite",
        category: "log_db",
        protected: false,
        recommended_action: "先备份，再归档旧日志库。",
    },
    KeyFileSpec {
        relative_path: ".codex-global-state.json",
        category: "global_state",
        protected: true,
        recommended_action: "仅做状态检查，不默认归档。",
    },
    KeyFileSpec {
        relative_path: "log/codex-tui.log",
        category: "tui_log",
        protected: false,
        recommended_action: "可备份后归档旧 TUI 日志。",
    },
    KeyFileSpec {
        relative_path: "logs",
        category: "logs",
        protected: false,
        recommended_action: "可备份后归档旧日志目录。",
    },
    KeyFileSpec {
        relative_path: "sessions",
        category: "sessions",
        protected: true,
        recommended_action: "默认保护活跃会话，只允许用户确认后处理历史会话。",
    },
    KeyFileSpec {
        relative_path: "archive",
        category: "archive",
        protected: false,
        recommended_action: "可作为历史归档目录展示和统计。",
    },
    KeyFileSpec {
        relative_path: "state_5.sqlite-wal",
        category: "sqlite_temp",
        protected: true,
        recommended_action: "WAL 文件可能代表活跃数据库，需确认 Codex 已退出。",
    },
    KeyFileSpec {
        relative_path: "state_5.sqlite-shm",
        category: "sqlite_temp",
        protected: true,
        recommended_action: "SHM 文件可能代表活跃数据库，需确认 Codex 已退出。",
    },
    KeyFileSpec {
        relative_path: "logs_2.sqlite-wal",
        category: "sqlite_temp",
        protected: true,
        recommended_action: "WAL 文件可能代表活跃日志库，需确认 Codex 已退出。",
    },
    KeyFileSpec {
        relative_path: "logs_2.sqlite-shm",
        category: "sqlite_temp",
        protected: true,
        recommended_action: "SHM 文件可能代表活跃日志库，需确认 Codex 已退出。",
    },
];

const ENV_CONFLICT_VARIABLES: &[&str] = &[
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "OPENAI_ORG_ID",
    "OPENAI_PROJECT",
    "OPENAI_PROJECT_ID",
    "OPENAI_MODEL",
    "OPENAI_DEFAULT_MODEL",
];

const SHELL_PROFILE_FILES: &[&str] = &[
    ".zshrc",
    ".zprofile",
    ".bashrc",
    ".bash_profile",
    ".profile",
];

pub fn resolve_codex_home(manual_path: Option<&str>, home_dir: &str) -> String {
    let selected = manual_path
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("~/.codex");

    if selected == "~" {
        return home_dir.to_string();
    }

    if let Some(rest) = selected.strip_prefix("~/") {
        return format!("{home_dir}/{rest}");
    }

    selected.to_string()
}

pub fn classify_codex_home(path: &str, exists: bool, is_dir: bool) -> CodexHomeStatus {
    let (status, suggestion) = match (exists, is_dir) {
        (true, true) => ("available", "Codex Home 可用。"),
        (true, false) => ("not_directory", "该路径不是目录，请重新选择 Codex Home。"),
        (false, _) => (
            "missing",
            "未找到该路径，请选择 Codex Home 或先运行 Codex。",
        ),
    };

    CodexHomeStatus {
        path: path.to_string(),
        status: status.to_string(),
        suggestion: suggestion.to_string(),
    }
}

pub fn scan_codex_key_files(codex_home: &Path) -> CodexKeyFileScan {
    let candidates: Vec<CodexKeyFileCandidate> = KEY_FILE_SPECS
        .iter()
        .map(|spec| inspect_candidate(codex_home, spec))
        .collect();
    let total_size_bytes = candidates
        .iter()
        .filter(|candidate| candidate.exists)
        .map(|candidate| candidate.size_bytes)
        .sum();
    let existing_count = candidates
        .iter()
        .filter(|candidate| candidate.exists)
        .count();
    let missing_count = candidates.len() - existing_count;

    CodexKeyFileScan {
        codex_home: codex_home.to_string_lossy().to_string(),
        total_size_bytes,
        existing_count,
        missing_count,
        candidates,
    }
}

const MAX_SESSION_SOURCE_FILES: usize = 1_000;
const SESSION_META_HEAD_LINES: usize = 10;
const SESSION_META_TAIL_LINES: usize = 240;
const SESSION_META_TAIL_BYTES: u64 = 256 * 1024;
const SESSION_TITLE_MAX_CHARS: usize = 80;
const CODEX_IDE_CONTEXT_PREFIX: &str = "# Context from my IDE setup:";
const CODEX_REQUEST_MARKER: &str = "my request for codex";

pub fn scan_codex_session_source_scan(codex_home: &Path) -> Result<CodexSessionSourceScan, String> {
    let scanned_root_paths = session_scan_roots(codex_home);
    let scanned_roots = scanned_root_paths
        .iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect::<Vec<_>>();
    let mut session_files = Vec::new();
    let mut scanned_root_statuses = Vec::new();

    for root in &scanned_root_paths {
        let before_count = session_files.len();
        collect_session_files(root, &mut session_files);
        let root_source_file_count = session_files.len().saturating_sub(before_count);
        scanned_root_statuses.push(build_session_scan_root_status(root, root_source_file_count));
    }
    session_files.sort();
    session_files.dedup();
    let source_file_count = session_files.len();
    let truncated = source_file_count > MAX_SESSION_SOURCE_FILES;

    let mut sources = Vec::new();
    let mut unreadable_sources = Vec::new();

    for path in session_files.into_iter().take(MAX_SESSION_SOURCE_FILES) {
        match read_session_source(path.clone()) {
            Ok(Some(source)) => sources.push(source),
            Ok(None) => {}
            Err(error) => unreadable_sources.push(CodexUnreadableSessionSource {
                source_file: path.to_string_lossy().to_string(),
                error_message: error,
            }),
        }
    }
    let returned_source_count = sources.len();
    let unreadable_source_count = unreadable_sources.len();

    Ok(CodexSessionSourceScan {
        codex_home: codex_home.to_string_lossy().to_string(),
        scanned_roots,
        scanned_root_statuses,
        source_file_count,
        returned_source_count,
        truncated,
        unreadable_source_count,
        unreadable_sources,
        sources,
    })
}

pub fn list_codex_session_meta_scan(codex_home: &Path) -> Result<CodexSessionMetaScan, String> {
    let scanned_root_paths = session_scan_roots(codex_home);
    let scanned_roots = scanned_root_paths
        .iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect::<Vec<_>>();
    let mut session_files = Vec::new();
    let mut scanned_root_statuses = Vec::new();

    for root in &scanned_root_paths {
        let before_count = session_files.len();
        collect_session_files(root, &mut session_files);
        let root_source_file_count = session_files.len().saturating_sub(before_count);
        scanned_root_statuses.push(build_session_scan_root_status(root, root_source_file_count));
    }

    session_files.sort();
    session_files.dedup();
    let source_file_count = session_files.len();
    let truncated = source_file_count > MAX_SESSION_SOURCE_FILES;

    let mut sessions = Vec::new();
    let mut unreadable_sources = Vec::new();

    for path in session_files.into_iter().take(MAX_SESSION_SOURCE_FILES) {
        match parse_codex_session_meta(&path) {
            Ok(Some(meta)) => sessions.push(meta),
            Ok(None) => {}
            Err(error) => unreadable_sources.push(CodexUnreadableSessionSource {
                source_file: path.to_string_lossy().to_string(),
                error_message: error,
            }),
        }
    }

    sessions.sort_by(|left, right| {
        let left_ts = left.last_active_at.or(left.created_at).unwrap_or(0);
        let right_ts = right.last_active_at.or(right.created_at).unwrap_or(0);
        right_ts.cmp(&left_ts)
    });

    let returned_source_count = sessions.len();
    let unreadable_source_count = unreadable_sources.len();

    Ok(CodexSessionMetaScan {
        codex_home: codex_home.to_string_lossy().to_string(),
        scanned_roots,
        scanned_root_statuses,
        source_file_count,
        returned_source_count,
        truncated,
        unreadable_source_count,
        unreadable_sources,
        sessions,
    })
}

pub fn apply_codex_thread_file_action_in(
    codex_home: &Path,
    backup_root: &Path,
    request: ThreadFileActionRequest,
) -> Result<ThreadFileActionResult, String> {
    if request.thread_ids.is_empty() || request.source_files.is_empty() {
        return Err("请选择至少一个线程。".to_string());
    }
    if request.thread_ids.len() != request.source_files.len() {
        return Err("线程 ID 与来源文件数量不一致。".to_string());
    }

    let action = match request.action.as_str() {
        "archive" | "delete" | "recover" | "trash" | "purge" => request.action.clone(),
        _ => return Err("不支持的线程文件动作。".to_string()),
    };
    let source_paths = request
        .source_files
        .iter()
        .map(|source_file| resolve_thread_source_path(codex_home, source_file))
        .collect::<Result<Vec<_>, _>>()?;
    for (thread_id, source_path) in request.thread_ids.iter().zip(source_paths.iter()) {
        validate_session_file_matches_thread_id(source_path, thread_id)?;
    }
    if action == "purge" {
        for source_path in &source_paths {
            validate_thread_file_in_trash(codex_home, source_path)?;
        }
    }
    let affected_paths = source_paths
        .iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect::<Vec<_>>();
    let snapshot = create_backup_snapshot_in(
        codex_home,
        backup_root,
        &format!("thread_{action}"),
        &affected_paths,
        &request.note,
        false,
    )?;

    let mut moved_paths = Vec::new();
    let mut deleted_paths = Vec::new();
    let mut skipped_paths = Vec::new();

    for source_path in &source_paths {
        if !source_path.exists() {
            skipped_paths.push(source_path.to_string_lossy().to_string());
            continue;
        }

        match action.as_str() {
            "archive" => {
                let target_path =
                    unique_target_path(&codex_home.join("sessions/archive"), source_path)?;
                move_session_file(source_path, &target_path)?;
                moved_paths.push(ThreadFileActionMovedPath {
                    source_path: source_path.to_string_lossy().to_string(),
                    target_path: target_path.to_string_lossy().to_string(),
                });
            }
            "recover" => {
                let target_path =
                    unique_target_path(&codex_home.join("sessions/recovered"), source_path)?;
                move_session_file(source_path, &target_path)?;
                moved_paths.push(ThreadFileActionMovedPath {
                    source_path: source_path.to_string_lossy().to_string(),
                    target_path: target_path.to_string_lossy().to_string(),
                });
            }
            "trash" => {
                let target_path =
                    unique_target_path(&codex_home.join("sessions/trash"), source_path)?;
                move_session_file(source_path, &target_path)?;
                moved_paths.push(ThreadFileActionMovedPath {
                    source_path: source_path.to_string_lossy().to_string(),
                    target_path: target_path.to_string_lossy().to_string(),
                });
            }
            "purge" => {
                fs::remove_file(source_path).map_err(|error| error.to_string())?;
                deleted_paths.push(source_path.to_string_lossy().to_string());
            }
            "delete" => {
                fs::remove_file(source_path).map_err(|error| error.to_string())?;
                deleted_paths.push(source_path.to_string_lossy().to_string());
            }
            _ => unreachable!(),
        }
    }

    let log_root = codex_home.join(".aiotto/thread-actions");
    fs::create_dir_all(&log_root).map_err(|error| error.to_string())?;
    let log_path = log_root.join(format!("thread-{action}-{}.json", now_epoch_ms()));
    let completed_count = moved_paths.len() + deleted_paths.len();
    let result = ThreadFileActionResult {
        action: action.clone(),
        status: "completed".to_string(),
        backup_id: snapshot.id,
        thread_ids: request.thread_ids,
        source_files: affected_paths,
        moved_paths,
        deleted_paths,
        skipped_paths,
        log_path: log_path.to_string_lossy().to_string(),
        note: request.note,
        message: format!("{action} {completed_count} 个线程完成"),
    };
    let log_json = serde_json::to_string_pretty(&result).map_err(|error| error.to_string())?;
    fs::write(&log_path, log_json).map_err(|error| error.to_string())?;

    Ok(result)
}

fn resolve_thread_source_path(codex_home: &Path, source_file: &str) -> Result<PathBuf, String> {
    let candidate = Path::new(source_file);
    let joined = if candidate.is_absolute() {
        candidate.to_path_buf()
    } else {
        codex_home.join(candidate)
    };
    let normalized = normalize_path(&joined);
    let normalized_home = normalize_path(codex_home);
    if !normalized.starts_with(&normalized_home) {
        return Err("线程文件必须位于 Codex Home 内。".to_string());
    }
    if !is_session_file(&normalized) {
        return Err("线程文件必须是 .json 或 .jsonl。".to_string());
    }
    Ok(normalized)
}

fn unique_target_path(target_dir: &Path, source_path: &Path) -> Result<PathBuf, String> {
    fs::create_dir_all(target_dir).map_err(|error| error.to_string())?;
    let file_name = source_path
        .file_name()
        .ok_or_else(|| "线程来源文件缺少文件名。".to_string())?;
    let mut target = target_dir.join(file_name);
    if !target.exists() {
        return Ok(target);
    }

    let stem = source_path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("thread");
    let extension = source_path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("jsonl");
    target = target_dir.join(format!("{stem}-{}.{}", now_epoch_ms(), extension));
    Ok(target)
}

fn move_session_file(source_path: &Path, target_path: &Path) -> Result<(), String> {
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::rename(source_path, target_path).map_err(|error| error.to_string())
}

fn validate_thread_file_in_trash(codex_home: &Path, source_path: &Path) -> Result<(), String> {
    let trash_root = normalize_path(&codex_home.join("sessions/trash"));
    let normalized_source = normalize_path(source_path);
    if normalized_source.starts_with(&trash_root) {
        Ok(())
    } else {
        Err("只能清空回收站内的线程。".to_string())
    }
}

fn validate_session_file_matches_thread_id(
    source_path: &Path,
    expected_thread_id: &str,
) -> Result<(), String> {
    let metadata = fs::metadata(source_path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("线程来源文件不是普通文件。".to_string());
    }
    let content = read_session_content(source_path, metadata.len())?.content;
    let actual_thread_id = extract_session_thread_id(&content)
        .ok_or_else(|| "线程来源文件缺少可校验的线程 ID。".to_string())?;
    if actual_thread_id != expected_thread_id {
        return Err(format!(
            "线程 ID 与来源文件内容不一致：请求 {expected_thread_id}，文件 {actual_thread_id}。"
        ));
    }
    Ok(())
}

fn extract_session_thread_id(content: &str) -> Option<String> {
    let trimmed = content.trim();
    if trimmed.is_empty() {
        return None;
    }

    if let Ok(value) = serde_json::from_str::<Value>(trimmed) {
        return extract_thread_id_from_value(&value);
    }

    trimmed
        .lines()
        .filter_map(|line| serde_json::from_str::<Value>(line).ok())
        .find_map(|value| extract_thread_id_from_value(&value))
}

fn extract_thread_id_from_value(value: &Value) -> Option<String> {
    match value {
        Value::Array(items) => items.iter().find_map(extract_thread_id_from_value),
        Value::Object(_) => extract_thread_id_from_object(value),
        _ => None,
    }
}

fn extract_thread_id_from_object(value: &Value) -> Option<String> {
    read_json_string(
        value,
        &[
            "thread_id",
            "threadId",
            "conversation_id",
            "conversationId",
            "session_id",
            "sessionId",
        ],
    )
    .or_else(|| {
        let payload = value.get("payload")?;
        if read_json_string(value, &["type"]).as_deref() == Some("session_meta") {
            read_json_string(
                payload,
                &[
                    "id",
                    "thread_id",
                    "threadId",
                    "conversation_id",
                    "conversationId",
                    "session_id",
                    "sessionId",
                ],
            )
        } else {
            read_json_string(
                payload,
                &[
                    "thread_id",
                    "threadId",
                    "conversation_id",
                    "conversationId",
                    "session_id",
                    "sessionId",
                ],
            )
        }
    })
}

fn read_json_string(value: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| value.get(*key).and_then(Value::as_str))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn session_scan_roots(codex_home: &Path) -> Vec<PathBuf> {
    vec![
        codex_home.join("sessions"),
        codex_home.join("archived_sessions"),
        codex_home.join("archive"),
    ]
}

fn build_session_scan_root_status(
    root: &Path,
    source_file_count: usize,
) -> CodexSessionScanRootStatus {
    let (status, error_message) = match fs::metadata(root) {
        Ok(metadata) if metadata.is_dir() => match fs::read_dir(root) {
            Ok(_) => ("available".to_string(), None),
            Err(error) => ("unreadable".to_string(), Some(error.to_string())),
        },
        Ok(_) => (
            "not_directory".to_string(),
            Some("session scan root is not a directory".to_string()),
        ),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => ("missing".to_string(), None),
        Err(error) => ("unreadable".to_string(), Some(error.to_string())),
    };

    CodexSessionScanRootStatus {
        root_path: root.to_string_lossy().to_string(),
        status,
        source_file_count,
        error_message,
    }
}

pub fn scan_env_conflicts_from_sources(
    process_env: &[(String, String)],
    shell_profiles: &[(PathBuf, String)],
) -> EnvConflictScan {
    let mut conflicts = Vec::new();

    for (name, value) in process_env {
        if is_tracked_openai_env(name) && !value.trim().is_empty() {
            conflicts.push(build_env_conflict(name, value, "process", "process.env"));
        }
    }

    let mut scanned_shell_files = Vec::new();
    for (path, contents) in shell_profiles {
        scanned_shell_files.push(path.to_string_lossy().to_string());

        for (name, value) in parse_shell_profile_env(contents) {
            if is_tracked_openai_env(&name) && !value.trim().is_empty() {
                conflicts.push(build_env_conflict(
                    &name,
                    &value,
                    "shell_profile",
                    &path.to_string_lossy(),
                ));
            }
        }
    }

    EnvConflictScan {
        conflict_count: conflicts.len(),
        scanned_shell_files,
        conflicts,
    }
}

pub fn find_executable_in_path(command_name: &str, path_env: &str) -> Option<PathBuf> {
    std::env::split_paths(path_env).find_map(|directory| {
        let candidate = directory.join(command_name);
        if is_executable_file(&candidate) {
            Some(candidate)
        } else {
            None
        }
    })
}

pub fn build_codex_cli_status(
    command_path: Option<PathBuf>,
    version_output: Option<String>,
    checked_commands: Vec<CliCommandCheck>,
) -> CodexCliStatus {
    let Some(command_path) = command_path else {
        return CodexCliStatus {
            command: "codex".to_string(),
            installed: false,
            version: "".to_string(),
            path: "".to_string(),
            status: "missing".to_string(),
            suggestion: "未找到 codex，请先安装 Codex CLI 或检查 PATH。".to_string(),
            checked_commands,
        };
    };

    let version = version_output.unwrap_or_default();
    let status = if version.trim().is_empty() {
        "unreadable"
    } else {
        "ok"
    };
    let suggestion = if status == "ok" {
        "Codex CLI 可用。"
    } else {
        "已找到 codex，但版本不可读取，请检查权限或 CLI 安装。"
    };

    CodexCliStatus {
        command: "codex".to_string(),
        installed: true,
        version,
        path: command_path.to_string_lossy().to_string(),
        status: status.to_string(),
        suggestion: suggestion.to_string(),
        checked_commands,
    }
}

fn is_executable_file(path: &Path) -> bool {
    if !path.is_file() {
        return false;
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let Ok(metadata) = fs::metadata(path) else {
            return false;
        };
        metadata.permissions().mode() & 0o111 != 0
    }

    #[cfg(not(unix))]
    {
        true
    }
}

fn run_codex_command_check(command_path: &Path, args: &[&str]) -> CliCommandCheck {
    let command = format!("codex {}", args.join(" "));
    match Command::new(command_path).args(args).output() {
        Ok(output) if output.status.success() => CliCommandCheck {
            command,
            available: true,
            status: "ok".to_string(),
            suggestion: "命令可用。".to_string(),
        },
        Ok(output) => CliCommandCheck {
            command,
            available: false,
            status: format!("exit_{}", output.status.code().unwrap_or(-1)),
            suggestion: "命令返回非零状态，请检查 CLI 版本或权限。".to_string(),
        },
        Err(error) => CliCommandCheck {
            command,
            available: false,
            status: "error".to_string(),
            suggestion: format!("命令执行失败：{error}"),
        },
    }
}

fn read_codex_version(command_path: &Path) -> Option<String> {
    Command::new(command_path)
        .arg("--version")
        .output()
        .ok()
        .filter(|output| output.status.success())
        .and_then(|output| String::from_utf8(output.stdout).ok())
        .map(|version| version.trim().to_string())
        .filter(|version| !version.is_empty())
}

fn build_env_conflict(
    variable_name: &str,
    value: &str,
    source: &str,
    source_path: &str,
) -> EnvConflictRecord {
    EnvConflictRecord {
        variable_name: variable_name.to_string(),
        masked_value: mask_env_value(variable_name, value),
        source: source.to_string(),
        source_path: source_path.to_string(),
        risk_level: env_risk_level(variable_name, source).to_string(),
        impact: env_impact(variable_name).to_string(),
        recommended_action: env_recommended_action(source).to_string(),
    }
}

fn is_tracked_openai_env(name: &str) -> bool {
    ENV_CONFLICT_VARIABLES.contains(&name)
}

fn parse_shell_profile_env(contents: &str) -> Vec<(String, String)> {
    contents
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') || trimmed.starts_with("unset ") {
                return None;
            }

            let assignment = trimmed.strip_prefix("export ").unwrap_or(trimmed);
            let (name, raw_value) = assignment.split_once('=')?;
            let name = name.trim();

            if !is_tracked_openai_env(name) {
                return None;
            }

            Some((name.to_string(), clean_shell_value(raw_value)))
        })
        .collect()
}

fn clean_shell_value(raw_value: &str) -> String {
    let without_comment = raw_value
        .split_once(" #")
        .map(|(value, _)| value)
        .unwrap_or(raw_value)
        .trim();
    without_comment
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string()
}

fn mask_env_value(variable_name: &str, value: &str) -> String {
    let trimmed = value.trim();

    if trimmed.is_empty() {
        return "(empty)".to_string();
    }

    if variable_name.contains("KEY") || variable_name.contains("TOKEN") {
        let prefix: String = trimmed.chars().take(4).collect();
        let suffix: String = trimmed
            .chars()
            .rev()
            .take(4)
            .collect::<String>()
            .chars()
            .rev()
            .collect();
        return format!("{prefix}...{suffix}");
    }

    if variable_name.contains("URL") {
        if let Some((scheme, rest)) = trimmed.split_once("://") {
            let host = rest.split('/').next().unwrap_or("***");
            return format!("{scheme}://{host}/***");
        }

        return "***".to_string();
    }

    if trimmed.chars().count() <= 8 {
        return "***".to_string();
    }

    let prefix: String = trimmed.chars().take(4).collect();
    format!("{prefix}...")
}

fn env_risk_level(variable_name: &str, source: &str) -> &'static str {
    match (variable_name, source) {
        ("OPENAI_API_KEY", "shell_profile") | ("OPENAI_BASE_URL", "shell_profile") => "Caution",
        ("OPENAI_API_KEY", _) | ("OPENAI_BASE_URL", _) => "Caution",
        _ => "Safe",
    }
}

fn env_impact(variable_name: &str) -> &'static str {
    match variable_name {
        "OPENAI_API_KEY" => "可能影响 Codex 认证路径。",
        "OPENAI_BASE_URL" => "可能把请求导向非预期 OpenAI-compatible Endpoint。",
        "OPENAI_MODEL" | "OPENAI_DEFAULT_MODEL" => "可能影响默认模型选择。",
        "OPENAI_ORG_ID" | "OPENAI_PROJECT" | "OPENAI_PROJECT_ID" => {
            "可能影响 OpenAI 组织或项目上下文。"
        }
        _ => "可能影响 Codex 行为。",
    }
}

fn env_recommended_action(source: &str) -> &'static str {
    match source {
        "shell_profile" => "确认后迁移到受控配置，或在 shell profile 中注释。",
        _ => "确认当前终端环境是否需要该变量；AIOtto 不会自动修改。",
    }
}

fn inspect_candidate(codex_home: &Path, spec: &KeyFileSpec) -> CodexKeyFileCandidate {
    let path = codex_home.join(spec.relative_path);
    let metadata = fs::metadata(&path);

    match metadata {
        Ok(metadata) => {
            let is_dir = metadata.is_dir();
            let size_bytes = if is_dir {
                directory_size(&path)
            } else {
                metadata.len()
            };

            CodexKeyFileCandidate {
                path: path.to_string_lossy().to_string(),
                relative_path: spec.relative_path.to_string(),
                category: spec.category.to_string(),
                kind: if is_dir { "directory" } else { "file" }.to_string(),
                exists: true,
                size_bytes,
                modified_at_epoch_ms: modified_epoch_ms(&metadata),
                risk_level: risk_level_for(spec.category, true).to_string(),
                protected: spec.protected,
                recommended_action: spec.recommended_action.to_string(),
            }
        }
        Err(_) => CodexKeyFileCandidate {
            path: path.to_string_lossy().to_string(),
            relative_path: spec.relative_path.to_string(),
            category: spec.category.to_string(),
            kind: "missing".to_string(),
            exists: false,
            size_bytes: 0,
            modified_at_epoch_ms: None,
            risk_level: risk_level_for(spec.category, false).to_string(),
            protected: spec.protected,
            recommended_action: "未发现该项，无需处理。".to_string(),
        },
    }
}

fn risk_level_for(category: &str, exists: bool) -> &'static str {
    if !exists {
        return "Unknown";
    }

    match category {
        "sqlite_temp" | "sessions" => "Active",
        "global_state" => "Dangerous",
        "state_db" | "log_db" => "Caution",
        "tui_log" | "logs" | "archive" => "Safe",
        _ => "Unknown",
    }
}

fn directory_size(path: &Path) -> u64 {
    let mut total = 0;
    let mut stack: Vec<PathBuf> = vec![path.to_path_buf()];

    while let Some(current) = stack.pop() {
        let Ok(entries) = fs::read_dir(current) else {
            continue;
        };

        for entry in entries.flatten() {
            let Ok(metadata) = entry.metadata() else {
                continue;
            };

            if metadata.is_dir() {
                stack.push(entry.path());
            } else {
                total += metadata.len();
            }
        }
    }

    total
}

fn collect_session_files(path: &Path, files: &mut Vec<PathBuf>) {
    let Ok(metadata) = fs::metadata(path) else {
        return;
    };

    if metadata.is_file() {
        if is_session_file(path) {
            files.push(path.to_path_buf());
        }
        return;
    }

    if !metadata.is_dir() {
        return;
    }

    let Ok(entries) = fs::read_dir(path) else {
        return;
    };

    for entry in entries.flatten() {
        collect_session_files(&entry.path(), files);
    }
}

fn is_session_file(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|extension| extension.to_str()),
        Some("jsonl") | Some("json")
    )
}

struct SessionContentRead {
    content: String,
    excerpted: bool,
    head_bytes: Option<u64>,
    tail_bytes: Option<u64>,
}

fn read_session_source(path: PathBuf) -> Result<Option<CodexSessionSource>, String> {
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Ok(None);
    }

    let content_read = read_session_content(&path, metadata.len())?;
    Ok(Some(CodexSessionSource {
        source_file: path.to_string_lossy().to_string(),
        content: content_read.content,
        size_bytes: metadata.len(),
        modified_at_epoch_ms: modified_epoch_ms(&metadata),
        content_excerpted: content_read.excerpted,
        excerpt_head_bytes: content_read.head_bytes,
        excerpt_tail_bytes: content_read.tail_bytes,
    }))
}

fn parse_codex_session_meta(path: &Path) -> Result<Option<CodexSessionMeta>, String> {
    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Ok(None);
    }

    let (head, tail) = read_head_tail_lines(
        path,
        SESSION_META_HEAD_LINES,
        SESSION_META_TAIL_LINES,
        SESSION_META_TAIL_BYTES,
    )
    .map_err(|error| error.to_string())?;
    let mut session_id: Option<String> = None;
    let mut project_dir: Option<String> = None;
    let mut created_at: Option<u64> = None;
    let mut first_user_message: Option<String> = None;

    for line in &head {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            continue;
        };

        if created_at.is_none() {
            created_at = read_json_timestamp_ms(&value, &["timestamp", "createdAt", "created_at"]);
        }

        if read_json_string(&value, &["type"]).as_deref() == Some("session_meta") {
            if let Some(payload) = value.get("payload") {
                if is_subagent_source(payload.get("source")) {
                    return Ok(None);
                }
                if session_id.is_none() {
                    session_id = read_json_string(
                        payload,
                        &[
                            "id",
                            "thread_id",
                            "threadId",
                            "conversation_id",
                            "conversationId",
                            "session_id",
                            "sessionId",
                        ],
                    );
                }
                if project_dir.is_none() {
                    project_dir = read_json_string(
                        payload,
                        &[
                            "cwd",
                            "project_path",
                            "projectPath",
                            "workdir",
                            "working_directory",
                        ],
                    );
                }
                if created_at.is_none() {
                    created_at =
                        read_json_timestamp_ms(payload, &["timestamp", "createdAt", "created_at"]);
                }
            }
        } else {
            if session_id.is_none() {
                session_id = extract_thread_id_from_value(&value);
            }
            if project_dir.is_none() {
                project_dir = read_json_string(
                    &value,
                    &[
                        "cwd",
                        "project_path",
                        "projectPath",
                        "workdir",
                        "working_directory",
                    ],
                );
            }
        }

        if first_user_message.is_none()
            && read_json_string(&value, &["type"]).as_deref() == Some("response_item")
        {
            if let Some(payload) = value.get("payload") {
                let payload_type = read_json_string(payload, &["type"]);
                let role = read_json_string(payload, &["role", "author"]);
                if payload_type.as_deref() == Some("message") && role.as_deref() == Some("user") {
                    let text = payload
                        .get("content")
                        .map(extract_session_text)
                        .unwrap_or_default();
                    if let Some(title) = title_candidate_from_user_message(&text) {
                        first_user_message = Some(truncate_text(&title, SESSION_TITLE_MAX_CHARS));
                    }
                }
            }
        }

        if session_id.is_some()
            && project_dir.is_some()
            && created_at.is_some()
            && first_user_message.is_some()
        {
            break;
        }
    }

    let mut last_active_at: Option<u64> = None;
    let mut summary: Option<String> = None;
    for line in tail.iter().rev() {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            continue;
        };

        if last_active_at.is_none() {
            last_active_at =
                read_json_timestamp_ms(&value, &["timestamp", "updatedAt", "updated_at"]);
        }

        if summary.is_none()
            && read_json_string(&value, &["type"]).as_deref() == Some("response_item")
        {
            if let Some(payload) = value.get("payload") {
                if read_json_string(payload, &["type"]).as_deref() == Some("message") {
                    let text = payload
                        .get("content")
                        .map(extract_session_text)
                        .unwrap_or_default();
                    if !text.trim().is_empty() {
                        summary = Some(truncate_text(&text, 160));
                    }
                }
            }
        }

        if last_active_at.is_some() && summary.is_some() {
            break;
        }
    }

    let session_id = session_id
        .or_else(|| {
            path.file_stem()
                .and_then(|stem| stem.to_str())
                .map(ToString::to_string)
        })
        .ok_or_else(|| "session metadata is missing a session id".to_string())?;

    let title = first_user_message.or_else(|| {
        project_dir
            .as_deref()
            .and_then(path_basename)
            .map(ToString::to_string)
    });
    let source_path = path.to_string_lossy().to_string();

    Ok(Some(CodexSessionMeta {
        source_id: "codex".to_string(),
        session_id: session_id.clone(),
        title,
        summary,
        project_dir,
        created_at,
        last_active_at: last_active_at.or(created_at),
        source_path,
        source_size_bytes: metadata.len(),
        source_modified_at: modified_epoch_ms(&metadata),
        resume_command: Some(format!("codex resume {session_id}")),
        message_count_estimate: None,
        indexed_at: now_epoch_ms(),
    }))
}

pub fn load_codex_session_messages_in(
    codex_home: &Path,
    source_path: &Path,
) -> Result<Vec<CodexSessionMessage>, String> {
    validate_session_source_in_roots(codex_home, source_path)?;
    let file = fs::File::open(source_path).map_err(|error| error.to_string())?;
    let reader = BufReader::new(file);
    let mut messages = Vec::new();

    for line in reader.lines() {
        let line = match line {
            Ok(line) => line,
            Err(_) => continue,
        };
        let value = match serde_json::from_str::<Value>(&line) {
            Ok(value) => value,
            Err(_) => continue,
        };

        if read_json_string(&value, &["type"]).as_deref() != Some("response_item") {
            continue;
        }
        let Some(payload) = value.get("payload") else {
            continue;
        };
        let payload_type = read_json_string(payload, &["type"]).unwrap_or_default();
        let (role, content) = match payload_type.as_str() {
            "message" => {
                let role = read_json_string(payload, &["role", "author"])
                    .unwrap_or_else(|| "unknown".to_string());
                let content = payload
                    .get("content")
                    .map(extract_session_text)
                    .unwrap_or_default();
                (role, content)
            }
            "function_call" => {
                let name =
                    read_json_string(payload, &["name"]).unwrap_or_else(|| "unknown".to_string());
                ("assistant".to_string(), format!("[Tool: {name}]"))
            }
            "function_call_output" => {
                let content = payload
                    .get("output")
                    .and_then(Value::as_str)
                    .map(ToString::to_string)
                    .unwrap_or_default();
                ("tool".to_string(), content)
            }
            _ => continue,
        };

        if content.trim().is_empty() {
            continue;
        }
        messages.push(CodexSessionMessage {
            role,
            content,
            ts: read_json_timestamp_ms(&value, &["timestamp", "createdAt", "created_at"]),
        });
    }

    Ok(messages)
}

fn validate_session_source_in_roots(codex_home: &Path, source_path: &Path) -> Result<(), String> {
    let metadata = fs::metadata(source_path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("线程来源文件不是普通文件。".to_string());
    }

    let normalized_source = normalize_path(source_path);
    for root in session_scan_roots(codex_home) {
        let normalized_root = normalize_path(&root);
        if normalized_source.starts_with(&normalized_root) {
            return Ok(());
        }
    }

    Err("线程来源文件必须位于 Codex Home 的 sessions 或 archive 目录内。".to_string())
}

fn read_head_tail_lines(
    path: &Path,
    head_n: usize,
    tail_n: usize,
    tail_bytes: u64,
) -> std::io::Result<(Vec<String>, Vec<String>)> {
    let file = fs::File::open(path)?;
    let file_len = file.metadata()?.len();

    if file_len < 16_384 {
        let reader = BufReader::new(file);
        let all = reader.lines().map_while(Result::ok).collect::<Vec<_>>();
        let head = all.iter().take(head_n).cloned().collect();
        let skip = all.len().saturating_sub(tail_n);
        let tail = all.into_iter().skip(skip).collect();
        return Ok((head, tail));
    }

    let reader = BufReader::new(file);
    let head = reader
        .lines()
        .take(head_n)
        .map_while(Result::ok)
        .collect::<Vec<_>>();

    let seek_pos = file_len.saturating_sub(tail_bytes);
    let mut tail_file = fs::File::open(path)?;
    tail_file.seek(SeekFrom::Start(seek_pos))?;
    let tail_reader = BufReader::new(tail_file);
    let all_tail = tail_reader
        .lines()
        .map_while(Result::ok)
        .collect::<Vec<_>>();
    let skip_first = if seek_pos > 0 { 1 } else { 0 };
    let usable = all_tail.into_iter().skip(skip_first).collect::<Vec<_>>();
    let skip = usable.len().saturating_sub(tail_n);
    let tail = usable.into_iter().skip(skip).collect();

    Ok((head, tail))
}

fn read_json_timestamp_ms(value: &Value, keys: &[&str]) -> Option<u64> {
    keys.iter()
        .find_map(|key| value.get(*key))
        .and_then(parse_timestamp_ms)
}

fn parse_timestamp_ms(value: &Value) -> Option<u64> {
    if let Some(value) = value.as_u64() {
        return Some(if value > 1_000_000_000_000 {
            value
        } else {
            value * 1000
        });
    }
    if let Some(value) = value.as_i64() {
        if value < 0 {
            return None;
        }
        let value = value as u64;
        return Some(if value > 1_000_000_000_000 {
            value
        } else {
            value * 1000
        });
    }
    if let Some(value) = value.as_f64() {
        if value < 0.0 {
            return None;
        }
        let value = value as u64;
        return Some(if value > 1_000_000_000_000 {
            value
        } else {
            value * 1000
        });
    }

    let raw = value.as_str()?.trim();
    chrono::DateTime::parse_from_rfc3339(raw)
        .ok()
        .map(|value| value.timestamp_millis().max(0) as u64)
}

fn extract_session_text(value: &Value) -> String {
    match value {
        Value::String(text) => text.trim().to_string(),
        Value::Array(items) => items
            .iter()
            .filter_map(extract_session_text_from_item)
            .filter(|text| !text.trim().is_empty())
            .collect::<Vec<_>>()
            .join("\n"),
        Value::Object(_) => read_json_string(value, &["text", "input_text", "output_text"])
            .or_else(|| value.get("content").map(extract_session_text))
            .unwrap_or_default(),
        _ => String::new(),
    }
}

fn extract_session_text_from_item(item: &Value) -> Option<String> {
    let item_type = read_json_string(item, &["type"]).unwrap_or_default();
    if item_type == "tool_use" {
        let name = read_json_string(item, &["name"]).unwrap_or_else(|| "unknown".to_string());
        return Some(format!("[Tool: {name}]"));
    }
    if item_type == "tool_result" {
        return item
            .get("content")
            .map(extract_session_text)
            .filter(|text| !text.trim().is_empty());
    }
    read_json_string(item, &["text", "input_text", "output_text"])
        .or_else(|| item.get("content").map(extract_session_text))
        .filter(|text| !text.trim().is_empty())
}

fn is_subagent_source(source: Option<&Value>) -> bool {
    source
        .and_then(Value::as_object)
        .map(|source| source.contains_key("subagent"))
        .unwrap_or(false)
}

fn title_candidate_from_user_message(text: &str) -> Option<String> {
    let compact = text.trim();
    if compact.is_empty()
        || compact.starts_with("<environment_context>")
        || compact.starts_with("# AGENTS.md")
    {
        return None;
    }

    if compact.starts_with(CODEX_IDE_CONTEXT_PREFIX) {
        return extract_codex_prompt_from_ide_context(compact);
    }

    Some(compact.to_string())
}

fn extract_codex_prompt_from_ide_context(text: &str) -> Option<String> {
    let compact = text.trim();
    if !compact.starts_with(CODEX_IDE_CONTEXT_PREFIX) {
        return None;
    }

    let normalized = compact.replace("\r\n", "\n");
    let lines = normalized.lines().collect::<Vec<_>>();
    let mut prompt: Option<String> = None;

    for (index, line) in lines.iter().enumerate() {
        let Some(inline_prompt) = codex_request_heading_payload(line) else {
            continue;
        };

        if !inline_prompt.is_empty() {
            prompt = Some(inline_prompt);
            continue;
        }

        let following_prompt = lines[index + 1..].join("\n").trim().to_string();
        if !following_prompt.is_empty() {
            prompt = Some(following_prompt);
        }
    }

    prompt
}

fn codex_request_heading_payload(line: &str) -> Option<String> {
    let trimmed = line.trim();
    if !trimmed.starts_with('#') {
        return None;
    }

    let heading = trimmed.trim_start_matches('#').trim_start();
    let lowered = heading.to_ascii_lowercase();
    if !lowered.starts_with(CODEX_REQUEST_MARKER) {
        return None;
    }

    let suffix = heading[CODEX_REQUEST_MARKER.len()..].trim_start();
    if suffix.is_empty() {
        return Some(String::new());
    }

    let separator = suffix.chars().next()?;
    if !matches!(separator, ':' | '：' | '-' | '—') {
        return None;
    }

    Some(
        suffix
            .trim_start_matches(|c: char| c.is_whitespace() || matches!(c, ':' | '：' | '-' | '—'))
            .trim()
            .to_string(),
    )
}

fn truncate_text(text: &str, max_chars: usize) -> String {
    let compact = text.split_whitespace().collect::<Vec<_>>().join(" ");
    let char_count = compact.chars().count();
    if char_count <= max_chars {
        return compact;
    }
    let truncated = compact.chars().take(max_chars).collect::<String>();
    format!("{truncated}...")
}

fn path_basename(path: &str) -> Option<&str> {
    Path::new(path)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
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

fn now_epoch_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

fn read_session_content(path: &Path, size_bytes: u64) -> Result<SessionContentRead, String> {
    const MAX_FULL_SESSION_FILE_BYTES: u64 = 10 * 1024 * 1024;
    const SESSION_EXCERPT_BYTES: u64 = 64 * 1024;

    if size_bytes <= MAX_FULL_SESSION_FILE_BYTES {
        return fs::read_to_string(path)
            .map(|content| SessionContentRead {
                content,
                excerpted: false,
                head_bytes: None,
                tail_bytes: None,
            })
            .map_err(|error| error.to_string());
    }

    let mut file = fs::File::open(path).map_err(|error| error.to_string())?;
    let head_bytes = SESSION_EXCERPT_BYTES.min(size_bytes);
    let tail_bytes = SESSION_EXCERPT_BYTES.min(size_bytes.saturating_sub(head_bytes));
    let head_len = head_bytes as usize;
    let tail_len = tail_bytes as usize;

    let mut head = vec![0; head_len];
    file.read_exact(&mut head)
        .map_err(|error| error.to_string())?;

    let mut tail = vec![0; tail_len];
    if tail_len > 0 {
        file.seek(SeekFrom::End(-(tail_len as i64)))
            .map_err(|error| error.to_string())?;
        file.read_exact(&mut tail)
            .map_err(|error| error.to_string())?;
    }

    let head_text = String::from_utf8_lossy(&head);
    let tail_text = String::from_utf8_lossy(&tail);
    Ok(SessionContentRead {
        content: format!("{head_text}\n{tail_text}"),
        excerpted: true,
        head_bytes: Some(head_bytes),
        tail_bytes: Some(tail_bytes),
    })
}

fn modified_epoch_ms(metadata: &fs::Metadata) -> Option<u64> {
    metadata
        .modified()
        .ok()
        .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64)
}

#[tauri::command]
pub fn detect_codex_home(manual_path: Option<String>) -> CodexHomeStatus {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);
    let path = Path::new(&resolved);

    classify_codex_home(&resolved, path.exists(), path.is_dir())
}

#[tauri::command]
pub fn scan_codex_home(manual_path: Option<String>) -> CodexKeyFileScan {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);

    scan_codex_key_files(Path::new(&resolved))
}

#[tauri::command]
pub fn scan_codex_sessions(manual_path: Option<String>) -> Result<CodexSessionSourceScan, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);

    scan_codex_session_source_scan(Path::new(&resolved))
}

#[tauri::command]
pub async fn list_codex_sessions(
    manual_path: Option<String>,
) -> Result<CodexSessionMetaScan, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);
    let codex_home = PathBuf::from(resolved);

    tauri::async_runtime::spawn_blocking(move || list_codex_session_meta_scan(&codex_home))
        .await
        .map_err(|error| format!("Failed to list Codex sessions: {error}"))?
}

#[tauri::command]
pub async fn get_codex_session_messages(
    manual_path: Option<String>,
    source_path: String,
) -> Result<Vec<CodexSessionMessage>, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);
    let codex_home = PathBuf::from(resolved);
    let source_path = PathBuf::from(source_path);

    tauri::async_runtime::spawn_blocking(move || {
        load_codex_session_messages_in(&codex_home, &source_path)
    })
    .await
    .map_err(|error| format!("Failed to load Codex session messages: {error}"))?
}

#[tauri::command]
pub fn apply_codex_thread_file_action(
    request: ThreadFileActionRequest,
) -> Result<ThreadFileActionResult, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(request.manual_path.as_deref(), &home_dir);
    let codex_home = Path::new(&resolved);
    let backup_root = codex_home.join(".aiotto/backups");

    apply_codex_thread_file_action_in(codex_home, &backup_root, request)
}

#[tauri::command]
pub fn scan_codex_env_conflicts() -> EnvConflictScan {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let process_env: Vec<(String, String)> = std::env::vars().collect();
    let shell_profiles: Vec<(PathBuf, String)> = SHELL_PROFILE_FILES
        .iter()
        .filter_map(|relative_path| {
            let path = Path::new(&home_dir).join(relative_path);
            fs::read_to_string(&path)
                .ok()
                .map(|contents| (path, contents))
        })
        .collect();

    scan_env_conflicts_from_sources(&process_env, &shell_profiles)
}

#[tauri::command]
pub fn check_codex_cli_status() -> CodexCliStatus {
    let path_env = std::env::var("PATH").unwrap_or_default();
    let command_path = find_executable_in_path("codex", &path_env);
    let checked_commands = command_path
        .as_deref()
        .map(|path| {
            vec![
                run_codex_command_check(path, &["--version"]),
                run_codex_command_check(path, &["--help"]),
                run_codex_command_check(path, &["resume", "--help"]),
            ]
        })
        .unwrap_or_default();
    let version_output = command_path.as_deref().and_then(read_codex_version);

    build_codex_cli_status(command_path, version_output, checked_commands)
}
