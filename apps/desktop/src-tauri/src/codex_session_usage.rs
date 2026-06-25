use crate::codex_home::resolve_codex_home;
use chrono::{Duration as ChronoDuration, Local, NaiveDate, TimeZone};
use rusqlite::{Connection, OptionalExtension, params, params_from_iter, types::Value as SqlValue};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::BTreeMap,
    fs,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

const SESSION_USAGE_SYNC_INTERVAL_SECS: u64 = 60;
const SESSION_USAGE_DB_RELATIVE_PATH: &str = ".aiotto/session-usage.sqlite";
const TREND_HOUR_SECONDS: i64 = 60 * 60;
const TREND_DAY_SECONDS: i64 = 24 * TREND_HOUR_SECONDS;
const MAX_TREND_BUCKETS: i64 = 400;

static SESSION_USAGE_SYNC_RUNNING: AtomicBool = AtomicBool::new(false);
const EXTERNAL_MODEL_PATTERN_SQL: &str =
    "(model LIKE 'aiotto_external_%' OR model LIKE 'legacy_external_%')";

const MODEL_PRICING_SEEDS: &[(&str, &str, &str, &str, &str, &str)] = &[
    ("gpt-5.5", "GPT 5.5", "5", "30", "0.50", "0"),
    ("gpt-5.5-low", "GPT 5.5 Low", "5", "30", "0.50", "0"),
    ("gpt-5.5-medium", "GPT 5.5 Medium", "5", "30", "0.50", "0"),
    ("gpt-5.5-high", "GPT 5.5 High", "5", "30", "0.50", "0"),
    ("gpt-5.5-xhigh", "GPT 5.5 XHigh", "5", "30", "0.50", "0"),
    ("gpt-5.5-minimal", "GPT 5.5 Minimal", "5", "30", "0.50", "0"),
    ("gpt-5.4", "GPT 5.4", "2.50", "15", "0.25", "0"),
    ("gpt-5.4-mini", "GPT 5.4 Mini", "0.75", "4.50", "0.075", "0"),
    ("gpt-5.4-nano", "GPT 5.4 Nano", "0.20", "1.25", "0.02", "0"),
    ("gpt-5.2", "GPT 5.2", "1.75", "14", "0.175", "0"),
    ("gpt-5.2-low", "GPT 5.2 Low", "1.75", "14", "0.175", "0"),
    (
        "gpt-5.2-medium",
        "GPT 5.2 Medium",
        "1.75",
        "14",
        "0.175",
        "0",
    ),
    ("gpt-5.2-high", "GPT 5.2 High", "1.75", "14", "0.175", "0"),
    ("gpt-5.2-xhigh", "GPT 5.2 XHigh", "1.75", "14", "0.175", "0"),
    ("gpt-5.2-codex", "GPT 5.2 Codex", "1.75", "14", "0.175", "0"),
    ("gpt-5.1", "GPT 5.1", "1.25", "10", "0.125", "0"),
    ("gpt-5.1-low", "GPT 5.1 Low", "1.25", "10", "0.125", "0"),
    (
        "gpt-5.1-medium",
        "GPT 5.1 Medium",
        "1.25",
        "10",
        "0.125",
        "0",
    ),
    ("gpt-5.1-high", "GPT 5.1 High", "1.25", "10", "0.125", "0"),
    (
        "gpt-5.1-minimal",
        "GPT 5.1 Minimal",
        "1.25",
        "10",
        "0.125",
        "0",
    ),
    ("gpt-5.1-codex", "GPT 5.1 Codex", "1.25", "10", "0.125", "0"),
    ("gpt-4.1", "GPT 4.1", "2", "8", "0.50", "0"),
    ("gpt-4.1-mini", "GPT 4.1 Mini", "0.40", "1.60", "0.10", "0"),
    ("gpt-4.1-nano", "GPT 4.1 Nano", "0.10", "0.40", "0.025", "0"),
];

