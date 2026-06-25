use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AutoUpdateManifest {
    pub version: String,
    #[serde(default)]
    pub pub_date: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub platforms: BTreeMap<String, AutoUpdatePlatformPackage>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AutoUpdatePlatformPackage {
    #[serde(default)]
    pub signature: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AutoUpdateCheckResult {
    pub status: String,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub checked_at: Option<String>,
    pub source: String,
    pub release_notes: Option<String>,
    pub package_size_bytes: Option<u64>,
    pub signature_configured: bool,
    pub download_url: Option<String>,
    pub error_code: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct InstallPreflightResult {
    pub status: String,
    pub reason: Option<String>,
    pub message: String,
    pub bundle_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckAutoUpdateManifestRequest {
    pub latest_json_path: String,
    pub current_version: String,
    pub platform: String,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PrepareAutoUpdateInstallRequest {
    pub package_url: String,
    pub version: String,
    pub signature: String,
    pub expected_signature: String,
    pub staging_dir: String,
    pub bundle_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PrepareAutoUpdateInstallResult {
    pub status: String,
    pub reason: Option<String>,
    pub message: String,
    pub version: String,
    pub staged_package_path: String,
    pub receipt_path: String,
    pub restart_required: bool,
}

pub fn check_auto_update_manifest_in(
    latest_json_path: &Path,
    current_version: &str,
    platform: &str,
) -> Result<AutoUpdateCheckResult, String> {
    let raw = fs::read_to_string(latest_json_path).map_err(|error| error.to_string())?;
    let manifest = serde_json::from_str::<AutoUpdateManifest>(&raw)
        .map_err(|error| format!("latest.json 解析失败：{error}"))?;
    Ok(evaluate_manifest(
        manifest,
        current_version,
        platform,
        latest_json_path.to_string_lossy().to_string(),
    ))
}

pub fn check_install_preflight_for_bundle_path(bundle_path: &Path) -> InstallPreflightResult {
    let bundle_path_label = bundle_path.to_string_lossy().to_string();
    let lower_path = bundle_path_label.to_ascii_lowercase();

    if bundle_path_label.starts_with("/Volumes/") {
        return blocked_preflight(
            bundle_path_label,
            "running_from_dmg",
            "当前从 DMG 运行，请拖入 Applications 后重新打开。",
        );
    }

    if lower_path.contains("apptranslocation") {
        return blocked_preflight(
            bundle_path_label,
            "app_translocation",
            "当前命中 App Translocation，请把 AIOtto 移入 Applications 后重新打开。",
        );
    }

    if !bundle_path_label.contains(".app/") && !bundle_path_label.ends_with(".app") {
        return blocked_preflight(
            bundle_path_label,
            "not_app_bundle",
            "未检测到 .app bundle 路径，不能执行自动替换安装。",
        );
    }

    InstallPreflightResult {
        status: "ready".to_string(),
        reason: None,
        message: "安装位置可用于自动更新。".to_string(),
        bundle_path: bundle_path_label,
    }
}

#[tauri::command]
pub fn check_auto_update_manifest(
    request: CheckAutoUpdateManifestRequest,
) -> Result<AutoUpdateCheckResult, String> {
    check_auto_update_manifest_in(
        Path::new(&request.latest_json_path),
        &request.current_version,
        &request.platform,
    )
}

#[tauri::command]
pub fn check_auto_update_install_preflight(
    bundle_path: Option<String>,
) -> Result<InstallPreflightResult, String> {
    let resolved = bundle_path
        .map(PathBuf::from)
        .or_else(|| std::env::current_exe().ok())
        .ok_or_else(|| "无法解析当前 AIOtto bundle 路径。".to_string())?;
    Ok(check_install_preflight_for_bundle_path(&resolved))
}

pub fn prepare_auto_update_install_in(
    request: PrepareAutoUpdateInstallRequest,
) -> Result<PrepareAutoUpdateInstallResult, String> {
    if request.signature.trim().is_empty() || request.expected_signature.trim().is_empty() {
        return Ok(blocked_prepare_result(
            request.version,
            "missing_signature",
            "更新包缺少签名，已阻止安装。",
            request.staging_dir,
        ));
    }

    if request.signature.trim() != request.expected_signature.trim() {
        return Ok(blocked_prepare_result(
            request.version,
            "signature_mismatch",
            "更新包签名不匹配，已阻止安装。",
            request.staging_dir,
        ));
    }

    let preflight = check_install_preflight_for_bundle_path(Path::new(&request.bundle_path));
    if preflight.status == "blocked" {
        return Ok(blocked_prepare_result(
            request.version,
            preflight
                .reason
                .as_deref()
                .unwrap_or("install_preflight_blocked"),
            &preflight.message,
            request.staging_dir,
        ));
    }

    let package_path = resolve_sandbox_package_path(&request.package_url)?;
    if !package_path.exists() {
        return Ok(blocked_prepare_result(
            request.version,
            "package_not_found",
            "未找到沙盒更新包，已阻止安装。",
            request.staging_dir,
        ));
    }

    let staging_dir = PathBuf::from(&request.staging_dir);
    fs::create_dir_all(&staging_dir).map_err(|error| error.to_string())?;
    let file_name = package_path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("AIOtto-update-package");
    let staged_package_path = staging_dir.join(file_name);
    fs::copy(&package_path, &staged_package_path).map_err(|error| error.to_string())?;

    let receipt_path = staging_dir.join("install-receipt.json");
    let receipt = serde_json::json!({
        "version": request.version,
        "stagedPackagePath": staged_package_path,
        "bundlePath": request.bundle_path,
        "restartRequired": true,
        "mode": "sandbox_prepare_only"
    });
    fs::write(
        &receipt_path,
        serde_json::to_string_pretty(&receipt).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;

    Ok(PrepareAutoUpdateInstallResult {
        status: "restart_required".to_string(),
        reason: None,
        message: "沙盒更新包已准备，重启后可执行安装验证。".to_string(),
        version: request.version,
        staged_package_path: staged_package_path.to_string_lossy().to_string(),
        receipt_path: receipt_path.to_string_lossy().to_string(),
        restart_required: true,
    })
}

#[tauri::command]
pub fn prepare_auto_update_install(
    request: PrepareAutoUpdateInstallRequest,
) -> Result<PrepareAutoUpdateInstallResult, String> {
    prepare_auto_update_install_in(request)
}

fn evaluate_manifest(
    manifest: AutoUpdateManifest,
    current_version: &str,
    platform: &str,
    source: String,
) -> AutoUpdateCheckResult {
    let package = manifest.platforms.get(platform);
    if package.is_none() {
        return blocked_result(
            current_version,
            Some(manifest.version),
            manifest.pub_date,
            source,
            manifest.notes,
            None,
            false,
            None,
            "platform_not_supported",
            "更新清单缺少当前 macOS 架构包。",
        );
    }

    let package = package.expect("checked above");
    let signature = package.signature.as_deref().unwrap_or("").trim();
    if signature.is_empty() {
        return blocked_result(
            current_version,
            Some(manifest.version),
            manifest.pub_date,
            source,
            manifest.notes,
            package.size,
            false,
            package.url.clone(),
            "missing_signature",
            "更新包缺少签名，已阻止安装。",
        );
    }

    let url = package.url.as_deref().unwrap_or("").trim();
    if url.is_empty() {
        return blocked_result(
            current_version,
            Some(manifest.version),
            manifest.pub_date,
            source,
            manifest.notes,
            package.size,
            true,
            None,
            "missing_download_url",
            "更新包缺少下载地址。",
        );
    }

    let status = if compare_versions(&manifest.version, current_version) > 0 {
        "available"
    } else {
        "up_to_date"
    };

    AutoUpdateCheckResult {
        status: status.to_string(),
        current_version: current_version.to_string(),
        latest_version: Some(manifest.version),
        checked_at: manifest.pub_date,
        source,
        release_notes: manifest.notes,
        package_size_bytes: package.size,
        signature_configured: true,
        download_url: Some(url.to_string()),
        error_code: None,
        error_message: None,
    }
}

#[allow(clippy::too_many_arguments)]
fn blocked_result(
    current_version: &str,
    latest_version: Option<String>,
    checked_at: Option<String>,
    source: String,
    release_notes: Option<String>,
    package_size_bytes: Option<u64>,
    signature_configured: bool,
    download_url: Option<String>,
    error_code: &str,
    error_message: &str,
) -> AutoUpdateCheckResult {
    AutoUpdateCheckResult {
        status: "blocked".to_string(),
        current_version: current_version.to_string(),
        latest_version,
        checked_at,
        source,
        release_notes,
        package_size_bytes,
        signature_configured,
        download_url,
        error_code: Some(error_code.to_string()),
        error_message: Some(error_message.to_string()),
    }
}

fn blocked_preflight(bundle_path: String, reason: &str, message: &str) -> InstallPreflightResult {
    InstallPreflightResult {
        status: "blocked".to_string(),
        reason: Some(reason.to_string()),
        message: message.to_string(),
        bundle_path,
    }
}

fn blocked_prepare_result(
    version: String,
    reason: &str,
    message: &str,
    staging_dir: String,
) -> PrepareAutoUpdateInstallResult {
    PrepareAutoUpdateInstallResult {
        status: "blocked".to_string(),
        reason: Some(reason.to_string()),
        message: message.to_string(),
        version,
        staged_package_path: String::new(),
        receipt_path: PathBuf::from(staging_dir)
            .join("install-receipt.json")
            .to_string_lossy()
            .to_string(),
        restart_required: false,
    }
}

fn resolve_sandbox_package_path(package_url: &str) -> Result<PathBuf, String> {
    if let Some(path) = package_url.strip_prefix("file://") {
        return Ok(PathBuf::from(path));
    }

    if package_url.starts_with("http://") || package_url.starts_with("https://") {
        return Err(
            "沙盒安装只允许 file:// 或本地路径，真实下载留给发布包 updater 验证。".to_string(),
        );
    }

    Ok(PathBuf::from(package_url))
}

fn compare_versions(left: &str, right: &str) -> i8 {
    let left_parts = version_parts(left);
    let right_parts = version_parts(right);
    let max_len = left_parts.len().max(right_parts.len());

    for index in 0..max_len {
        let left_part = *left_parts.get(index).unwrap_or(&0);
        let right_part = *right_parts.get(index).unwrap_or(&0);
        if left_part > right_part {
            return 1;
        }
        if left_part < right_part {
            return -1;
        }
    }

    0
}

fn version_parts(version: &str) -> Vec<u64> {
    version
        .trim_start_matches(|character: char| !character.is_ascii_digit())
        .split(['.', '-'])
        .map(|part| part.parse::<u64>().unwrap_or(0))
        .collect()
}
