use crate::codex_home::resolve_codex_home;
use crate::codex_home::scan_codex_key_files;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Read,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

const MAX_BACKUPS_PER_OPERATION_TYPE: usize = 3;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BackupSnapshot {
    pub id: String,
    pub created_at_epoch_ms: u64,
    pub operation_type: String,
    pub affected_paths: Vec<String>,
    pub sensitive: bool,
    pub before_hash: String,
    pub after_hash: String,
    pub note: String,
    pub backup_root: String,
    pub manifest_path: String,
    pub copied_files: Vec<BackupFileRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BackupSnapshotListRead {
    pub snapshots: Vec<BackupSnapshot>,
    pub source_label: String,
    pub backup_root: String,
    pub backup_root_exists: bool,
    pub backup_root_updated_at_epoch_ms: Option<u64>,
    pub manifest_count: usize,
    pub invalid_manifest_count: usize,
    pub invalid_manifest_paths: Vec<String>,
    pub invalid_manifest_details: Vec<InvalidBackupManifest>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct InvalidBackupManifest {
    pub path: String,
    pub error_message: String,
}

#[derive(Debug, Clone, Default)]
struct BackupSnapshotScan {
    snapshots: Vec<BackupSnapshot>,
    manifest_count: usize,
    invalid_manifest_count: usize,
    invalid_manifest_paths: Vec<String>,
    invalid_manifest_details: Vec<InvalidBackupManifest>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BackupFileRecord {
    pub original_path: String,
    pub backup_path: String,
    pub size_bytes: u64,
    pub hash: String,
    pub missing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SafeTransactionResult {
    pub backup_id: String,
    pub status: String,
    pub error_message: Option<String>,
    pub log_path: String,
    pub affected_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RestoreBackupResult {
    pub snapshot_id: String,
    pub pre_restore_backup_id: String,
    pub status: String,
    pub restored_paths: Vec<String>,
    pub log_path: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SkippedArchivePath {
    pub relative_path: String,
    pub reason: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SafeArchiveResult {
    pub archive_id: String,
    pub backup_id: String,
    pub status: String,
    pub codex_running_suspected: bool,
    pub archived_paths: Vec<String>,
    pub skipped_paths: Vec<SkippedArchivePath>,
    pub archive_root: String,
    pub log_path: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BackupLockState {
    pub schema_version: u32,
    pub locked_snapshot_ids: Vec<String>,
    pub state_path: String,
    pub updated_at_epoch_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBackupSnapshotRequest {
    pub manual_path: Option<String>,
    pub affected_paths: Vec<String>,
    pub operation_type: String,
    pub note: String,
    pub sensitive: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreBackupSnapshotRequest {
    pub manual_path: Option<String>,
    pub snapshot_id: String,
    pub note: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSafeArchiveRequest {
    pub manual_path: Option<String>,
    pub selected_paths: Vec<String>,
    pub note: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveBackupLockStateRequest {
    pub manual_path: Option<String>,
    pub locked_snapshot_ids: Vec<String>,
}

pub fn create_backup_snapshot_in(
    codex_home: &Path,
    backup_root: &Path,
    operation_type: &str,
    affected_paths: &[String],
    note: &str,
    sensitive: bool,
) -> Result<BackupSnapshot, String> {
    if affected_paths.is_empty() {
        return Err("至少需要一个备份路径。".to_string());
    }

    let created_at_epoch_ms = now_epoch_ms();
    let id = format!(
        "backup-{}-{created_at_epoch_ms}",
        sanitize_operation_type(operation_type)
    );
    let snapshot_dir = backup_root.join(&id);
    let files_dir = snapshot_dir.join("files");
    fs::create_dir_all(&files_dir).map_err(|error| error.to_string())?;

    let mut copied_files = Vec::new();
    let mut auto_sensitive = sensitive;

    for affected_path in affected_paths {
        let source_path = resolve_safe_affected_path(codex_home, affected_path)?;
        auto_sensitive = auto_sensitive || is_sensitive_path(&source_path);
        let relative_path = source_path
            .strip_prefix(codex_home)
            .map_err(|_| "备份路径必须位于 Codex Home 内。".to_string())?;
        let target_path = files_dir.join(relative_path);
        copy_path_to_backup(&source_path, &target_path, &mut copied_files)?;
    }

    let before_hash = combined_hash(&copied_files);
    let manifest_path = snapshot_dir.join("manifest.json");
    let snapshot = BackupSnapshot {
        id,
        created_at_epoch_ms,
        operation_type: operation_type.to_string(),
        affected_paths: affected_paths.to_vec(),
        sensitive: auto_sensitive,
        before_hash: before_hash.clone(),
        after_hash: before_hash,
        note: note.to_string(),
        backup_root: backup_root.to_string_lossy().to_string(),
        manifest_path: manifest_path.to_string_lossy().to_string(),
        copied_files,
    };
    let manifest_json =
        serde_json::to_string_pretty(&snapshot).map_err(|error| error.to_string())?;
    fs::write(&manifest_path, manifest_json).map_err(|error| error.to_string())?;
    prune_snapshots_for_operation_type(
        backup_root,
        operation_type,
        MAX_BACKUPS_PER_OPERATION_TYPE,
    )?;

    Ok(snapshot)
}

pub fn list_backup_snapshots_in(backup_root: &Path) -> Vec<BackupSnapshot> {
    scan_backup_snapshots_in(backup_root).snapshots
}

fn scan_backup_snapshots_in(backup_root: &Path) -> BackupSnapshotScan {
    let Ok(entries) = fs::read_dir(backup_root) else {
        return BackupSnapshotScan::default();
    };

    let mut scan = BackupSnapshotScan::default();
    for entry in entries.flatten() {
        let manifest_path = entry.path().join("manifest.json");
        if !manifest_path.exists() {
            continue;
        }

        scan.manifest_count += 1;
        match fs::read_to_string(&manifest_path) {
            Ok(manifest) => match serde_json::from_str::<BackupSnapshot>(&manifest) {
                Ok(snapshot) => scan.snapshots.push(snapshot),
                Err(error) => {
                    push_invalid_manifest(&mut scan, &manifest_path, error.to_string());
                }
            },
            Err(error) => {
                push_invalid_manifest(&mut scan, &manifest_path, error.to_string());
            }
        }
    }

    scan.snapshots
        .sort_by(|left, right| right.created_at_epoch_ms.cmp(&left.created_at_epoch_ms));
    scan
}

fn push_invalid_manifest(
    scan: &mut BackupSnapshotScan,
    manifest_path: &Path,
    error_message: String,
) {
    let path = manifest_path.to_string_lossy().to_string();
    scan.invalid_manifest_count += 1;
    scan.invalid_manifest_paths.push(path.clone());
    scan.invalid_manifest_details.push(InvalidBackupManifest {
        path,
        error_message,
    });
}

fn prune_snapshots_for_operation_type(
    backup_root: &Path,
    operation_type: &str,
    max_snapshots: usize,
) -> Result<(), String> {
    if max_snapshots == 0 {
        return Ok(());
    }

    let mut snapshots: Vec<_> = scan_backup_snapshots_in(backup_root)
        .snapshots
        .into_iter()
        .filter(|snapshot| snapshot.operation_type == operation_type)
        .collect();
    snapshots.sort_by(|left, right| {
        right
            .created_at_epoch_ms
            .cmp(&left.created_at_epoch_ms)
            .then_with(|| right.id.cmp(&left.id))
    });

    for snapshot in snapshots.iter().skip(max_snapshots) {
        let snapshot_dir = backup_root.join(&snapshot.id);
        match fs::remove_dir_all(&snapshot_dir) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => {
                return Err(format!("清理旧备份 {} 失败：{}", snapshot.id, error));
            }
        }
    }

    Ok(())
}

pub fn list_backup_snapshots_with_source_in(backup_root: &Path) -> BackupSnapshotListRead {
    let snapshot_scan = scan_backup_snapshots_in(backup_root);
    let backup_root_metadata = fs::metadata(backup_root).ok();
    let backup_root_exists = backup_root_metadata
        .as_ref()
        .map(|metadata| metadata.is_dir())
        .unwrap_or(false);
    let backup_root_updated_at_epoch_ms = backup_root_metadata.as_ref().and_then(modified_epoch_ms);

    BackupSnapshotListRead {
        snapshots: snapshot_scan.snapshots,
        source_label: "真实 Aiotto 备份历史".to_string(),
        backup_root: backup_root.to_string_lossy().to_string(),
        backup_root_exists,
        backup_root_updated_at_epoch_ms,
        manifest_count: snapshot_scan.manifest_count,
        invalid_manifest_count: snapshot_scan.invalid_manifest_count,
        invalid_manifest_paths: snapshot_scan.invalid_manifest_paths,
        invalid_manifest_details: snapshot_scan.invalid_manifest_details,
    }
}

pub fn list_backup_lock_state_in(backup_root: &Path) -> BackupLockState {
    let state_path = backup_lock_state_path(backup_root);
    let default_state = || BackupLockState {
        schema_version: 1,
        locked_snapshot_ids: Vec::new(),
        state_path: state_path.to_string_lossy().to_string(),
        updated_at_epoch_ms: 0,
    };

    let Ok(contents) = fs::read_to_string(&state_path) else {
        return default_state();
    };

    match serde_json::from_str::<BackupLockState>(&contents) {
        Ok(mut state) => {
            state.schema_version = 1;
            state.locked_snapshot_ids = dedupe_snapshot_ids(&state.locked_snapshot_ids);
            state.state_path = state_path.to_string_lossy().to_string();
            state
        }
        Err(_) => default_state(),
    }
}

pub fn save_backup_lock_state_in(
    backup_root: &Path,
    locked_snapshot_ids: &[String],
) -> Result<BackupLockState, String> {
    fs::create_dir_all(backup_root).map_err(|error| error.to_string())?;
    let state_path = backup_lock_state_path(backup_root);
    let state = BackupLockState {
        schema_version: 1,
        locked_snapshot_ids: dedupe_snapshot_ids(locked_snapshot_ids),
        state_path: state_path.to_string_lossy().to_string(),
        updated_at_epoch_ms: now_epoch_ms(),
    };
    let json = serde_json::to_string_pretty(&state).map_err(|error| error.to_string())?;
    fs::write(&state_path, json).map_err(|error| error.to_string())?;

    Ok(state)
}

pub fn run_safe_transaction_in<F>(
    codex_home: &Path,
    backup_root: &Path,
    operation_type: &str,
    affected_paths: &[String],
    note: &str,
    sensitive: bool,
    mut operation: F,
) -> Result<SafeTransactionResult, String>
where
    F: FnMut() -> Result<(), String>,
{
    let snapshot = create_backup_snapshot_in(
        codex_home,
        backup_root,
        operation_type,
        affected_paths,
        note,
        sensitive,
    )?;
    let operation_result = operation();
    let (status, error_message) = match operation_result {
        Ok(()) => ("success".to_string(), None),
        Err(error) => {
            restore_files_from_snapshot(&snapshot)?;
            ("rolled_back".to_string(), Some(error))
        }
    };
    let log_path = Path::new(&snapshot.backup_root)
        .join(&snapshot.id)
        .join("transaction.json");
    let result = SafeTransactionResult {
        backup_id: snapshot.id,
        status,
        error_message,
        log_path: log_path.to_string_lossy().to_string(),
        affected_paths: affected_paths.to_vec(),
    };
    let log_json = serde_json::to_string_pretty(&result).map_err(|error| error.to_string())?;
    fs::write(&log_path, log_json).map_err(|error| error.to_string())?;

    Ok(result)
}

pub fn restore_backup_snapshot_in(
    codex_home: &Path,
    backup_root: &Path,
    snapshot_id: &str,
    note: &str,
) -> Result<RestoreBackupResult, String> {
    let snapshot = load_backup_snapshot(backup_root, snapshot_id)?;
    let pre_restore_backup = create_backup_snapshot_in(
        codex_home,
        backup_root,
        "restore_preflight",
        &snapshot.affected_paths,
        &format!("恢复 {snapshot_id} 前自动备份当前状态。"),
        snapshot.sensitive,
    )?;

    restore_files_from_snapshot(&snapshot)?;

    let log_path = backup_root.join(snapshot_id).join("restore.json");
    let result = RestoreBackupResult {
        snapshot_id: snapshot.id,
        pre_restore_backup_id: pre_restore_backup.id,
        status: "restored".to_string(),
        restored_paths: snapshot.affected_paths,
        log_path: log_path.to_string_lossy().to_string(),
        note: note.to_string(),
    };
    let log_json = serde_json::to_string_pretty(&result).map_err(|error| error.to_string())?;
    fs::write(&log_path, log_json).map_err(|error| error.to_string())?;

    Ok(result)
}

pub fn create_safe_archive_in(
    codex_home: &Path,
    backup_root: &Path,
    selected_paths: &[String],
    note: &str,
) -> Result<SafeArchiveResult, String> {
    if selected_paths.is_empty() {
        return Err("请选择至少一个归档候选项。".to_string());
    }

    let scan = scan_codex_key_files(codex_home);
    let codex_running_suspected = scan
        .candidates
        .iter()
        .any(|candidate| candidate.exists && candidate.category == "sqlite_temp");
    let mut archived_paths = Vec::new();
    let mut skipped_paths = Vec::new();

    for selected_path in selected_paths {
        let Some(candidate) = scan
            .candidates
            .iter()
            .find(|candidate| candidate.relative_path == *selected_path)
        else {
            skipped_paths.push(SkippedArchivePath {
                relative_path: selected_path.to_string(),
                reason: "unknown".to_string(),
                detail: "不在 Codex Doctor 候选清单内，已跳过。".to_string(),
            });
            continue;
        };

        if !candidate.exists {
            skipped_paths.push(SkippedArchivePath {
                relative_path: selected_path.to_string(),
                reason: "missing".to_string(),
                detail: "候选项不存在，无需归档。".to_string(),
            });
            continue;
        }

        if candidate.protected
            || candidate.risk_level == "Active"
            || candidate.risk_level == "Dangerous"
        {
            skipped_paths.push(SkippedArchivePath {
                relative_path: selected_path.to_string(),
                reason: "protected".to_string(),
                detail: "该候选项受默认保护，Aiotto 不会归档 active sessions、WAL/SHM 或全局状态。"
                    .to_string(),
            });
            continue;
        }

        if codex_running_suspected && matches!(candidate.category.as_str(), "state_db" | "log_db") {
            skipped_paths.push(SkippedArchivePath {
                relative_path: selected_path.to_string(),
                reason: "codex_running".to_string(),
                detail: "检测到 WAL/SHM 活跃文件，请退出 Codex 后再归档数据库文件。".to_string(),
            });
            continue;
        }

        if candidate.category == "archive" {
            skipped_paths.push(SkippedArchivePath {
                relative_path: selected_path.to_string(),
                reason: "system_archive".to_string(),
                detail: "archive 目录是归档目标目录，不会被再次归档。".to_string(),
            });
            continue;
        }

        archived_paths.push(selected_path.to_string());
    }

    if archived_paths.is_empty() {
        return Err("没有可安全归档的候选项；默认保护项和活跃数据库已保留。".to_string());
    }

    let snapshot = create_backup_snapshot_in(
        codex_home,
        backup_root,
        "safe_archive",
        &archived_paths,
        "安全归档前自动备份。",
        false,
    )?;
    let archive_id = format!("aiotto-archive-{}", now_epoch_ms());
    let archive_root = codex_home.join("archive").join(&archive_id);
    fs::create_dir_all(&archive_root).map_err(|error| error.to_string())?;

    for relative_path in &archived_paths {
        let source = resolve_safe_affected_path(codex_home, relative_path)?;
        let target = archive_root.join(relative_path);
        move_path_to_archive(&source, &target)?;
    }

    let log_path = archive_root.join("archive.json");
    let result = SafeArchiveResult {
        archive_id,
        backup_id: snapshot.id,
        status: "archived".to_string(),
        codex_running_suspected,
        archived_paths,
        skipped_paths,
        archive_root: archive_root.to_string_lossy().to_string(),
        log_path: log_path.to_string_lossy().to_string(),
        note: note.to_string(),
    };
    let log_json = serde_json::to_string_pretty(&result).map_err(|error| error.to_string())?;
    fs::write(&log_path, log_json).map_err(|error| error.to_string())?;

    Ok(result)
}

fn load_backup_snapshot(backup_root: &Path, snapshot_id: &str) -> Result<BackupSnapshot, String> {
    let manifest_path = backup_root.join(snapshot_id).join("manifest.json");
    let manifest =
        fs::read_to_string(&manifest_path).map_err(|_| format!("未找到备份快照：{snapshot_id}"))?;
    serde_json::from_str::<BackupSnapshot>(&manifest).map_err(|error| error.to_string())
}

fn restore_files_from_snapshot(snapshot: &BackupSnapshot) -> Result<(), String> {
    for file in &snapshot.copied_files {
        if file.missing {
            continue;
        }

        let backup_path = Path::new(&file.backup_path);
        let original_path = Path::new(&file.original_path);
        if let Some(parent) = original_path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        fs::copy(backup_path, original_path).map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn resolve_safe_affected_path(codex_home: &Path, affected_path: &str) -> Result<PathBuf, String> {
    let candidate = Path::new(affected_path);
    let joined = if candidate.is_absolute() {
        candidate.to_path_buf()
    } else {
        codex_home.join(candidate)
    };
    let normalized = normalize_path(&joined);
    let normalized_home = normalize_path(codex_home);

    if !normalized.starts_with(&normalized_home) {
        return Err("备份路径必须位于 Codex Home 内。".to_string());
    }

    Ok(normalized)
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

fn copy_path_to_backup(
    source_path: &Path,
    target_path: &Path,
    copied_files: &mut Vec<BackupFileRecord>,
) -> Result<(), String> {
    if !source_path.exists() {
        copied_files.push(BackupFileRecord {
            original_path: source_path.to_string_lossy().to_string(),
            backup_path: target_path.to_string_lossy().to_string(),
            size_bytes: 0,
            hash: "missing".to_string(),
            missing: true,
        });
        return Ok(());
    }

    if source_path.is_dir() {
        fs::create_dir_all(target_path).map_err(|error| error.to_string())?;
        let entries = fs::read_dir(source_path).map_err(|error| error.to_string())?;
        for entry in entries.flatten() {
            copy_path_to_backup(
                &entry.path(),
                &target_path.join(entry.file_name()),
                copied_files,
            )?;
        }
        return Ok(());
    }

    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::copy(source_path, target_path).map_err(|error| error.to_string())?;
    let size_bytes = fs::metadata(source_path)
        .map_err(|error| error.to_string())?
        .len();
    copied_files.push(BackupFileRecord {
        original_path: source_path.to_string_lossy().to_string(),
        backup_path: target_path.to_string_lossy().to_string(),
        size_bytes,
        hash: hash_file(source_path)?,
        missing: false,
    });

    Ok(())
}

fn move_path_to_archive(source_path: &Path, target_path: &Path) -> Result<(), String> {
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::rename(source_path, target_path).map_err(|error| error.to_string())
}

fn combined_hash(files: &[BackupFileRecord]) -> String {
    let mut state = FNV_OFFSET;
    for file in files {
        state = fnv64_update(state, file.original_path.as_bytes());
        state = fnv64_update(state, file.hash.as_bytes());
    }
    format!("fnv64:{state:016x}")
}

const FNV_OFFSET: u64 = 0xcbf29ce484222325;
const FNV_PRIME: u64 = 0x00000100000001b3;

fn hash_file(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|error| error.to_string())?;
    let mut state = FNV_OFFSET;
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = file.read(&mut buffer).map_err(|error| error.to_string())?;
        if bytes_read == 0 {
            break;
        }
        state = fnv64_update(state, &buffer[..bytes_read]);
    }

    Ok(format!("fnv64:{state:016x}"))
}

fn fnv64_update(mut state: u64, bytes: &[u8]) -> u64 {
    for byte in bytes {
        state ^= u64::from(*byte);
        state = state.wrapping_mul(FNV_PRIME);
    }
    state
}

fn sanitize_operation_type(operation_type: &str) -> String {
    operation_type
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
                character
            } else {
                '-'
            }
        })
        .collect()
}

fn is_sensitive_path(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| {
            matches!(
                name,
                "auth.json" | "credentials.json" | "tokens.json" | "config.json"
            )
        })
        .unwrap_or(false)
}

fn now_epoch_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

fn modified_epoch_ms(metadata: &fs::Metadata) -> Option<u64> {
    metadata
        .modified()
        .ok()
        .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis() as u64)
}

fn default_backup_root(codex_home: &Path) -> PathBuf {
    codex_home.join(".aiotto").join("backups")
}

fn backup_lock_state_path(backup_root: &Path) -> PathBuf {
    backup_root.join("locks.json")
}

fn dedupe_snapshot_ids(snapshot_ids: &[String]) -> Vec<String> {
    let mut deduped = Vec::new();
    for snapshot_id in snapshot_ids {
        let trimmed = snapshot_id.trim();
        if trimmed.is_empty() || deduped.iter().any(|existing| existing == trimmed) {
            continue;
        }
        deduped.push(trimmed.to_string());
    }
    deduped
}

#[tauri::command]
pub fn create_backup_snapshot(
    request: CreateBackupSnapshotRequest,
) -> Result<BackupSnapshot, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(request.manual_path.as_deref(), &home_dir);
    let codex_home = Path::new(&resolved);
    let backup_root = default_backup_root(codex_home);

    create_backup_snapshot_in(
        codex_home,
        &backup_root,
        &request.operation_type,
        &request.affected_paths,
        &request.note,
        request.sensitive,
    )
}

#[tauri::command]
pub fn list_backup_snapshots(manual_path: Option<String>) -> BackupSnapshotListRead {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);
    let backup_root = default_backup_root(Path::new(&resolved));

    list_backup_snapshots_with_source_in(&backup_root)
}

#[tauri::command]
pub fn read_backup_lock_state(manual_path: Option<String>) -> BackupLockState {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(manual_path.as_deref(), &home_dir);
    let backup_root = default_backup_root(Path::new(&resolved));

    list_backup_lock_state_in(&backup_root)
}

#[tauri::command]
pub fn save_backup_lock_state(
    request: SaveBackupLockStateRequest,
) -> Result<BackupLockState, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(request.manual_path.as_deref(), &home_dir);
    let backup_root = default_backup_root(Path::new(&resolved));

    save_backup_lock_state_in(&backup_root, &request.locked_snapshot_ids)
}

#[tauri::command]
pub fn restore_backup_snapshot(
    request: RestoreBackupSnapshotRequest,
) -> Result<RestoreBackupResult, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(request.manual_path.as_deref(), &home_dir);
    let codex_home = Path::new(&resolved);
    let backup_root = default_backup_root(codex_home);

    restore_backup_snapshot_in(
        codex_home,
        &backup_root,
        &request.snapshot_id,
        &request.note,
    )
}

#[tauri::command]
pub fn create_safe_archive(request: CreateSafeArchiveRequest) -> Result<SafeArchiveResult, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let resolved = resolve_codex_home(request.manual_path.as_deref(), &home_dir);
    let codex_home = Path::new(&resolved);
    let backup_root = default_backup_root(codex_home);

    create_safe_archive_in(
        codex_home,
        &backup_root,
        &request.selected_paths,
        &request.note,
    )
}