#[derive(Debug, Clone, Copy)]
struct ModelPricing {
    input_cost_per_million: f64,
    output_cost_per_million: f64,
    cache_read_cost_per_million: f64,
    cache_creation_cost_per_million: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageModelPricingInfo {
    pub model_id: String,
    pub display_name: String,
    pub input_cost_per_million: String,
    pub output_cost_per_million: String,
    pub cache_read_cost_per_million: String,
    pub cache_creation_cost_per_million: String,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageModelPricingUpdate {
    pub model_id: String,
    pub display_name: String,
    pub input_cost: String,
    pub output_cost: String,
    pub cache_read_cost: String,
    pub cache_creation_cost: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageSyncResult {
    pub imported: u32,
    pub skipped: u32,
    pub files_scanned: u32,
    pub errors: Vec<String>,
    pub database_path: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
struct CumulativeTokens {
    input: u64,
    cached_input: u64,
    output: u64,
    total: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct DeltaTokens {
    input: u32,
    cached_input: u32,
    output: u32,
    total: u32,
}

impl DeltaTokens {
    fn is_zero(&self) -> bool {
        self.input == 0 && self.cached_input == 0 && self.output == 0 && self.total == 0
    }
}

#[derive(Debug, Clone)]
struct FileParseState {
    session_id: Option<String>,
    current_model: String,
    prev_total: Option<CumulativeTokens>,
    event_index: u32,
    subagent_session: bool,
}

pub fn codex_session_usage_db_path(codex_home: &Path) -> PathBuf {
    codex_home.join(SESSION_USAGE_DB_RELATIVE_PATH)
}

pub fn start_codex_session_usage_background_sync(manual_path: Option<PathBuf>) {
    if SESSION_USAGE_SYNC_RUNNING.swap(true, Ordering::SeqCst) {
        return;
    }

    thread::spawn(move || {
        let codex_home = match manual_path {
            Some(path) => path,
            None => {
                let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
                PathBuf::from(resolve_codex_home(None, &home_dir))
            }
        };

        if let Err(error) = sync_codex_session_usage_in(&codex_home) {
            log::warn!("[codex-session-usage] initial sync failed: {error}");
        }

        loop {
            thread::sleep(Duration::from_secs(SESSION_USAGE_SYNC_INTERVAL_SECS));
            if let Err(error) = sync_codex_session_usage_in(&codex_home) {
                log::warn!("[codex-session-usage] periodic sync failed: {error}");
            }
        }
    });
}

#[tauri::command]
pub async fn sync_codex_session_usage(
    manual_path: Option<String>,
) -> Result<CodexSessionUsageSyncResult, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);
    let codex_home = PathBuf::from(resolved);

    tauri::async_runtime::spawn_blocking(move || sync_codex_session_usage_in(&codex_home))
        .await
        .map_err(|error| format!("Failed to sync Codex session usage: {error}"))?
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageDashboardQuery {
    pub manual_path: Option<String>,
    pub range: Option<String>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub source_filter: Option<String>,
    pub provider_id: Option<String>,
    pub model: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageDashboardSnapshot {
    pub source_label: String,
    pub database_path: String,
    pub summary: CodexSessionUsageDashboardSummary,
    pub trend_points: Vec<CodexSessionUsageTrendPoint>,
    pub provider_rows: Vec<CodexSessionUsageProviderRow>,
    pub model_rows: Vec<CodexSessionUsageModelRow>,
    pub request_log_page: CodexSessionUsageRequestLogPage,
    pub available_provider_options: Vec<CodexSessionUsageFilterOption>,
    pub available_model_options: Vec<CodexSessionUsageFilterOption>,
    pub sync: CodexSessionUsageDashboardSyncMeta,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageDashboardSummary {
    pub total_requests: u64,
    pub total_tokens: u64,
    pub total_input_tokens: u64,
    pub total_output_tokens: u64,
    pub total_cache_read_tokens: u64,
    pub total_cache_creation_tokens: u64,
    pub total_cost_usd: String,
    pub success_rate: f64,
    pub cache_hit_rate: f64,
    pub distinct_session_count: u64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageTrendPoint {
    pub date: String,
    pub label: String,
    pub request_count: u64,
    pub total_tokens: u64,
    pub total_input_tokens: u64,
    pub total_output_tokens: u64,
    pub total_cache_read_tokens: u64,
    pub total_cache_creation_tokens: u64,
    pub total_cost_usd: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageProviderRow {
    pub provider_id: String,
    pub provider_name: String,
    pub request_count: u64,
    pub total_tokens: u64,
    pub total_cost_usd: String,
    pub success_rate: f64,
    pub avg_latency_ms: u64,
    pub share_ratio: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageModelRow {
    pub model: String,
    pub request_count: u64,
    pub total_tokens: u64,
    pub total_cost_usd: String,
    pub avg_cost_per_request_usd: String,
    pub share_ratio: f64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageRequestLogPage {
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
    pub rows: Vec<CodexSessionUsageRequestLogRow>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageRequestLogRow {
    pub request_id: String,
    pub provider_id: String,
    pub provider_name: String,
    pub app_type: String,
    pub model: String,
    pub request_model: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_read_tokens: u64,
    pub cache_creation_tokens: u64,
    pub total_tokens: u64,
    pub total_cost_usd: String,
    pub latency_ms: u64,
    pub status_code: u16,
    pub error_message: Option<String>,
    pub session_id: Option<String>,
    pub created_at: i64,
    pub data_source: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageFilterOption {
    pub value: String,
    pub label: String,
    pub request_count: u64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexSessionUsageDashboardSyncMeta {
    pub imported: u32,
    pub skipped: u32,
    pub files_scanned: u32,
}

#[tauri::command]
pub async fn read_codex_session_usage_dashboard(
    query: CodexSessionUsageDashboardQuery,
) -> Result<CodexSessionUsageDashboardSnapshot, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(query.manual_path.as_deref(), &home_dir);
    let codex_home = PathBuf::from(resolved);

    tauri::async_runtime::spawn_blocking(move || {
        read_codex_session_usage_dashboard_in(&codex_home, query)
    })
    .await
    .map_err(|error| format!("Failed to read Codex session usage dashboard: {error}"))?
}

#[tauri::command]
pub async fn get_model_pricing() -> Result<Vec<CodexSessionUsageModelPricingInfo>, String> {
    let codex_home = default_codex_home();
    tauri::async_runtime::spawn_blocking(move || {
        read_codex_session_usage_model_pricing_in(&codex_home)
    })
    .await
    .map_err(|error| format!("Failed to read model pricing: {error}"))?
}

#[tauri::command]
pub async fn update_model_pricing(
    model_id: String,
    display_name: String,
    input_cost: String,
    output_cost: String,
    cache_read_cost: String,
    cache_creation_cost: String,
) -> Result<(), String> {
    let codex_home = default_codex_home();
    tauri::async_runtime::spawn_blocking(move || {
        update_codex_session_usage_model_pricing_in(
            &codex_home,
            CodexSessionUsageModelPricingUpdate {
                model_id,
                display_name,
                input_cost,
                output_cost,
                cache_read_cost,
                cache_creation_cost,
            },
        )
    })
    .await
    .map_err(|error| format!("Failed to update model pricing: {error}"))?
}

#[tauri::command]
pub async fn delete_model_pricing(model_id: String) -> Result<(), String> {
    let codex_home = default_codex_home();
    tauri::async_runtime::spawn_blocking(move || {
        delete_codex_session_usage_model_pricing_in(&codex_home, &model_id)
    })
    .await
    .map_err(|error| format!("Failed to delete model pricing: {error}"))?
}

#[tauri::command]
pub async fn get_default_cost_multiplier(app_type: String) -> Result<String, String> {
    let codex_home = default_codex_home();
    tauri::async_runtime::spawn_blocking(move || {
        get_codex_session_usage_default_cost_multiplier_in(&codex_home, &app_type)
    })
    .await
    .map_err(|error| format!("Failed to read default cost multiplier: {error}"))?
}

#[tauri::command]
pub async fn set_default_cost_multiplier(app_type: String, value: String) -> Result<(), String> {
    let codex_home = default_codex_home();
    tauri::async_runtime::spawn_blocking(move || {
        set_codex_session_usage_default_cost_multiplier_in(&codex_home, &app_type, &value)
    })
    .await
    .map_err(|error| format!("Failed to save default cost multiplier: {error}"))?
}

#[tauri::command]
pub async fn get_pricing_model_source(app_type: String) -> Result<String, String> {
    let codex_home = default_codex_home();
    tauri::async_runtime::spawn_blocking(move || {
        get_codex_session_usage_pricing_model_source_in(&codex_home, &app_type)
    })
    .await
    .map_err(|error| format!("Failed to read pricing model source: {error}"))?
}

#[tauri::command]
pub async fn set_pricing_model_source(app_type: String, value: String) -> Result<(), String> {
    let codex_home = default_codex_home();
    tauri::async_runtime::spawn_blocking(move || {
        set_codex_session_usage_pricing_model_source_in(&codex_home, &app_type, &value)
    })
    .await
    .map_err(|error| format!("Failed to save pricing model source: {error}"))?
}

fn default_codex_home() -> PathBuf {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(resolve_codex_home(None, &home_dir))
}

pub fn sync_codex_session_usage_in(
    codex_home: &Path,
) -> Result<CodexSessionUsageSyncResult, String> {
    let database_path = codex_session_usage_db_path(codex_home);
    let conn = open_usage_db(&database_path)?;
    ensure_usage_schema(&conn)?;

    let files = collect_codex_session_usage_files(codex_home);
    let mut result = CodexSessionUsageSyncResult {
        imported: 0,
        skipped: 0,
        files_scanned: files.len() as u32,
        errors: Vec::new(),
        database_path: database_path.to_string_lossy().to_string(),
    };

    for file_path in files {
        match sync_single_codex_usage_file(&conn, &file_path) {
            Ok((imported, skipped)) => {
                result.imported += imported;
                result.skipped += skipped;
            }
            Err(error) => {
                let message = format!("{}: {error}", file_path.to_string_lossy());
                log::warn!("[codex-session-usage] {message}");
                result.errors.push(message);
            }
        }
    }

    if let Some(legacy_history_db_path) = legacy_usage_history_db_path(codex_home) {
        if legacy_history_db_path.exists() {
            match backfill_legacy_usage_history_rows(&conn, &legacy_history_db_path) {
                Ok(imported) => {
                    result.imported += imported;
                }
                Err(error) => {
                    let message = format!(
                        "旧统计数据库历史用量回填失败 {}: {error}",
                        legacy_history_db_path.to_string_lossy()
                    );
                    log::warn!("[codex-session-usage] {message}");
                    result.errors.push(message);
                }
            }
        }
    }

    Ok(result)
}

fn open_usage_db(path: &Path) -> Result<Connection, String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let conn = Connection::open(path).map_err(|error| error.to_string())?;
    conn.busy_timeout(Duration::from_secs(5))
        .map_err(|error| error.to_string())?;
    Ok(conn)
}

fn ensure_usage_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS session_log_sync (
            file_path TEXT PRIMARY KEY,
            last_modified INTEGER NOT NULL,
            last_line_offset INTEGER NOT NULL,
            last_synced_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS proxy_request_logs (
            request_id TEXT PRIMARY KEY,
            provider_id TEXT NOT NULL,
            app_type TEXT NOT NULL,
            model TEXT NOT NULL,
            request_model TEXT NOT NULL,
            input_tokens INTEGER NOT NULL,
            output_tokens INTEGER NOT NULL,
            cache_read_tokens INTEGER NOT NULL,
            cache_creation_tokens INTEGER NOT NULL,
            total_tokens INTEGER NOT NULL,
            total_cost_usd TEXT NOT NULL,
            latency_ms INTEGER NOT NULL,
            status_code INTEGER NOT NULL,
            error_message TEXT,
            session_id TEXT,
            file_path TEXT NOT NULL,
            line_offset INTEGER NOT NULL,
            provider_type TEXT,
            is_streaming INTEGER NOT NULL,
            cost_multiplier TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            data_source TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_proxy_request_logs_data_source
            ON proxy_request_logs(data_source, created_at);
        CREATE INDEX IF NOT EXISTS idx_proxy_request_logs_session_id
            ON proxy_request_logs(session_id);

        CREATE TABLE IF NOT EXISTS model_pricing (
            model_id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL DEFAULT '',
            input_cost_per_million TEXT NOT NULL,
            output_cost_per_million TEXT NOT NULL,
            cache_read_cost_per_million TEXT NOT NULL DEFAULT '0',
            cache_creation_cost_per_million TEXT NOT NULL DEFAULT '0'
        );

        CREATE TABLE IF NOT EXISTS proxy_config (
            app_type TEXT PRIMARY KEY,
            default_cost_multiplier TEXT NOT NULL DEFAULT '1',
            pricing_model_source TEXT NOT NULL DEFAULT 'response',
            updated_at INTEGER NOT NULL DEFAULT 0
        );
        "#,
    )
    .map_err(|error| error.to_string())?;

    ensure_model_pricing_display_name_column(conn)?;
    seed_proxy_config(conn)?;
    seed_model_pricing(conn)
}

fn ensure_model_pricing_display_name_column(conn: &Connection) -> Result<(), String> {
    if table_column_exists(conn, "model_pricing", "display_name")? {
        return Ok(());
    }

    conn.execute(
        "ALTER TABLE model_pricing ADD COLUMN display_name TEXT NOT NULL DEFAULT ''",
        [],
    )
    .map(|_| ())
    .map_err(|error| error.to_string())
}

fn table_column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({table})"))
        .map_err(|error| error.to_string())?;
    let columns = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    Ok(columns.iter().any(|name| name == column))
}

fn seed_proxy_config(conn: &Connection) -> Result<(), String> {
    for app_type in ["claude", "codex", "gemini"] {
        conn.execute(
            "INSERT OR IGNORE INTO proxy_config (
                app_type, default_cost_multiplier, pricing_model_source, updated_at
             ) VALUES (?1, '1', 'response', ?2)",
            params![app_type, now_epoch_seconds()],
        )
        .map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn collect_codex_session_usage_files(codex_home: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    let sessions_dir = codex_home.join("sessions");
    if sessions_dir.is_dir() {
        collect_jsonl_recursive(&sessions_dir, &mut files, 0, 3);
    }

    for flat_dir in [
        codex_home.join("archived_sessions"),
        codex_home.join("archive"),
    ] {
        if flat_dir.is_dir() {
            push_jsonl_children(&flat_dir, &mut files);
        }
    }

    files.sort();
    files.dedup();
    files
}

fn collect_jsonl_recursive(dir: &Path, files: &mut Vec<PathBuf>, depth: u32, max_depth: u32) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() && depth < max_depth {
            collect_jsonl_recursive(&path, files, depth + 1, max_depth);
        } else if path.extension().and_then(|extension| extension.to_str()) == Some("jsonl") {
            files.push(path);
        }
    }
}

fn push_jsonl_children(dir: &Path, files: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|extension| extension.to_str()) == Some("jsonl") {
            files.push(path);
        }
    }
}

fn sync_single_codex_usage_file(conn: &Connection, file_path: &Path) -> Result<(u32, u32), String> {
    let file_path_text = file_path.to_string_lossy().to_string();
    let metadata = fs::metadata(file_path).map_err(|error| error.to_string())?;
    let file_modified = metadata_modified_nanos(&metadata);
    let (last_modified, last_offset) = get_sync_state(conn, &file_path_text)?;

    if file_modified <= last_modified {
        return Ok((0, 0));
    }

    let file = fs::File::open(file_path).map_err(|error| error.to_string())?;
    let reader = BufReader::new(file);
    let mut state = FileParseState {
        session_id: None,
        current_model: "unknown".to_string(),
        prev_total: None,
        event_index: 0,
        subagent_session: false,
    };
    let mut line_offset: i64 = 0;
    let mut pending = Vec::new();

    for line_result in reader.lines() {
        line_offset += 1;
        let line = match line_result {
            Ok(line) => line,
            Err(_) => continue,
        };
        if line.trim().is_empty() {
            continue;
        }

        let is_event_msg = line.contains("\"event_msg\"");
        let is_turn_context = line.contains("\"turn_context\"");
        let is_session_meta = line.contains("\"session_meta\"");
        if !is_event_msg && !is_turn_context && !is_session_meta {
            continue;
        }
        if is_event_msg && !line.contains("\"token_count\"") {
            continue;
        }

        let Ok(value) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        let event_type = value.get("type").and_then(Value::as_str).unwrap_or("");

        match event_type {
            "session_meta" if state.session_id.is_none() => {
                if let Some(payload) = value.get("payload") {
                    state.subagent_session = is_subagent_session_meta(payload);
                    state.session_id = read_string(
                        payload,
                        &["session_id", "sessionId", "id", "thread_id", "threadId"],
                    );
                }
            }
            "turn_context" => {
                if let Some(payload) = value.get("payload") {
                    if let Some(model) = read_string(payload, &["model"]).or_else(|| {
                        payload
                            .get("info")
                            .and_then(|info| read_string(info, &["model"]))
                    }) {
                        state.current_model = normalize_codex_model(&model);
                    }
                }
            }
            "event_msg" => {
                let Some(payload) = value.get("payload") else {
                    continue;
                };
                if payload.get("type").and_then(Value::as_str) != Some("token_count") {
                    continue;
                }
                let Some(info) = payload.get("info").filter(|info| !info.is_null()) else {
                    continue;
                };
                if let Some(model) = read_string(info, &["model", "model_name"])
                    .or_else(|| read_string(payload, &["model"]))
                {
                    state.current_model = normalize_codex_model(&model);
                }

                let (tokens, cumulative) = if let Some(total) = info.get("total_token_usage") {
                    (parse_tokens(total), true)
                } else if let Some(last) = info.get("last_token_usage") {
                    (parse_tokens(last), false)
                } else {
                    (None, false)
                };
                let Some(tokens) = tokens else {
                    continue;
                };
                let mut delta = if cumulative {
                    let delta = compute_delta(state.prev_total.as_ref(), &tokens);
                    state.prev_total = Some(tokens);
                    delta
                } else {
                    DeltaTokens {
                        input: to_u32(tokens.input),
                        cached_input: to_u32(tokens.cached_input),
                        output: to_u32(tokens.output),
                        total: to_u32(tokens.total),
                    }
                };
                delta.cached_input = delta.cached_input.min(delta.input);
                if delta.is_zero() {
                    continue;
                }

                state.event_index += 1;
                if line_offset <= last_offset {
                    continue;
                }

                pending.push(PendingUsageInsert {
                    request_id: format!(
                        "codex_session:{}:{}",
                        state.session_id.as_deref().unwrap_or("unknown"),
                        state.event_index
                    ),
                    session_id: state.session_id.clone(),
                    model: state.current_model.clone(),
                    timestamp: value
                        .get("timestamp")
                        .and_then(Value::as_str)
                        .map(str::to_string),
                    line_offset,
                    delta,
                });
            }
            _ => {}
        }
    }

    let mut imported = 0;
    let mut skipped = 0;
    if !state.subagent_session {
        for usage in pending {
            if insert_usage_entry(conn, &file_path_text, usage)? {
                imported += 1;
            } else {
                skipped += 1;
            }
        }
    }

    update_sync_state(conn, &file_path_text, file_modified, line_offset)?;
    Ok((imported, skipped))
}

#[derive(Debug, Clone)]
struct PendingUsageInsert {
    request_id: String,
    session_id: Option<String>,
    model: String,
    timestamp: Option<String>,
    line_offset: i64,
    delta: DeltaTokens,
}

fn insert_usage_entry(
    conn: &Connection,
    file_path: &str,
    usage: PendingUsageInsert,
) -> Result<bool, String> {
    let created_at = usage
        .timestamp
        .as_deref()
        .and_then(parse_rfc3339_epoch_seconds)
        .unwrap_or_else(now_epoch_seconds);
    let cost_multiplier = get_default_cost_multiplier_from_conn(conn, "codex")?;
    let total_cost_usd = estimate_total_cost_usd(
        conn,
        &usage.model,
        Some(&usage.model),
        "codex",
        usage.delta.input as u64,
        usage.delta.output as u64,
        usage.delta.cached_input as u64,
        0,
        Some(&cost_multiplier),
    )?
    .map(format_cost)
    .unwrap_or_else(|| "0.0000".to_string());
    let rows = conn
        .execute(
            "INSERT OR IGNORE INTO proxy_request_logs (
                request_id, provider_id, app_type, model, request_model,
                input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, total_tokens,
                total_cost_usd, latency_ms, status_code, error_message, session_id,
                file_path, line_offset, provider_type, is_streaming, cost_multiplier, created_at, data_source
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)",
            params![
                usage.request_id,
                "_codex_session",
                "codex",
                usage.model,
                usage.model,
                usage.delta.input,
                usage.delta.output,
                usage.delta.cached_input,
                0u32,
                usage.delta.total,
                total_cost_usd,
                0u32,
                200u32,
                Option::<String>::None,
                usage.session_id,
                file_path,
                usage.line_offset,
                "codex_session",
                1u32,
                cost_multiplier,
                created_at,
                "codex_session",
            ],
        )
        .map_err(|error| error.to_string())?;
    Ok(rows > 0)
}

fn get_sync_state(conn: &Connection, file_path: &str) -> Result<(i64, i64), String> {
    conn.query_row(
        "SELECT last_modified, last_line_offset FROM session_log_sync WHERE file_path = ?1",
        params![file_path],
        |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?)),
    )
    .optional()
    .map(|value| value.unwrap_or((0, 0)))
    .map_err(|error| error.to_string())
}

fn update_sync_state(
    conn: &Connection,
    file_path: &str,
    last_modified: i64,
    last_offset: i64,
) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO session_log_sync
            (file_path, last_modified, last_line_offset, last_synced_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![file_path, last_modified, last_offset, now_epoch_seconds()],
    )
    .map(|_| ())
    .map_err(|error| error.to_string())
}

fn legacy_usage_history_db_path(codex_home: &Path) -> Option<PathBuf> {
    let home = std::env::var("HOME")
        .ok()
        .filter(|value| !value.trim().is_empty())?;
    let home_path = PathBuf::from(home);
    let default_codex_home = home_path.join(".codex");
    if codex_home != default_codex_home {
        return None;
    }

    None
}

pub(crate) fn backfill_legacy_usage_history_rows(
    conn: &Connection,
    legacy_history_db_path: &Path,
) -> Result<u32, String> {
    let attach_path = legacy_history_db_path.to_string_lossy().to_string();
    conn.execute(
        "ATTACH DATABASE ?1 AS legacy_usage_history",
        params![attach_path],
    )
    .map_err(|error| error.to_string())?;

    let result = (|| {
        conn.execute_batch(
            "CREATE TEMP TABLE IF NOT EXISTS legacy_usage_history_imported (
                rows_inserted INTEGER NOT NULL
            );
            DELETE FROM legacy_usage_history_imported;",
        )
        .map_err(|error| error.to_string())?;

        // The legacy usage database is only a one-way migration source. AIOtto keeps its own
        // rows as the source of truth and only copies missing historical rows,
        // so uninstalling the legacy app after import does not change statistics.
        conn.execute_batch(
            "INSERT OR IGNORE INTO proxy_request_logs (
                request_id, provider_id, app_type, model, request_model,
                input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, total_tokens,
                total_cost_usd, latency_ms, status_code, error_message, session_id,
                file_path, line_offset, provider_type, is_streaming, cost_multiplier, created_at, data_source
            )
            SELECT
                request_id,
                COALESCE(NULLIF(provider_id, ''), '_codex_session') AS provider_id,
                app_type,
                model,
                COALESCE(NULLIF(request_model, ''), model) AS request_model,
                input_tokens,
                output_tokens,
                cache_read_tokens,
                cache_creation_tokens,
                CASE
                    WHEN app_type IN ('codex', 'gemini') AND input_tokens >= cache_read_tokens
                        THEN input_tokens - cache_read_tokens + output_tokens + cache_read_tokens + cache_creation_tokens
                    ELSE input_tokens + output_tokens + cache_read_tokens + cache_creation_tokens
                END AS total_tokens,
                total_cost_usd,
                COALESCE(latency_ms, 0) AS latency_ms,
                status_code,
                error_message,
                session_id,
                'legacy-usage://proxy_request_logs' AS file_path,
                created_at AS line_offset,
                COALESCE(NULLIF(provider_type, ''), 'codex_session') AS provider_type,
                COALESCE(is_streaming, 1) AS is_streaming,
                COALESCE(NULLIF(cost_multiplier, ''), '1.0') AS cost_multiplier,
                created_at,
                data_source
            FROM legacy_usage_history.proxy_request_logs
            WHERE data_source = 'codex_session'
              AND app_type = 'codex';

            INSERT INTO legacy_usage_history_imported(rows_inserted)
            VALUES (changes());",
        )
        .map_err(|error| error.to_string())?;

        conn.query_row(
            "SELECT COALESCE(SUM(rows_inserted), 0) FROM legacy_usage_history_imported",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map(|value| value.max(0) as u32)
        .map_err(|error| error.to_string())
    })();

    let detach_result = conn.execute_batch("DETACH DATABASE legacy_usage_history");
    match (result, detach_result) {
        (Ok(imported), Ok(_)) => Ok(imported),
        (Err(error), _) => Err(error),
        (Ok(_), Err(error)) => Err(error.to_string()),
    }
}

fn seed_model_pricing(conn: &Connection) -> Result<(), String> {
    let mut stmt = conn
        .prepare(
            "INSERT INTO model_pricing (
                model_id,
                display_name,
                input_cost_per_million,
                output_cost_per_million,
                cache_read_cost_per_million,
                cache_creation_cost_per_million
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(model_id) DO UPDATE SET
                display_name = CASE
                    WHEN TRIM(COALESCE(model_pricing.display_name, '')) = ''
                        THEN excluded.display_name
                    ELSE model_pricing.display_name
                END",
        )
        .map_err(|error| error.to_string())?;

    for (model_id, display_name, input, output, cache_read, cache_creation) in MODEL_PRICING_SEEDS {
        stmt.execute(params![
            model_id,
            display_name,
            input,
            output,
            cache_read,
            cache_creation
        ])
        .map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn read_codex_session_usage_model_pricing_in(
    codex_home: &Path,
) -> Result<Vec<CodexSessionUsageModelPricingInfo>, String> {
    let conn = open_usage_db(&codex_session_usage_db_path(codex_home))?;
    ensure_usage_schema(&conn)?;
    let mut stmt = conn
        .prepare(
            "SELECT
                model_id,
                COALESCE(NULLIF(display_name, ''), model_id) AS display_name,
                input_cost_per_million,
                output_cost_per_million,
                cache_read_cost_per_million,
                cache_creation_cost_per_million
             FROM model_pricing
             ORDER BY display_name COLLATE NOCASE, model_id COLLATE NOCASE",
        )
        .map_err(|error| error.to_string())?;
    stmt.query_map([], |row| {
        Ok(CodexSessionUsageModelPricingInfo {
            model_id: row.get(0)?,
            display_name: row.get(1)?,
            input_cost_per_million: row.get(2)?,
            output_cost_per_million: row.get(3)?,
            cache_read_cost_per_million: row.get(4)?,
            cache_creation_cost_per_million: row.get(5)?,
        })
    })
    .map_err(|error| error.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|error| error.to_string())
}

pub fn update_codex_session_usage_model_pricing_in(
    codex_home: &Path,
    request: CodexSessionUsageModelPricingUpdate,
) -> Result<(), String> {
    let model_id = request.model_id.trim().to_ascii_lowercase();
    if model_id.is_empty() {
        return Err("模型 ID 不能为空".to_string());
    }
    let display_name = request.display_name.trim();
    if display_name.is_empty() {
        return Err("显示名称不能为空".to_string());
    }

    for (label, value) in [
        ("input_cost", request.input_cost.as_str()),
        ("output_cost", request.output_cost.as_str()),
        ("cache_read_cost", request.cache_read_cost.as_str()),
        ("cache_creation_cost", request.cache_creation_cost.as_str()),
    ] {
        validate_non_negative_decimal(value).map_err(|error| format!("{label} {error}"))?;
    }

    let conn = open_usage_db(&codex_session_usage_db_path(codex_home))?;
    ensure_usage_schema(&conn)?;
    conn.execute(
        "INSERT INTO model_pricing (
            model_id, display_name, input_cost_per_million, output_cost_per_million,
            cache_read_cost_per_million, cache_creation_cost_per_million
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(model_id) DO UPDATE SET
            display_name = excluded.display_name,
            input_cost_per_million = excluded.input_cost_per_million,
            output_cost_per_million = excluded.output_cost_per_million,
            cache_read_cost_per_million = excluded.cache_read_cost_per_million,
            cache_creation_cost_per_million = excluded.cache_creation_cost_per_million",
        params![
            model_id,
            display_name,
            request.input_cost.trim(),
            request.output_cost.trim(),
            request.cache_read_cost.trim(),
            request.cache_creation_cost.trim()
        ],
    )
    .map_err(|error| error.to_string())?;

    let _ = backfill_missing_usage_costs_for_model(&conn, &model_id)?;
    Ok(())
}

pub fn delete_codex_session_usage_model_pricing_in(
    codex_home: &Path,
    model_id: &str,
) -> Result<(), String> {
    let conn = open_usage_db(&codex_session_usage_db_path(codex_home))?;
    ensure_usage_schema(&conn)?;
    conn.execute(
        "DELETE FROM model_pricing WHERE model_id = ?1",
        params![model_id.trim().to_ascii_lowercase()],
    )
    .map(|_| ())
    .map_err(|error| error.to_string())
}

pub fn get_codex_session_usage_default_cost_multiplier_in(
    codex_home: &Path,
    app_type: &str,
) -> Result<String, String> {
    let conn = open_usage_db(&codex_session_usage_db_path(codex_home))?;
    ensure_usage_schema(&conn)?;
    let app_type = normalize_pricing_app_type(app_type)?;
    get_default_cost_multiplier_from_conn(&conn, &app_type)
}

fn get_default_cost_multiplier_from_conn(
    conn: &Connection,
    app_type: &str,
) -> Result<String, String> {
    conn.query_row(
        "SELECT default_cost_multiplier FROM proxy_config WHERE app_type = ?1",
        params![app_type],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|error| error.to_string())
    .map(|value| value.unwrap_or_else(|| "1".to_string()))
}

pub fn set_codex_session_usage_default_cost_multiplier_in(
    codex_home: &Path,
    app_type: &str,
    value: &str,
) -> Result<(), String> {
    validate_non_negative_decimal(value)?;
    let conn = open_usage_db(&codex_session_usage_db_path(codex_home))?;
    ensure_usage_schema(&conn)?;
    let app_type = normalize_pricing_app_type(app_type)?;
    conn.execute(
        "INSERT INTO proxy_config (
            app_type, default_cost_multiplier, pricing_model_source, updated_at
         ) VALUES (?1, ?2, 'response', ?3)
         ON CONFLICT(app_type) DO UPDATE SET
            default_cost_multiplier = excluded.default_cost_multiplier,
            updated_at = excluded.updated_at",
        params![app_type, value.trim(), now_epoch_seconds()],
    )
    .map(|_| ())
    .map_err(|error| error.to_string())
}

pub fn get_codex_session_usage_pricing_model_source_in(
    codex_home: &Path,
    app_type: &str,
) -> Result<String, String> {
    let conn = open_usage_db(&codex_session_usage_db_path(codex_home))?;
    ensure_usage_schema(&conn)?;
    let app_type = normalize_pricing_app_type(app_type)?;
    conn.query_row(
        "SELECT pricing_model_source FROM proxy_config WHERE app_type = ?1",
        params![app_type],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|error| error.to_string())
    .map(|value| value.unwrap_or_else(|| "response".to_string()))
}

pub fn set_codex_session_usage_pricing_model_source_in(
    codex_home: &Path,
    app_type: &str,
    value: &str,
) -> Result<(), String> {
    let source = validate_pricing_model_source(value)?;
    let conn = open_usage_db(&codex_session_usage_db_path(codex_home))?;
    ensure_usage_schema(&conn)?;
    let app_type = normalize_pricing_app_type(app_type)?;
    conn.execute(
        "INSERT INTO proxy_config (
            app_type, default_cost_multiplier, pricing_model_source, updated_at
         ) VALUES (?1, '1', ?2, ?3)
         ON CONFLICT(app_type) DO UPDATE SET
            pricing_model_source = excluded.pricing_model_source,
            updated_at = excluded.updated_at",
        params![app_type, source, now_epoch_seconds()],
    )
    .map(|_| ())
    .map_err(|error| error.to_string())
}

fn normalize_pricing_app_type(app_type: &str) -> Result<String, String> {
    let value = app_type.trim().to_ascii_lowercase();
    if matches!(value.as_str(), "claude" | "codex" | "gemini") {
        Ok(value)
    } else {
        Err(format!("不支持的应用类型: {app_type}"))
    }
}

fn validate_pricing_model_source(value: &str) -> Result<&'static str, String> {
    match value.trim() {
        "request" => Ok("request"),
        "response" => Ok("response"),
        _ => Err("计费模式只能是 request 或 response".to_string()),
    }
}

fn validate_non_negative_decimal(value: &str) -> Result<(), String> {
    let value = value.trim();
    if value.is_empty() {
        return Err("不能为空".to_string());
    }
    if !value
        .chars()
        .all(|character| character.is_ascii_digit() || character == '.')
    {
        return Err("必须是非负数字".to_string());
    }
    if value.matches('.').count() > 1 {
        return Err("必须是非负数字".to_string());
    }
    if value.starts_with('.') || value.ends_with('.') {
        return Err("必须是非负数字".to_string());
    }
    let parsed = value
        .parse::<f64>()
        .map_err(|_| "必须是非负数字".to_string())?;
    if !parsed.is_finite() || parsed < 0.0 {
        return Err("必须是非负数字".to_string());
    }
    Ok(())
}

fn backfill_missing_usage_costs(conn: &Connection) -> Result<u64, String> {
    backfill_missing_usage_costs_matching(conn, None)
}

fn backfill_missing_usage_costs_for_model(
    conn: &Connection,
    model_id: &str,
) -> Result<u64, String> {
    let target_candidates = model_pricing_candidates(model_id);
    if target_candidates.is_empty() {
        return Ok(0);
    }

    backfill_missing_usage_costs_matching(conn, Some(&target_candidates))
}

fn backfill_missing_usage_costs_matching(
    conn: &Connection,
    target_candidates: Option<&[String]>,
) -> Result<u64, String> {
    let mut stmt = conn
        .prepare(
            "SELECT
                request_id,
                model,
                request_model,
                app_type,
                cost_multiplier,
                input_tokens,
                output_tokens,
                cache_read_tokens,
                cache_creation_tokens
             FROM proxy_request_logs
             WHERE CAST(total_cost_usd AS REAL) <= 0
               AND (input_tokens > 0 OR output_tokens > 0 OR cache_read_tokens > 0 OR cache_creation_tokens > 0)",
        )
        .map_err(|error| error.to_string())?;

    let pending = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, i64>(5)? as u64,
                row.get::<_, i64>(6)? as u64,
                row.get::<_, i64>(7)? as u64,
                row.get::<_, i64>(8)? as u64,
            ))
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    let mut updated = 0u64;
    for (
        request_id,
        model,
        request_model,
        app_type,
        cost_multiplier,
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_creation_tokens,
    ) in pending
    {
        if let Some(target_candidates) = target_candidates {
            if !usage_log_pricing_scope_matches(&model, request_model.as_deref(), target_candidates)
            {
                continue;
            }
        }

        let Some(total_cost) = estimate_total_cost_usd(
            conn,
            &model,
            request_model.as_deref(),
            &app_type,
            input_tokens,
            output_tokens,
            cache_read_tokens,
            cache_creation_tokens,
            cost_multiplier.as_deref(),
        )?
        else {
            continue;
        };

        conn.execute(
            "UPDATE proxy_request_logs
             SET total_cost_usd = ?2
             WHERE request_id = ?1",
            params![request_id, format_cost(total_cost)],
        )
        .map_err(|error| error.to_string())?;
        updated += 1;
    }

    Ok(updated)
}

