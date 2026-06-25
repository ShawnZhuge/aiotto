use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SystemNotificationPermission {
    pub status: String,
    pub can_deliver: bool,
    pub label: String,
    pub delivery_mode: String,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SystemNotificationRequest {
    pub id: String,
    pub title: String,
    pub body: String,
    pub target_page: String,
    pub target_id: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SafeSystemNotificationPayload {
    pub id: String,
    pub title: String,
    pub body: String,
    pub target_page: String,
    pub target_id: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SystemNotificationDeliveryResult {
    pub in_app: bool,
    pub system_delivered: bool,
    pub status_label: String,
    pub reason: String,
    pub payload: SafeSystemNotificationPayload,
}

pub fn normalize_system_notification_permission(status: &str) -> SystemNotificationPermission {
    match status {
        "authorized" => SystemNotificationPermission {
            status: "authorized".to_string(),
            can_deliver: true,
            label: "系统已授权".to_string(),
            delivery_mode: "sandbox".to_string(),
        },
        "denied" => SystemNotificationPermission {
            status: "denied".to_string(),
            can_deliver: false,
            label: "系统未授权".to_string(),
            delivery_mode: "sandbox".to_string(),
        },
        "not_determined" => SystemNotificationPermission {
            status: "not_determined".to_string(),
            can_deliver: false,
            label: "等待授权".to_string(),
            delivery_mode: "sandbox".to_string(),
        },
        "unsupported" => SystemNotificationPermission {
            status: "unsupported".to_string(),
            can_deliver: false,
            label: "系统不支持".to_string(),
            delivery_mode: "sandbox".to_string(),
        },
        "native_authorized" => SystemNotificationPermission {
            status: "authorized".to_string(),
            can_deliver: false,
            label: "原生通知桥未接入".to_string(),
            delivery_mode: "native_bridge_missing".to_string(),
        },
        _ => SystemNotificationPermission {
            status: "unknown".to_string(),
            can_deliver: false,
            label: "权限未知".to_string(),
            delivery_mode: "sandbox".to_string(),
        },
    }
}

pub fn build_safe_system_notification_payload(
    request: SystemNotificationRequest,
) -> SafeSystemNotificationPayload {
    SafeSystemNotificationPayload {
        id: sanitize_identifier(&request.id),
        title: sanitize_notification_text(&request.title),
        body: sanitize_notification_text(&request.body),
        target_page: sanitize_identifier(&request.target_page),
        target_id: sanitize_target_id(&request.target_id),
    }
}

pub fn evaluate_system_notification_delivery_in(
    permission: SystemNotificationPermission,
    request: SystemNotificationRequest,
) -> SystemNotificationDeliveryResult {
    let payload = build_safe_system_notification_payload(request);
    if !permission.can_deliver {
        return SystemNotificationDeliveryResult {
            in_app: true,
            system_delivered: false,
            status_label: permission.label,
            reason: permission.status,
            payload,
        };
    }

    SystemNotificationDeliveryResult {
        in_app: true,
        system_delivered: true,
        status_label: "系统已投递".to_string(),
        reason: "delivered".to_string(),
        payload,
    }
}

#[tauri::command]
pub fn get_system_notification_permission() -> SystemNotificationPermission {
    let status = std::env::var("AIOTTO_SYSTEM_NOTIFICATION_PERMISSION")
        .unwrap_or_else(|_| "unsupported".to_string());
    normalize_system_notification_permission(&status)
}

#[tauri::command]
pub fn deliver_system_notification(
    request: SystemNotificationRequest,
) -> SystemNotificationDeliveryResult {
    evaluate_system_notification_delivery_in(get_system_notification_permission(), request)
}

fn sanitize_notification_text(value: &str) -> String {
    value
        .split_whitespace()
        .map(|part| {
            if part.contains('@') {
                let local = part.split('@').next().unwrap_or_default();
                let prefix: String = local.chars().take(5).collect();
                format!("{prefix}***")
            } else if part.starts_with("sk-") {
                "[redacted-key]".to_string()
            } else if part.to_ascii_lowercase().starts_with("token=") {
                "[redacted-token]".to_string()
            } else {
                part.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn sanitize_identifier(value: &str) -> String {
    value
        .chars()
        .filter(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | ':' | '.')
        })
        .collect()
}

fn sanitize_target_id(value: &str) -> String {
    let sanitized = sanitize_identifier(value);
    match sanitized.as_str() {
        "settings:update" => sanitized,
        _ => sanitized.chars().take(80).collect(),
    }
}
