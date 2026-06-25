use crate::codex_home::resolve_codex_home;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMemoryStatus {
    pub project_path: String,
    pub project_md_path: String,
    pub exists: bool,
    pub size_bytes: u64,
    pub last_updated_at_epoch_ms: Option<u64>,
    pub recommended_action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMemoryTemplateResult {
    pub status: String,
    pub project_path: String,
    pub project_md_path: String,
    pub backup_id: String,
    pub backup_path: String,
    pub backup_manifest_path: String,
    pub bytes_written: u64,
    pub project_md_updated_at_epoch_ms: Option<u64>,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ProjectMemoryBackupManifest {
    id: String,
    project_path: String,
    project_md_path: String,
    backup_path: String,
    missing_before_write: bool,
    created_at_epoch_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMemoryRequest {
    pub project_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteProjectMemoryTemplateRequest {
    pub project_path: String,
    pub recent_thread_summary: Option<String>,
}

pub fn inspect_project_memory_in(project_path: &Path) -> Result<ProjectMemoryStatus, String> {
    let project_dir = validate_project_dir(project_path)?;
    let project_md_path = project_dir.join("PROJECT.md");
    let metadata = fs::metadata(&project_md_path).ok();
    let exists = metadata.is_some();
    let size_bytes = metadata.as_ref().map(|meta| meta.len()).unwrap_or(0);
    let last_updated_at_epoch_ms = metadata
        .and_then(|meta| meta.modified().ok())
        .and_then(system_time_to_epoch_ms);
    let recommended_action = if exists {
        "已存在 PROJECT.md，可在保存前自动备份后继续编辑。"
    } else {
        "未发现 PROJECT.md，可生成模板建立项目长期记忆。"
    };

    Ok(ProjectMemoryStatus {
        project_path: project_dir.to_string_lossy().to_string(),
        project_md_path: project_md_path.to_string_lossy().to_string(),
        exists,
        size_bytes,
        last_updated_at_epoch_ms,
        recommended_action: recommended_action.to_string(),
    })
}

pub fn write_project_memory_template_in(
    project_path: &Path,
    backup_root: &Path,
    recent_thread_summary: Option<String>,
) -> Result<ProjectMemoryTemplateResult, String> {
    let project_dir = validate_project_dir(project_path)?;
    let project_md_path = project_dir.join("PROJECT.md");
    let backup_id = format!("project-memory-{}", now_epoch_ms());
    let backup_dir = backup_root.join(&backup_id);
    fs::create_dir_all(&backup_dir).map_err(|error| error.to_string())?;

    let backup_path = backup_dir.join("PROJECT.md.bak");
    let existed_before_write = project_md_path.exists();
    if existed_before_write {
        fs::copy(&project_md_path, &backup_path).map_err(|error| error.to_string())?;
    }

    let manifest_path = backup_dir.join("manifest.json");
    let manifest = ProjectMemoryBackupManifest {
        id: backup_id.clone(),
        project_path: project_dir.to_string_lossy().to_string(),
        project_md_path: project_md_path.to_string_lossy().to_string(),
        backup_path: backup_path.to_string_lossy().to_string(),
        missing_before_write: !existed_before_write,
        created_at_epoch_ms: now_epoch_ms(),
    };
    let manifest_json =
        serde_json::to_string_pretty(&manifest).map_err(|error| error.to_string())?;
    fs::write(&manifest_path, manifest_json).map_err(|error| error.to_string())?;

    let template = build_project_memory_template(&project_dir, recent_thread_summary);
    fs::write(&project_md_path, template.as_bytes()).map_err(|error| error.to_string())?;
    let project_md_updated_at_epoch_ms = fs::metadata(&project_md_path)
        .ok()
        .and_then(|meta| meta.modified().ok())
        .and_then(system_time_to_epoch_ms);

    Ok(ProjectMemoryTemplateResult {
        status: "written".to_string(),
        project_path: project_dir.to_string_lossy().to_string(),
        project_md_path: project_md_path.to_string_lossy().to_string(),
        backup_id,
        backup_path: backup_path.to_string_lossy().to_string(),
        backup_manifest_path: manifest_path.to_string_lossy().to_string(),
        bytes_written: template.len() as u64,
        project_md_updated_at_epoch_ms,
        note: "写入 PROJECT.md 模板前已创建备份。".to_string(),
    })
}

fn build_project_memory_template(
    project_dir: &Path,
    recent_thread_summary: Option<String>,
) -> String {
    let project_name = project_dir
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("项目");
    let recent_thread = recent_thread_summary
        .filter(|summary| !summary.trim().is_empty())
        .unwrap_or_else(|| "暂无，可从线程管理页导出摘要后追加。".to_string());

    format!(
        "# {project_name} 项目记忆\n\n\
## 项目目标\n- \n\n\
## 技术栈\n- \n\n\
## 目录结构\n- \n\n\
## 架构决策\n- \n\n\
## 不要改的边界\n- \n\n\
## 已废弃方案\n- \n\n\
## 常见 bug\n- \n\n\
## 当前优先级\n- \n\n\
## 最近重要线程\n- {recent_thread}\n"
    )
}

fn validate_project_dir(project_path: &Path) -> Result<PathBuf, String> {
    let normalized = normalize_path(project_path);
    if !normalized.exists() {
        return Err("项目目录不存在，无法生成 PROJECT.md。".to_string());
    }
    if !normalized.is_dir() {
        return Err("项目路径必须是目录。".to_string());
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

fn expand_user_path(path: &str, home_dir: &str) -> PathBuf {
    if path == "~" {
        return PathBuf::from(home_dir);
    }
    if let Some(rest) = path.strip_prefix("~/") {
        return Path::new(home_dir).join(rest);
    }

    PathBuf::from(path)
}

fn system_time_to_epoch_ms(time: SystemTime) -> Option<u64> {
    time.duration_since(UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_millis() as u64)
}

fn now_epoch_ms() -> u64 {
    system_time_to_epoch_ms(SystemTime::now()).unwrap_or(0)
}

fn default_project_memory_backup_root(codex_home: &Path) -> PathBuf {
    codex_home
        .join(".aiotto")
        .join("backups")
        .join("project-memory")
}

#[tauri::command]
pub fn inspect_project_memory(
    request: ProjectMemoryRequest,
) -> Result<ProjectMemoryStatus, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let project_path = expand_user_path(&request.project_path, &home_dir);

    inspect_project_memory_in(&project_path)
}

#[tauri::command]
pub fn write_project_memory_template(
    request: WriteProjectMemoryTemplateRequest,
) -> Result<ProjectMemoryTemplateResult, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let codex_home = resolve_codex_home(None, &home_dir);
    let backup_root = default_project_memory_backup_root(Path::new(&codex_home));
    let project_path = expand_user_path(&request.project_path, &home_dir);

    write_project_memory_template_in(&project_path, &backup_root, request.recent_thread_summary)
}