fn usage_log_pricing_scope_matches(
    model: &str,
    request_model: Option<&str>,
    target_candidates: &[String],
) -> bool {
    [Some(model), request_model]
        .into_iter()
        .flatten()
        .any(|field| {
            model_pricing_candidates(field)
                .iter()
                .any(|candidate| target_candidates.iter().any(|target| target == candidate))
        })
}

fn estimate_total_cost_usd(
    conn: &Connection,
    model: &str,
    request_model: Option<&str>,
    app_type: &str,
    input_tokens: u64,
    output_tokens: u64,
    cache_read_tokens: u64,
    cache_creation_tokens: u64,
    cost_multiplier: Option<&str>,
) -> Result<Option<f64>, String> {
    let Some(pricing) = lookup_model_pricing(conn, model, request_model)? else {
        return Ok(None);
    };

    let multiplier = cost_multiplier
        .and_then(|value| value.trim().parse::<f64>().ok())
        .filter(|value| value.is_finite() && *value > 0.0)
        .unwrap_or(1.0);
    let billable_input_tokens = if matches!(app_type, "codex" | "gemini") {
        input_tokens.saturating_sub(cache_read_tokens)
    } else {
        input_tokens
    };
    let base_cost = billable_input_tokens as f64 * pricing.input_cost_per_million / 1_000_000.0
        + output_tokens as f64 * pricing.output_cost_per_million / 1_000_000.0
        + cache_read_tokens as f64 * pricing.cache_read_cost_per_million / 1_000_000.0
        + cache_creation_tokens as f64 * pricing.cache_creation_cost_per_million / 1_000_000.0;

    Ok(Some((base_cost * multiplier).max(0.0)))
}

fn lookup_model_pricing(
    conn: &Connection,
    model: &str,
    request_model: Option<&str>,
) -> Result<Option<ModelPricing>, String> {
    for candidate in model_pricing_candidates(model)
        .into_iter()
        .chain(request_model.into_iter().flat_map(model_pricing_candidates))
    {
        let Some(pricing) = conn
            .query_row(
                "SELECT
                    input_cost_per_million,
                    output_cost_per_million,
                    cache_read_cost_per_million,
                    cache_creation_cost_per_million
                 FROM model_pricing
                 WHERE model_id = ?1
                 LIMIT 1",
                params![candidate],
                |row| {
                    Ok(ModelPricing {
                        input_cost_per_million: row
                            .get::<_, String>(0)?
                            .parse::<f64>()
                            .unwrap_or(0.0),
                        output_cost_per_million: row
                            .get::<_, String>(1)?
                            .parse::<f64>()
                            .unwrap_or(0.0),
                        cache_read_cost_per_million: row
                            .get::<_, String>(2)?
                            .parse::<f64>()
                            .unwrap_or(0.0),
                        cache_creation_cost_per_million: row
                            .get::<_, String>(3)?
                            .parse::<f64>()
                            .unwrap_or(0.0),
                    })
                },
            )
            .optional()
            .map_err(|error| error.to_string())?
        else {
            continue;
        };

        return Ok(Some(pricing));
    }

    Ok(None)
}

fn model_pricing_candidates(model_id: &str) -> Vec<String> {
    let cleaned = clean_model_id_for_pricing(model_id);
    if cleaned.is_empty() || cleaned.contains("_external_") {
        return Vec::new();
    }

    let mut candidates = vec![cleaned.clone()];
    let without_iso = strip_iso_date_suffix(&cleaned).to_string();
    if without_iso != cleaned {
        candidates.push(without_iso.clone());
    }
    let without_compact = strip_compact_date_suffix(&cleaned).to_string();
    if without_compact != cleaned
        && !candidates
            .iter()
            .any(|candidate| candidate == &without_compact)
    {
        candidates.push(without_compact);
    }

    candidates
}

fn clean_model_id_for_pricing(model_id: &str) -> String {
    model_id
        .rsplit_once('/')
        .map(|(_, value)| value)
        .unwrap_or(model_id)
        .split(':')
        .next()
        .unwrap_or(model_id)
        .trim()
        .replace('@', "-")
        .to_ascii_lowercase()
}

fn metadata_modified_nanos(metadata: &fs::Metadata) -> i64 {
    metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_nanos().min(i64::MAX as u128) as i64)
        .unwrap_or(0)
}

fn parse_tokens(value: &Value) -> Option<CumulativeTokens> {
    let input = read_u64(value, &["input_tokens", "inputTokens"])?;
    let cached_input = read_u64(value, &["cached_input_tokens", "cachedInputTokens"]).unwrap_or(0);
    let output = read_u64(value, &["output_tokens", "outputTokens"])?;
    let total = read_u64(value, &["total_tokens", "totalTokens"]).unwrap_or(input + output);
    Some(CumulativeTokens {
        input,
        cached_input,
        output,
        total,
    })
}

fn compute_delta(previous: Option<&CumulativeTokens>, current: &CumulativeTokens) -> DeltaTokens {
    match previous {
        Some(previous) => DeltaTokens {
            input: to_u32(current.input.saturating_sub(previous.input)),
            cached_input: to_u32(current.cached_input.saturating_sub(previous.cached_input)),
            output: to_u32(current.output.saturating_sub(previous.output)),
            total: to_u32(current.total.saturating_sub(previous.total)),
        },
        None => DeltaTokens {
            input: to_u32(current.input),
            cached_input: to_u32(current.cached_input),
            output: to_u32(current.output),
            total: to_u32(current.total),
        },
    }
}

fn normalize_codex_model(raw: &str) -> String {
    let mut value = raw.trim().to_ascii_lowercase();
    if let Some((_, model)) = value.rsplit_once('/') {
        value = model.to_string();
    }
    value = strip_iso_date_suffix(&value).to_string();
    value = strip_compact_date_suffix(&value).to_string();
    value
}

fn strip_iso_date_suffix(value: &str) -> &str {
    let bytes = value.as_bytes();
    if bytes.len() < 11 {
        return value;
    }
    let start = bytes.len() - 11;
    if bytes[start] == b'-'
        && bytes[start + 1..start + 5].iter().all(u8::is_ascii_digit)
        && bytes[start + 5] == b'-'
        && bytes[start + 6..start + 8].iter().all(u8::is_ascii_digit)
        && bytes[start + 8] == b'-'
        && bytes[start + 9..].iter().all(u8::is_ascii_digit)
    {
        &value[..start]
    } else {
        value
    }
}

fn strip_compact_date_suffix(value: &str) -> &str {
    let bytes = value.as_bytes();
    if bytes.len() < 9 {
        return value;
    }
    let start = bytes.len() - 9;
    if bytes[start] == b'-' && bytes[start + 1..].iter().all(u8::is_ascii_digit) {
        &value[..start]
    } else {
        value
    }
}

fn is_subagent_session_meta(payload: &Value) -> bool {
    payload
        .get("source")
        .and_then(Value::as_object)
        .map(|source| source.contains_key("subagent"))
        .unwrap_or(false)
}

fn read_string(value: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| value.get(*key))
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn read_u64(value: &Value, keys: &[&str]) -> Option<u64> {
    keys.iter()
        .find_map(|key| value.get(*key))
        .and_then(|value| {
            value.as_u64().or_else(|| {
                value
                    .as_i64()
                    .and_then(|number| (number >= 0).then_some(number as u64))
            })
        })
}

fn to_u32(value: u64) -> u32 {
    value.min(u32::MAX as u64) as u32
}

fn parse_rfc3339_epoch_seconds(value: &str) -> Option<i64> {
    chrono::DateTime::parse_from_rfc3339(value)
        .ok()
        .map(|date| date.timestamp())
}

fn now_epoch_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}

fn load_external_provider_labels(codex_home: &Path) -> BTreeMap<String, String> {
    let mut labels = BTreeMap::new();
    let state_path = codex_home.join(".aiotto/external/state.json");
    let Ok(contents) = fs::read_to_string(state_path) else {
        return labels;
    };
    let Ok(value) = serde_json::from_str::<Value>(&contents) else {
        return labels;
    };
    let Some(providers) = value.get("providers").and_then(Value::as_array) else {
        return labels;
    };

    for provider in providers {
        let Some(id) = read_string(provider, &["id"]) else {
            continue;
        };
        let name = read_string(provider, &["name"]).unwrap_or_else(|| id.clone());
        labels.insert(id, name);
    }

    labels
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum UsageDashboardSourceFilter {
    All,
    Codex,
    External,
    Cache,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum UsageDashboardRange {
    Today,
    OneDay,
    SevenDays,
    FourteenDays,
    ThirtyDays,
}

#[derive(Debug, Clone)]
struct NormalizedDashboardQuery {
    range: UsageDashboardRange,
    start_date: Option<i64>,
    end_date: Option<i64>,
    source_filter: UsageDashboardSourceFilter,
    provider_id: Option<String>,
    model: Option<String>,
    page: u32,
    page_size: u32,
}

pub fn read_codex_session_usage_dashboard_in(
    codex_home: &Path,
    query: CodexSessionUsageDashboardQuery,
) -> Result<CodexSessionUsageDashboardSnapshot, String> {
    log::debug!(
        "[codex-session-usage] dashboard-read start range={:?}..{:?} source={:?} provider={:?} model={:?}",
        query.start_date,
        query.end_date,
        query.source_filter,
        query.provider_id,
        query.model
    );
    let database_path = codex_session_usage_db_path(codex_home);
    let conn = open_usage_db(&database_path)?;
    ensure_usage_schema(&conn)?;
    let backfilled = backfill_missing_usage_costs(&conn)?;
    let normalized_query = normalize_dashboard_query(query);
    let external_provider_labels = load_external_provider_labels(codex_home);
    let summary = query_dashboard_summary(&conn, &normalized_query)?;
    let trend_points = query_dashboard_trend_points(&conn, &normalized_query)?;
    let provider_rows = query_dashboard_provider_rows(
        &conn,
        &normalized_query,
        summary.total_tokens,
        &external_provider_labels,
    )?;
    let model_rows = query_dashboard_model_rows(&conn, &normalized_query, summary.total_tokens)?;
    let request_log_page =
        query_dashboard_request_logs(&conn, &normalized_query, &external_provider_labels)?;
    let available_provider_options =
        query_dashboard_provider_options(&conn, &normalized_query, &external_provider_labels)?;
    let available_model_options = query_dashboard_model_options(&conn, &normalized_query)?;

    Ok(CodexSessionUsageDashboardSnapshot {
        source_label: source_label_for_filter(normalized_query.source_filter).to_string(),
        database_path: database_path.to_string_lossy().to_string(),
        summary,
        trend_points,
        provider_rows,
        model_rows,
        request_log_page,
        available_provider_options,
        available_model_options,
        sync: CodexSessionUsageDashboardSyncMeta {
            imported: 0,
            skipped: 0,
            files_scanned: 0,
        },
    })
    .inspect(|snapshot| {
        log::debug!(
            "[codex-session-usage] dashboard-read done requests={} tokens={} cost={} backfilled={} providers={} models={} rows={}",
            snapshot.summary.total_requests,
            snapshot.summary.total_tokens,
            snapshot.summary.total_cost_usd,
            backfilled,
            snapshot.provider_rows.len(),
            snapshot.model_rows.len(),
            snapshot.request_log_page.rows.len()
        );
    })
}

fn normalize_dashboard_query(query: CodexSessionUsageDashboardQuery) -> NormalizedDashboardQuery {
    let source_filter = match query.source_filter.as_deref().map(str::trim) {
        Some("codex") => UsageDashboardSourceFilter::Codex,
        Some("external") => UsageDashboardSourceFilter::External,
        Some("cache") => UsageDashboardSourceFilter::Cache,
        _ => UsageDashboardSourceFilter::All,
    };

    NormalizedDashboardQuery {
        range: match query.range.as_deref().map(str::trim) {
            Some("today") => UsageDashboardRange::Today,
            Some("1d") => UsageDashboardRange::OneDay,
            Some("7d") => UsageDashboardRange::SevenDays,
            Some("14d") => UsageDashboardRange::FourteenDays,
            _ => UsageDashboardRange::ThirtyDays,
        },
        start_date: query.start_date.filter(|value| *value > 0),
        end_date: query.end_date.filter(|value| *value > 0),
        source_filter,
        provider_id: query
            .provider_id
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty()),
        model: query
            .model
            .map(|value| value.trim().to_ascii_lowercase())
            .filter(|value| !value.is_empty()),
        page: query.page.unwrap_or(0),
        page_size: query.page_size.unwrap_or(20).clamp(1, 100),
    }
}

fn query_dashboard_summary(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
) -> Result<CodexSessionUsageDashboardSummary, String> {
    let (where_sql, params) = build_dashboard_where_clause(query, false, false);
    let fresh_input = fresh_input_sql("");
    let real_total_tokens = real_total_tokens_sql("");
    let sql = format!(
        "SELECT
            COUNT(*) AS total_requests,
            COALESCE(SUM({real_total_tokens}), 0) AS total_tokens,
            COALESCE(SUM({fresh_input}), 0) AS total_input_tokens,
            COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
            COALESCE(SUM(cache_read_tokens), 0) AS total_cache_read_tokens,
            COALESCE(SUM(cache_creation_tokens), 0) AS total_cache_creation_tokens,
            COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0.0) AS total_cost_usd,
            COALESCE(SUM(CASE WHEN status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END), 0) AS success_count,
            COUNT(DISTINCT COALESCE(NULLIF(session_id, ''), request_id)) AS distinct_session_count
         FROM proxy_request_logs{where_sql}"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    stmt.query_row(params_from_iter(params.iter()), |row| {
        let total_requests = row.get::<_, i64>(0)? as u64;
        let total_tokens = row.get::<_, i64>(1)? as u64;
        let total_input_tokens = row.get::<_, i64>(2)? as u64;
        let total_output_tokens = row.get::<_, i64>(3)? as u64;
        let total_cache_read_tokens = row.get::<_, i64>(4)? as u64;
        let total_cache_creation_tokens = row.get::<_, i64>(5)? as u64;
        let total_cost_usd = row.get::<_, f64>(6)?;
        let success_count = row.get::<_, i64>(7)? as u64;
        let distinct_session_count = row.get::<_, i64>(8)? as u64;
        let cache_denominator =
            total_input_tokens + total_cache_creation_tokens + total_cache_read_tokens;

        Ok(CodexSessionUsageDashboardSummary {
            total_requests,
            total_tokens,
            total_input_tokens,
            total_output_tokens,
            total_cache_read_tokens,
            total_cache_creation_tokens,
            total_cost_usd: format_cost(total_cost_usd),
            success_rate: if total_requests > 0 {
                success_count as f64 / total_requests as f64
            } else {
                0.0
            },
            cache_hit_rate: if cache_denominator > 0 {
                total_cache_read_tokens as f64 / cache_denominator as f64
            } else {
                0.0
            },
            distinct_session_count,
        })
    })
    .map_err(|error| error.to_string())
}

fn query_dashboard_trend_points(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
) -> Result<Vec<CodexSessionUsageTrendPoint>, String> {
    let (start_ts, end_ts) = normalized_trend_window(query);

    if should_use_hourly_trend(query, start_ts, end_ts) {
        return query_dashboard_hourly_trend_points(conn, query, start_ts, end_ts);
    }

    query_dashboard_daily_trend_points(conn, query, start_ts, end_ts)
}

fn query_dashboard_hourly_trend_points(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
    start_ts: i64,
    end_ts: i64,
) -> Result<Vec<CodexSessionUsageTrendPoint>, String> {
    let trend_query = NormalizedDashboardQuery {
        start_date: Some(start_ts),
        end_date: Some(end_ts),
        ..query.clone()
    };
    let (where_sql, params) = build_dashboard_where_clause(&trend_query, false, false);
    let bucket_count = trend_bucket_count(end_ts.saturating_sub(start_ts), TREND_HOUR_SECONDS);
    let fresh_input = fresh_input_sql("");
    let real_total_tokens = real_total_tokens_sql("");
    let sql = format!(
        "SELECT
            CAST((created_at - ?) / {TREND_HOUR_SECONDS} AS INTEGER) AS bucket_index,
            COUNT(*) AS request_count,
            COALESCE(SUM({real_total_tokens}), 0) AS total_tokens,
            COALESCE(SUM({fresh_input}), 0) AS total_input_tokens,
            COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
            COALESCE(SUM(cache_read_tokens), 0) AS total_cache_read_tokens,
            COALESCE(SUM(cache_creation_tokens), 0) AS total_cache_creation_tokens,
            COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0.0) AS total_cost_usd
         FROM proxy_request_logs{where_sql}
         GROUP BY bucket_index
         ORDER BY bucket_index ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    let mut query_params = vec![SqlValue::Integer(start_ts)];
    query_params.extend(params);
    let rows = stmt
        .query_map(params_from_iter(query_params.iter()), |row| {
            let bucket_index = row.get::<_, i64>(0)?;
            Ok((
                bucket_index,
                trend_point_from_row(row, String::new(), String::new(), 1)?,
            ))
        })
        .map_err(|error| error.to_string())?;
    let mut by_bucket = BTreeMap::new();
    for row in rows {
        let (mut bucket_index, point) = row.map_err(|error| error.to_string())?;
        if bucket_index < 0 {
            continue;
        }
        if bucket_index >= bucket_count {
            bucket_index = bucket_count - 1;
        }
        by_bucket.insert(bucket_index, point);
    }

    let mut points = Vec::with_capacity(bucket_count as usize);
    for bucket_index in 0..bucket_count {
        let bucket_start_ts = start_ts + bucket_index * TREND_HOUR_SECONDS;
        let date = local_timestamp_label(bucket_start_ts, "%Y-%m-%dT%H:%M:%S%:z")?;
        let label = local_timestamp_label(bucket_start_ts, "%m/%d %H:%M")?;

        if let Some(mut point) = by_bucket.remove(&bucket_index) {
            point.date = date;
            point.label = label;
            points.push(point);
        } else {
            points.push(empty_trend_point(date, label));
        }
    }

    Ok(points)
}

fn query_dashboard_daily_trend_points(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
    start_ts: i64,
    end_ts: i64,
) -> Result<Vec<CodexSessionUsageTrendPoint>, String> {
    let start_day = local_date_from_timestamp(start_ts)?;
    let end_day = local_date_from_timestamp(end_ts)?;
    let day_count = (end_day
        .signed_duration_since(start_day)
        .num_days()
        .saturating_add(1))
    .clamp(1, MAX_TREND_BUCKETS);
    let trend_query = NormalizedDashboardQuery {
        start_date: Some(start_ts),
        end_date: Some(end_ts),
        ..query.clone()
    };
    let (where_sql, params) = build_dashboard_where_clause(&trend_query, false, false);
    let fresh_input = fresh_input_sql("");
    let real_total_tokens = real_total_tokens_sql("");
    let sql = format!(
        "SELECT
            date(created_at, 'unixepoch', 'localtime') AS day_key,
            COUNT(*) AS request_count,
            COALESCE(SUM({real_total_tokens}), 0) AS total_tokens,
            COALESCE(SUM({fresh_input}), 0) AS total_input_tokens,
            COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
            COALESCE(SUM(cache_read_tokens), 0) AS total_cache_read_tokens,
            COALESCE(SUM(cache_creation_tokens), 0) AS total_cache_creation_tokens,
            COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0.0) AS total_cost_usd
         FROM proxy_request_logs{where_sql}
         GROUP BY day_key
         ORDER BY day_key ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(params.iter()), |row| {
            let date = row.get::<_, String>(0)?;
            let label = month_day_label_from_date(&date);
            Ok((date.clone(), trend_point_from_row(row, date, label, 1)?))
        })
        .map_err(|error| error.to_string())?;
    let mut by_day = BTreeMap::new();
    for row in rows {
        let (date, point) = row.map_err(|error| error.to_string())?;
        by_day.insert(date, point);
    }

    let mut points = Vec::with_capacity(day_count as usize);
    for day_offset in 0..day_count {
        let date = start_day
            .checked_add_signed(ChronoDuration::days(day_offset))
            .ok_or_else(|| "统计趋势日期溢出".to_string())?;
        let key = date.format("%Y-%m-%d").to_string();
        let label = month_day_label_from_date(&key);

        points.push(
            by_day
                .remove(&key)
                .unwrap_or_else(|| empty_trend_point(key, label)),
        );
    }

    Ok(points)
}

fn normalized_trend_window(query: &NormalizedDashboardQuery) -> (i64, i64) {
    let fallback_seconds = match query.range {
        UsageDashboardRange::Today | UsageDashboardRange::OneDay => TREND_DAY_SECONDS,
        UsageDashboardRange::SevenDays => 7 * TREND_DAY_SECONDS,
        UsageDashboardRange::FourteenDays => 14 * TREND_DAY_SECONDS,
        UsageDashboardRange::ThirtyDays => 30 * TREND_DAY_SECONDS,
    };
    let end_ts = query.end_date.unwrap_or_else(now_epoch_seconds).max(1);
    let mut start_ts = query
        .start_date
        .unwrap_or_else(|| end_ts.saturating_sub(fallback_seconds));

    if start_ts >= end_ts {
        start_ts = end_ts.saturating_sub(fallback_seconds);
    }

    (start_ts, end_ts)
}

fn should_use_hourly_trend(query: &NormalizedDashboardQuery, start_ts: i64, end_ts: i64) -> bool {
    matches!(
        query.range,
        UsageDashboardRange::Today | UsageDashboardRange::OneDay
    ) || end_ts.saturating_sub(start_ts) <= TREND_DAY_SECONDS
}

fn trend_bucket_count(duration_seconds: i64, bucket_seconds: i64) -> i64 {
    if duration_seconds <= 0 {
        return 1;
    }

    ((duration_seconds + bucket_seconds - 1) / bucket_seconds).clamp(1, MAX_TREND_BUCKETS)
}

fn trend_point_from_row(
    row: &rusqlite::Row<'_>,
    date: String,
    label: String,
    first_metric_index: usize,
) -> rusqlite::Result<CodexSessionUsageTrendPoint> {
    Ok(CodexSessionUsageTrendPoint {
        date,
        label,
        request_count: row.get::<_, i64>(first_metric_index)? as u64,
        total_tokens: row.get::<_, i64>(first_metric_index + 1)? as u64,
        total_input_tokens: row.get::<_, i64>(first_metric_index + 2)? as u64,
        total_output_tokens: row.get::<_, i64>(first_metric_index + 3)? as u64,
        total_cache_read_tokens: row.get::<_, i64>(first_metric_index + 4)? as u64,
        total_cache_creation_tokens: row.get::<_, i64>(first_metric_index + 5)? as u64,
        total_cost_usd: format_trend_cost(row.get::<_, f64>(first_metric_index + 6)?),
    })
}

fn empty_trend_point(date: String, label: String) -> CodexSessionUsageTrendPoint {
    CodexSessionUsageTrendPoint {
        date,
        label,
        request_count: 0,
        total_tokens: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cache_read_tokens: 0,
        total_cache_creation_tokens: 0,
        total_cost_usd: "0.000000".to_string(),
    }
}

fn local_timestamp_label(timestamp: i64, format: &str) -> Result<String, String> {
    local_datetime_from_timestamp(timestamp).map(|value| value.format(format).to_string())
}

fn local_date_from_timestamp(timestamp: i64) -> Result<NaiveDate, String> {
    local_datetime_from_timestamp(timestamp).map(|value| value.date_naive())
}

fn local_datetime_from_timestamp(timestamp: i64) -> Result<chrono::DateTime<Local>, String> {
    Local
        .timestamp_opt(timestamp, 0)
        .single()
        .ok_or_else(|| format!("无效统计趋势时间戳: {timestamp}"))
}

fn query_dashboard_provider_rows(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
    total_tokens: u64,
    external_provider_labels: &BTreeMap<String, String>,
) -> Result<Vec<CodexSessionUsageProviderRow>, String> {
    let effective_provider_sql = effective_provider_id_sql();
    let provider_name_sql = provider_name_sql(&effective_provider_sql, external_provider_labels);
    let (where_sql, params) = build_dashboard_where_clause(query, false, false);
    let real_total_tokens = real_total_tokens_sql("");
    let sql = format!(
        "SELECT
            {effective_provider_sql} AS effective_provider_id,
            {provider_name_sql} AS provider_name,
            COUNT(*) AS request_count,
            COALESCE(SUM({real_total_tokens}), 0) AS total_tokens,
            COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0.0) AS total_cost_usd,
            COALESCE(SUM(CASE WHEN status_code BETWEEN 200 AND 299 THEN 1 ELSE 0 END), 0) AS success_count,
            COALESCE(AVG(latency_ms), 0.0) AS avg_latency_ms
         FROM proxy_request_logs{where_sql}
         GROUP BY effective_provider_id
         ORDER BY total_tokens DESC, request_count DESC, provider_name ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(params.iter()), |row| {
            let request_count = row.get::<_, i64>(2)? as u64;
            let provider_tokens = row.get::<_, i64>(3)? as u64;
            Ok(CodexSessionUsageProviderRow {
                provider_id: row.get(0)?,
                provider_name: row.get(1)?,
                request_count,
                total_tokens: provider_tokens,
                total_cost_usd: format_cost(row.get::<_, f64>(4)?),
                success_rate: if request_count > 0 {
                    row.get::<_, i64>(5)? as f64 / request_count as f64
                } else {
                    0.0
                },
                avg_latency_ms: row.get::<_, f64>(6)?.round().max(0.0) as u64,
                share_ratio: if total_tokens > 0 {
                    provider_tokens as f64 / total_tokens as f64
                } else {
                    0.0
                },
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn query_dashboard_model_rows(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
    total_tokens: u64,
) -> Result<Vec<CodexSessionUsageModelRow>, String> {
    let (where_sql, params) = build_dashboard_where_clause(query, false, false);
    let real_total_tokens = real_total_tokens_sql("");
    let sql = format!(
        "SELECT
            model,
            COUNT(*) AS request_count,
            COALESCE(SUM({real_total_tokens}), 0) AS total_tokens,
            COALESCE(SUM(CAST(total_cost_usd AS REAL)), 0.0) AS total_cost_usd
         FROM proxy_request_logs{where_sql}
         GROUP BY model
         ORDER BY total_tokens DESC, request_count DESC, model ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(params.iter()), |row| {
            let request_count = row.get::<_, i64>(1)? as u64;
            let model_tokens = row.get::<_, i64>(2)? as u64;
            let total_cost = row.get::<_, f64>(3)?;
            Ok(CodexSessionUsageModelRow {
                model: row.get(0)?,
                request_count,
                total_tokens: model_tokens,
                total_cost_usd: format_cost(total_cost),
                avg_cost_per_request_usd: format_cost(if request_count > 0 {
                    total_cost / request_count as f64
                } else {
                    0.0
                }),
                share_ratio: if total_tokens > 0 {
                    model_tokens as f64 / total_tokens as f64
                } else {
                    0.0
                },
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn query_dashboard_request_logs(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
    external_provider_labels: &BTreeMap<String, String>,
) -> Result<CodexSessionUsageRequestLogPage, String> {
    let effective_provider_sql = effective_provider_id_sql();
    let provider_name_sql = provider_name_sql(&effective_provider_sql, external_provider_labels);
    let (where_sql, params) = build_dashboard_where_clause(query, false, false);
    let count_sql = format!("SELECT COUNT(*) FROM proxy_request_logs{where_sql}");
    let mut count_stmt = conn
        .prepare(&count_sql)
        .map_err(|error| error.to_string())?;
    let total = count_stmt
        .query_row(params_from_iter(params.iter()), |row| row.get::<_, i64>(0))
        .map(|count| count.max(0) as u32)
        .map_err(|error| error.to_string())?;

    let limit = query.page_size as i64;
    let offset = query.page.saturating_mul(query.page_size) as i64;
    let logs_sql = format!(
        "SELECT
            request_id,
            {effective_provider_sql} AS effective_provider_id,
            {provider_name_sql} AS provider_name,
            app_type,
            model,
            request_model,
            input_tokens,
            output_tokens,
            cache_read_tokens,
            cache_creation_tokens,
            total_tokens,
            total_cost_usd,
            latency_ms,
            status_code,
            error_message,
            session_id,
            created_at,
            data_source
         FROM proxy_request_logs{where_sql}
         ORDER BY created_at DESC, request_id DESC
         LIMIT ? OFFSET ?"
    );
    let mut log_params = params.clone();
    log_params.push(SqlValue::Integer(limit));
    log_params.push(SqlValue::Integer(offset));
    let mut stmt = conn.prepare(&logs_sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(log_params.iter()), |row| {
            let request_model = row
                .get::<_, Option<String>>(5)?
                .unwrap_or_else(|| row.get::<_, String>(4).unwrap_or_default());
            Ok(CodexSessionUsageRequestLogRow {
                request_id: row.get(0)?,
                provider_id: row.get(1)?,
                provider_name: row.get(2)?,
                app_type: row.get(3)?,
                model: row.get(4)?,
                request_model,
                input_tokens: row.get::<_, i64>(6)? as u64,
                output_tokens: row.get::<_, i64>(7)? as u64,
                cache_read_tokens: row.get::<_, i64>(8)? as u64,
                cache_creation_tokens: row.get::<_, i64>(9)? as u64,
                total_tokens: row.get::<_, i64>(10)? as u64,
                total_cost_usd: normalize_cost_text(row.get(11)?),
                latency_ms: row.get::<_, i64>(12)?.max(0) as u64,
                status_code: row.get::<_, i64>(13)? as u16,
                error_message: row.get(14)?,
                session_id: row.get(15)?,
                created_at: row.get(16)?,
                data_source: row
                    .get::<_, Option<String>>(17)?
                    .unwrap_or_else(|| "proxy".to_string()),
            })
        })
        .map_err(|error| error.to_string())?;

    Ok(CodexSessionUsageRequestLogPage {
        total,
        page: query.page,
        page_size: query.page_size,
        rows: rows
            .collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())?,
    })
}

fn query_dashboard_provider_options(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
    external_provider_labels: &BTreeMap<String, String>,
) -> Result<Vec<CodexSessionUsageFilterOption>, String> {
    let effective_provider_sql = effective_provider_id_sql();
    let provider_name_sql = provider_name_sql(&effective_provider_sql, external_provider_labels);
    let (where_sql, params) = build_dashboard_where_clause(query, true, false);
    let sql = format!(
        "SELECT
            {effective_provider_sql} AS effective_provider_id,
            {provider_name_sql} AS provider_name,
            COUNT(*) AS request_count
         FROM proxy_request_logs{where_sql}
         GROUP BY effective_provider_id
         ORDER BY request_count DESC, provider_name ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(params.iter()), |row| {
            Ok(CodexSessionUsageFilterOption {
                value: row.get(0)?,
                label: row.get(1)?,
                request_count: row.get::<_, i64>(2)? as u64,
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn query_dashboard_model_options(
    conn: &Connection,
    query: &NormalizedDashboardQuery,
) -> Result<Vec<CodexSessionUsageFilterOption>, String> {
    let (where_sql, params) = build_dashboard_where_clause(query, false, true);
    let sql = format!(
        "SELECT
            model,
            COUNT(*) AS request_count
         FROM proxy_request_logs{where_sql}
         GROUP BY model
         ORDER BY request_count DESC, model ASC"
    );
    let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params_from_iter(params.iter()), |row| {
            let value = row.get::<_, String>(0)?;
            Ok(CodexSessionUsageFilterOption {
                label: value.clone(),
                value,
                request_count: row.get::<_, i64>(1)? as u64,
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn build_dashboard_where_clause(
    query: &NormalizedDashboardQuery,
    skip_provider_filter: bool,
    skip_model_filter: bool,
) -> (String, Vec<SqlValue>) {
    let mut clauses = Vec::new();
    let mut params = Vec::new();

    if let Some(start_date) = query.start_date {
        clauses.push("created_at >= ?".to_string());
        params.push(SqlValue::Integer(start_date));
    }
    if let Some(end_date) = query.end_date {
        clauses.push("created_at <= ?".to_string());
        params.push(SqlValue::Integer(end_date));
    }

    match query.source_filter {
        UsageDashboardSourceFilter::All => {}
        UsageDashboardSourceFilter::Codex => {
            clauses.push(format!("NOT {}", external_request_sql()));
        }
        UsageDashboardSourceFilter::External => {
            clauses.push(external_request_sql());
        }
        UsageDashboardSourceFilter::Cache => {
            clauses.push("cache_read_tokens > 0".to_string());
        }
    }

    if !skip_provider_filter {
        if let Some(provider_id) = &query.provider_id {
            clauses.push(format!("{} = ?", effective_provider_id_sql()));
            params.push(SqlValue::Text(provider_id.clone()));
        }
    }

    if !skip_model_filter {
        if let Some(model) = &query.model {
            clauses.push("model = ?".to_string());
            params.push(SqlValue::Text(model.clone()));
        }
    }

    if clauses.is_empty() {
        (String::new(), params)
    } else {
        (format!(" WHERE {}", clauses.join(" AND ")), params)
    }
}

fn sql_prefix(alias: &str) -> String {
    if alias.is_empty() {
        String::new()
    } else {
        format!("{alias}.")
    }
}

fn fresh_input_sql(alias: &str) -> String {
    let prefix = sql_prefix(alias);
    format!(
        "CASE WHEN {prefix}app_type IN ('codex', 'gemini') AND {prefix}input_tokens >= {prefix}cache_read_tokens \
              THEN {prefix}input_tokens - {prefix}cache_read_tokens \
              ELSE {prefix}input_tokens END"
    )
}

fn real_total_tokens_sql(alias: &str) -> String {
    let prefix = sql_prefix(alias);
    let fresh_input = fresh_input_sql(alias);
    format!(
        "({fresh_input} + {prefix}output_tokens + {prefix}cache_creation_tokens + {prefix}cache_read_tokens)"
    )
}

fn external_request_sql() -> String {
    format!("(provider_id != '_codex_session' OR {EXTERNAL_MODEL_PATTERN_SQL})")
}

fn effective_provider_id_sql() -> String {
    format!(
        "CASE
            WHEN provider_id = '_codex_session' AND {EXTERNAL_MODEL_PATTERN_SQL} THEN model
            ELSE provider_id
         END"
    )
}

fn provider_name_sql(
    provider_expression: &str,
    external_provider_labels: &BTreeMap<String, String>,
) -> String {
    let mut sql =
        format!("CASE ({provider_expression}) WHEN '_codex_session' THEN 'Codex sessions'");

    for (provider_id, provider_name) in external_provider_labels {
        sql.push_str(&format!(
            " WHEN '{}' THEN '{}'",
            escape_sql_text(provider_id),
            escape_sql_text(provider_name)
        ));
    }

    sql.push_str(&format!(" ELSE ({provider_expression}) END"));
    sql
}

fn escape_sql_text(value: &str) -> String {
    value.replace('\'', "''")
}

fn source_label_for_filter(source_filter: UsageDashboardSourceFilter) -> &'static str {
    match source_filter {
        UsageDashboardSourceFilter::All => "真实 request logs",
        UsageDashboardSourceFilter::Codex => "Codex sessions request logs",
        UsageDashboardSourceFilter::External => "外部 request logs",
        UsageDashboardSourceFilter::Cache => "缓存命中 request logs",
    }
}

fn month_day_label_from_date(value: &str) -> String {
    let parts = value.split('-').collect::<Vec<_>>();
    if parts.len() == 3 {
        format!("{}/{}", parts[1], parts[2])
    } else {
        value.to_string()
    }
}

fn normalize_cost_text(value: Option<String>) -> String {
    value
        .as_deref()
        .and_then(|raw| raw.trim().parse::<f64>().ok())
        .map(format_cost)
        .unwrap_or_else(|| "0.0000".to_string())
}

fn format_cost(value: f64) -> String {
    if value.is_finite() {
        format!("{:.4}", value.max(0.0))
    } else {
        "0.0000".to_string()
    }
}

fn format_trend_cost(value: f64) -> String {
    if value.is_finite() {
        format!("{:.6}", value.max(0.0))
    } else {
        "0.000000".to_string()
    }
}
