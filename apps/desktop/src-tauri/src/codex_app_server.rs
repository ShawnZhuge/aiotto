use serde::Serialize;
use serde_json::{Value, json};
use std::{
    env,
    io::{BufRead, BufReader, Write},
    path::{Path, PathBuf},
    process::{Child, ChildStdin, Command, Stdio},
    sync::{
        Arc, Condvar, Mutex, OnceLock,
        atomic::{AtomicI64, Ordering},
        mpsc,
    },
    thread,
    time::{Duration, Instant},
};
use tauri::Emitter;

const APP_SERVER_TIMEOUT: Duration = Duration::from_secs(4);
const MAX_THREAD_SNAPSHOT_LIMIT: usize = 3;
const MAX_THREAD_MESSAGES: usize = 40;
const CODEX_APP_SERVER_REALTIME_EVENT_NAME: &str = "codex-app-server://realtime-event";

static REALTIME_BRIDGE: OnceLock<Mutex<Option<CodexAppServerRealtimeBridgeHandle>>> =
    OnceLock::new();
static TURN_START_REQUEST_ID: AtomicI64 = AtomicI64::new(1_000);

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerThreadSnapshot {
    pub source_kind: String,
    pub source_label: String,
    pub error_message: Option<String>,
    pub threads: Vec<CodexAppServerThread>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerThread {
    pub thread_id: String,
    pub title: String,
    pub preview: String,
    pub status: String,
    pub project_path: String,
    pub source_file: String,
    pub updated_at_epoch_ms: Option<u64>,
    pub messages: Vec<CodexAppServerMessage>,
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerMessage {
    pub role: String,
    pub content: String,
    pub ts: Option<u64>,
}

#[derive(Debug, Serialize, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerRealtimeEvent {
    pub event_kind: String,
    pub method: String,
    pub thread_id: String,
    pub turn_id: Option<String>,
    pub item_id: Option<String>,
    pub role: Option<String>,
    pub delta: Option<String>,
    pub text: Option<String>,
    pub status: Option<String>,
    pub plan_steps: Vec<CodexAppServerPlanStep>,
    pub ts: Option<u64>,
}

#[derive(Debug, Serialize, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerPlanStep {
    pub step: String,
    pub status: String,
}

#[derive(Debug, Serialize, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerRealtimeBridgeStatus {
    pub source_kind: String,
    pub running: bool,
    pub already_running: bool,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CodexAppServerTurnStartStatus {
    pub source_kind: String,
    pub running: bool,
    pub request_id: Option<i64>,
    pub thread_id: Option<String>,
    pub error_message: Option<String>,
}

struct CodexAppServerRealtimeBridgeHandle {
    child: Child,
    stdin: Arc<Mutex<ChildStdin>>,
    ready_signal: CodexAppServerRealtimeBridgeReadySignal,
}

#[derive(Clone)]
pub(crate) struct CodexAppServerRealtimeBridgeReadySignal {
    ready: Arc<(Mutex<bool>, Condvar)>,
}

impl CodexAppServerRealtimeBridgeReadySignal {
    pub(crate) fn new() -> Self {
        Self {
            ready: Arc::new((Mutex::new(false), Condvar::new())),
        }
    }

    pub(crate) fn mark_ready(&self) {
        let (ready_lock, ready_condvar) = &*self.ready;
        if let Ok(mut ready) = ready_lock.lock() {
            *ready = true;
            ready_condvar.notify_all();
        }
    }

    pub(crate) fn wait_ready(&self, timeout: Duration) -> Result<(), String> {
        let (ready_lock, ready_condvar) = &*self.ready;
        let ready = ready_lock
            .lock()
            .map_err(|_| "Codex app-server realtime bridge ready lock is poisoned".to_string())?;
        if *ready {
            return Ok(());
        }

        let (ready, _) = ready_condvar
            .wait_timeout_while(ready, timeout, |ready| !*ready)
            .map_err(|_| "Codex app-server realtime bridge ready lock is poisoned".to_string())?;
        if *ready {
            Ok(())
        } else {
            Err("Timed out waiting for codex app-server realtime bridge initialization".to_string())
        }
    }
}

#[tauri::command]
pub async fn read_codex_app_server_thread_snapshot(
    app: tauri::AppHandle,
    limit: Option<usize>,
) -> Result<CodexAppServerThreadSnapshot, String> {
    let limit = limit.unwrap_or(1).clamp(1, MAX_THREAD_SNAPSHOT_LIMIT);
    tauri::async_runtime::spawn_blocking(move || {
        run_codex_app_server_thread_snapshot(limit, Some(app))
    })
    .await
    .map_err(|error| format!("Failed to join Codex app-server snapshot task: {error}"))?
}

#[tauri::command]
pub async fn start_codex_app_server_realtime_bridge(
    app: tauri::AppHandle,
) -> Result<CodexAppServerRealtimeBridgeStatus, String> {
    tauri::async_runtime::spawn_blocking(move || start_realtime_bridge(app))
        .await
        .map_err(|error| {
            format!("Failed to join Codex app-server realtime bridge start task: {error}")
        })?
}

#[tauri::command]
pub async fn stop_codex_app_server_realtime_bridge()
-> Result<CodexAppServerRealtimeBridgeStatus, String> {
    tauri::async_runtime::spawn_blocking(stop_realtime_bridge)
        .await
        .map_err(|error| {
            format!("Failed to join Codex app-server realtime bridge stop task: {error}")
        })?
}

#[tauri::command]
pub async fn start_codex_app_server_turn(
    app: tauri::AppHandle,
    thread_id: String,
    prompt: String,
    cwd: Option<String>,
) -> Result<CodexAppServerTurnStartStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        send_turn_start_request_on_realtime_bridge(app, &thread_id, &prompt, cwd.as_deref())
    })
    .await
    .map_err(|error| format!("Failed to join Codex app-server turn start task: {error}"))?
}

pub(crate) fn request_stop_codex_app_server_realtime_bridge() {
    let _ = stop_realtime_bridge();
}

fn start_realtime_bridge(
    app: tauri::AppHandle,
) -> Result<CodexAppServerRealtimeBridgeStatus, String> {
    let bridge = REALTIME_BRIDGE.get_or_init(|| Mutex::new(None));
    let mut bridge_guard = bridge
        .lock()
        .map_err(|_| "Codex app-server realtime bridge lock is poisoned".to_string())?;
    if bridge_guard.is_some() {
        return Ok(realtime_bridge_started_status(true));
    }

    let codex_cli_path = resolve_codex_cli_path().unwrap_or_else(|| PathBuf::from("codex"));
    let mut child = match Command::new(&codex_cli_path)
        .arg("app-server")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
    {
        Ok(child) => child,
        Err(error) => {
            return Ok(realtime_bridge_unavailable_status(&format!(
                "Failed to start codex app-server from {}: {error}",
                codex_cli_path.display()
            )));
        }
    };

    let stdin = match child.stdin.take() {
        Some(stdin) => Arc::new(Mutex::new(stdin)),
        None => {
            stop_child(&mut child);
            return Ok(realtime_bridge_unavailable_status(
                "Failed to open codex app-server realtime bridge stdin",
            ));
        }
    };
    let stdout = match child.stdout.take() {
        Some(stdout) => stdout,
        None => {
            stop_child(&mut child);
            return Ok(realtime_bridge_unavailable_status(
                "Failed to open codex app-server realtime bridge stdout",
            ));
        }
    };

    {
        let mut stdin_guard = stdin
            .lock()
            .map_err(|_| "Codex app-server realtime bridge stdin lock is poisoned".to_string())?;
        send_app_server_message(
            &mut *stdin_guard,
            &json!({
                "method": "initialize",
                "id": 0,
                "params": {
                    "clientInfo": {
                        "name": "aiotto",
                        "title": "Aiotto",
                        "version": env!("CARGO_PKG_VERSION")
                    },
                    "capabilities": {
                        "experimentalApi": true
                    }
                }
            }),
        )?;
    }

    let ready_signal = CodexAppServerRealtimeBridgeReadySignal::new();
    spawn_realtime_bridge_reader(app, stdin.clone(), stdout, ready_signal.clone());
    *bridge_guard = Some(CodexAppServerRealtimeBridgeHandle {
        child,
        stdin,
        ready_signal,
    });

    Ok(realtime_bridge_started_status(false))
}

fn send_turn_start_request_on_realtime_bridge(
    app: tauri::AppHandle,
    thread_id: &str,
    prompt: &str,
    cwd: Option<&str>,
) -> Result<CodexAppServerTurnStartStatus, String> {
    let bridge_status = start_realtime_bridge(app.clone())?;
    if bridge_status.source_kind != "app_server" || !bridge_status.running {
        return Ok(CodexAppServerTurnStartStatus {
            source_kind: bridge_status.source_kind,
            running: false,
            request_id: None,
            thread_id: None,
            error_message: bridge_status.error_message,
        });
    }

    let request_id = TURN_START_REQUEST_ID.fetch_add(1, Ordering::SeqCst);
    let request = match build_turn_start_request(request_id, thread_id, prompt, cwd) {
        Ok(request) => request,
        Err(error) => {
            return Ok(CodexAppServerTurnStartStatus {
                source_kind: "unavailable".to_string(),
                running: false,
                request_id: None,
                thread_id: None,
                error_message: Some(error),
            });
        }
    };

    let (stdin, ready_signal) = {
        let bridge = REALTIME_BRIDGE.get_or_init(|| Mutex::new(None));
        let bridge_guard = bridge
            .lock()
            .map_err(|_| "Codex app-server realtime bridge lock is poisoned".to_string())?;
        let Some(handle) = bridge_guard.as_ref() else {
            return Ok(CodexAppServerTurnStartStatus {
                source_kind: "unavailable".to_string(),
                running: false,
                request_id: None,
                thread_id: None,
                error_message: Some("Codex app-server realtime bridge is not running".to_string()),
            });
        };
        (handle.stdin.clone(), handle.ready_signal.clone())
    };

    if let Err(error) = ready_signal.wait_ready(APP_SERVER_TIMEOUT) {
        return Ok(CodexAppServerTurnStartStatus {
            source_kind: "unavailable".to_string(),
            running: false,
            request_id: None,
            thread_id: None,
            error_message: Some(error),
        });
    }

    let mut stdin_guard = stdin
        .lock()
        .map_err(|_| "Codex app-server realtime bridge stdin lock is poisoned".to_string())?;
    send_app_server_message(&mut *stdin_guard, &request)?;
    if let Ok(event) = build_turn_start_requested_event(thread_id) {
        let _ = app.emit(CODEX_APP_SERVER_REALTIME_EVENT_NAME, event);
    }

    Ok(CodexAppServerTurnStartStatus {
        source_kind: "app_server".to_string(),
        running: true,
        request_id: Some(request_id),
        thread_id: Some(thread_id.trim().to_string()),
        error_message: None,
    })
}

fn stop_realtime_bridge() -> Result<CodexAppServerRealtimeBridgeStatus, String> {
    let bridge = REALTIME_BRIDGE.get_or_init(|| Mutex::new(None));
    let mut bridge_guard = bridge
        .lock()
        .map_err(|_| "Codex app-server realtime bridge lock is poisoned".to_string())?;
    if let Some(mut handle) = bridge_guard.take() {
        stop_child(&mut handle.child);
    }

    Ok(CodexAppServerRealtimeBridgeStatus {
        source_kind: "app_server".to_string(),
        running: false,
        already_running: false,
        error_message: None,
    })
}

fn spawn_realtime_bridge_reader(
    app: tauri::AppHandle,
    stdin: Arc<Mutex<ChildStdin>>,
    stdout: impl std::io::Read + Send + 'static,
    ready_signal: CodexAppServerRealtimeBridgeReadySignal,
) {
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            let Ok(line) = line else {
                break;
            };
            if line.trim().is_empty() {
                continue;
            }

            let Ok(message) = serde_json::from_str::<Value>(&line) else {
                continue;
            };

            if message.get("id").and_then(Value::as_i64) == Some(0) {
                if let Ok(mut stdin_guard) = stdin.lock() {
                    let _ = send_app_server_message(
                        &mut *stdin_guard,
                        &json!({ "method": "initialized", "params": {} }),
                    );
                    ready_signal.mark_ready();
                }
                continue;
            }

            if let Some(event) = realtime_event_from_app_server_notification_value(&message) {
                let _ = app.emit(CODEX_APP_SERVER_REALTIME_EVENT_NAME, event);
            }
        }
    });
}

pub(crate) fn realtime_bridge_started_status(
    already_running: bool,
) -> CodexAppServerRealtimeBridgeStatus {
    CodexAppServerRealtimeBridgeStatus {
        source_kind: "app_server".to_string(),
        running: true,
        already_running,
        error_message: None,
    }
}

pub(crate) fn realtime_bridge_unavailable_status(
    error_message: &str,
) -> CodexAppServerRealtimeBridgeStatus {
    CodexAppServerRealtimeBridgeStatus {
        source_kind: "unavailable".to_string(),
        running: false,
        already_running: false,
        error_message: Some(error_message.to_string()),
    }
}

pub(crate) fn build_turn_start_request(
    request_id: i64,
    thread_id: &str,
    prompt: &str,
    cwd: Option<&str>,
) -> Result<Value, String> {
    let thread_id = thread_id.trim();
    if thread_id.is_empty() {
        return Err("threadId is required".to_string());
    }

    let prompt = prompt.trim();
    if prompt.is_empty() {
        return Err("prompt is required".to_string());
    }

    let mut params = json!({
        "threadId": thread_id,
        "input": [
            {
                "type": "text",
                "text": prompt,
                "text_elements": []
            }
        ]
    });

    if let Some(cwd) = cwd.map(str::trim).filter(|cwd| !cwd.is_empty()) {
        if let Some(params) = params.as_object_mut() {
            params.insert("cwd".to_string(), json!(cwd));
        }
    }

    Ok(json!({
        "method": "turn/start",
        "id": request_id,
        "params": params
    }))
}

pub(crate) fn build_turn_start_requested_event(
    thread_id: &str,
) -> Result<CodexAppServerRealtimeEvent, String> {
    let thread_id = thread_id.trim();
    if thread_id.is_empty() {
        return Err("threadId is required".to_string());
    }

    Ok(CodexAppServerRealtimeEvent {
        event_kind: "turn_start_requested".to_string(),
        method: "aiotto/turn_start_requested".to_string(),
        thread_id: thread_id.to_string(),
        turn_id: None,
        item_id: None,
        role: None,
        delta: None,
        text: None,
        status: Some("running".to_string()),
        plan_steps: Vec::new(),
        ts: None,
    })
}

fn run_codex_app_server_thread_snapshot(
    limit: usize,
    app: Option<tauri::AppHandle>,
) -> Result<CodexAppServerThreadSnapshot, String> {
    let codex_cli_path = resolve_codex_cli_path().unwrap_or_else(|| PathBuf::from("codex"));
    let mut child = Command::new(&codex_cli_path)
        .arg("app-server")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| {
            format!(
                "Failed to start codex app-server from {}: {error}",
                codex_cli_path.display()
            )
        })?;

    let mut stdin = child
        .stdin
        .take()
        .ok_or_else(|| "Failed to open codex app-server stdin".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Failed to open codex app-server stdout".to_string())?;

    let (line_sender, line_receiver) = mpsc::channel::<Result<String, String>>();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if line_sender
                .send(line.map_err(|error| error.to_string()))
                .is_err()
            {
                break;
            }
        }
    });

    send_app_server_message(
        &mut stdin,
        &json!({
            "method": "initialize",
            "id": 0,
            "params": {
                "clientInfo": {
                    "name": "aiotto",
                    "title": "Aiotto",
                    "version": env!("CARGO_PKG_VERSION")
                },
                "capabilities": {
                    "experimentalApi": true
                }
            }
        }),
    )?;

    let deadline = Instant::now() + APP_SERVER_TIMEOUT;
    let mut expected_thread_reads = 0usize;
    let mut completed_thread_reads = 0usize;
    let mut threads: Vec<CodexAppServerThread> = Vec::new();

    loop {
        let remaining = deadline.saturating_duration_since(Instant::now());
        if remaining.is_zero() {
            stop_child(&mut child);
            return Err("Timed out waiting for codex app-server thread snapshot".to_string());
        }

        let line = match line_receiver.recv_timeout(remaining) {
            Ok(Ok(line)) => line,
            Ok(Err(error)) => {
                stop_child(&mut child);
                return Err(format!("Failed reading codex app-server stdout: {error}"));
            }
            Err(_) => {
                stop_child(&mut child);
                return Err("Timed out waiting for codex app-server response".to_string());
            }
        };
        if line.trim().is_empty() {
            continue;
        }

        let message: Value = serde_json::from_str(&line)
            .map_err(|error| format!("Invalid codex app-server JSON response: {error}"))?;
        if let Some(event) = realtime_event_from_app_server_notification_value(&message) {
            if let Some(app) = &app {
                let _ = app.emit(CODEX_APP_SERVER_REALTIME_EVENT_NAME, event);
            }
            continue;
        }

        if message.get("id").and_then(Value::as_i64) == Some(0) {
            send_app_server_message(
                &mut stdin,
                &json!({ "method": "initialized", "params": {} }),
            )?;
            send_app_server_message(
                &mut stdin,
                &json!({
                    "method": "thread/list",
                    "id": 1,
                    "params": {
                        "limit": limit,
                        "sortKey": "updated_at",
                        "sortDirection": "desc",
                        "archived": false
                    }
                }),
            )?;
            continue;
        }

        if message.get("id").and_then(Value::as_i64) == Some(1) {
            let list_threads = message
                .get("result")
                .and_then(|result| result.get("data"))
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            expected_thread_reads = list_threads.len().min(limit);
            if expected_thread_reads == 0 {
                stop_child(&mut child);
                return Ok(success_snapshot(Vec::new()));
            }

            for (index, thread) in list_threads.iter().take(limit).enumerate() {
                if let Some(thread_id) = thread.get("id").and_then(Value::as_str) {
                    send_app_server_message(
                        &mut stdin,
                        &json!({
                            "method": "thread/read",
                            "id": 100 + index as i64,
                            "params": {
                                "threadId": thread_id,
                                "includeTurns": true
                            }
                        }),
                    )?;
                } else {
                    completed_thread_reads += 1;
                }
            }
            continue;
        }

        let response_id = message.get("id").and_then(Value::as_i64);
        if matches!(response_id, Some(id) if id >= 100) {
            completed_thread_reads += 1;
            if message.get("error").is_none() {
                let thread_value = message
                    .get("result")
                    .and_then(|result| result.get("thread"))
                    .or_else(|| message.get("result"));
                if let Some(thread_value) = thread_value {
                    if let Some(thread) = thread_from_app_server_value(thread_value) {
                        threads.push(thread);
                    }
                }
            }

            if expected_thread_reads > 0 && completed_thread_reads >= expected_thread_reads {
                stop_child(&mut child);
                return Ok(success_snapshot(threads));
            }
        }
    }
}

pub(crate) fn thread_from_app_server_value(value: &Value) -> Option<CodexAppServerThread> {
    let thread_id = read_string(value.get("id"))?;
    let preview = read_string(value.get("preview")).unwrap_or_default();
    let title = read_string(value.get("name"))
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| {
            if preview.is_empty() {
                thread_id.clone()
            } else {
                preview.clone()
            }
        });
    let source_file = read_string(value.get("path"))?;
    let project_path = read_string(value.get("cwd")).unwrap_or_default();
    let updated_at_epoch_ms = value
        .get("updatedAt")
        .and_then(Value::as_u64)
        .map(seconds_to_epoch_ms);
    let status = app_server_status_to_thread_status(value.get("status"));
    let messages = messages_from_app_server_thread_value(value);

    Some(CodexAppServerThread {
        thread_id,
        title,
        preview,
        status,
        project_path,
        source_file,
        updated_at_epoch_ms,
        messages,
    })
}

pub fn parse_app_server_notification_line(
    line: &str,
) -> Result<Option<CodexAppServerRealtimeEvent>, String> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    let message: Value = serde_json::from_str(trimmed)
        .map_err(|error| format!("Invalid codex app-server notification JSON: {error}"))?;
    Ok(realtime_event_from_app_server_notification_value(&message))
}

fn realtime_event_from_app_server_notification_value(
    value: &Value,
) -> Option<CodexAppServerRealtimeEvent> {
    if value.get("id").is_some() {
        return None;
    }

    let method = read_string(value.get("method"))?;
    let params = value.get("params")?;

    match method.as_str() {
        "item/agentMessage/delta" => {
            let thread_id = read_string(params.get("threadId"))?;
            let delta = read_raw_string(params.get("delta"))?;
            Some(CodexAppServerRealtimeEvent {
                event_kind: "assistant_delta".to_string(),
                method,
                thread_id,
                turn_id: read_string(params.get("turnId")),
                item_id: read_string(params.get("itemId")),
                role: Some("assistant".to_string()),
                delta: Some(delta),
                text: None,
                status: Some("running".to_string()),
                plan_steps: Vec::new(),
                ts: None,
            })
        }
        "thread/realtime/transcript/delta" => {
            let thread_id = read_string(params.get("threadId"))?;
            let delta = read_raw_string(params.get("delta"))?;
            Some(CodexAppServerRealtimeEvent {
                event_kind: "transcript_delta".to_string(),
                method,
                thread_id,
                turn_id: None,
                item_id: None,
                role: read_string(params.get("role")),
                delta: Some(delta),
                text: None,
                status: Some("running".to_string()),
                plan_steps: Vec::new(),
                ts: None,
            })
        }
        "thread/realtime/transcript/done" => {
            let thread_id = read_string(params.get("threadId"))?;
            let text = read_string(params.get("text"))?;
            Some(CodexAppServerRealtimeEvent {
                event_kind: "transcript_done".to_string(),
                method,
                thread_id,
                turn_id: None,
                item_id: None,
                role: read_string(params.get("role")),
                delta: None,
                text: Some(text),
                status: Some("running".to_string()),
                plan_steps: Vec::new(),
                ts: None,
            })
        }
        "item/plan/delta" => {
            let thread_id = read_string(params.get("threadId"))?;
            let delta = read_raw_string(params.get("delta"))?;
            Some(CodexAppServerRealtimeEvent {
                event_kind: "plan_delta".to_string(),
                method,
                thread_id,
                turn_id: read_string(params.get("turnId")),
                item_id: read_string(params.get("itemId")),
                role: Some("assistant".to_string()),
                delta: Some(delta),
                text: None,
                status: Some("running".to_string()),
                plan_steps: Vec::new(),
                ts: None,
            })
        }
        "turn/plan/updated" => {
            let thread_id = read_string(params.get("threadId"))?;
            let plan_steps = plan_steps_from_value(params.get("plan"));
            let text =
                current_plan_text(&plan_steps).or_else(|| read_string(params.get("explanation")));
            Some(CodexAppServerRealtimeEvent {
                event_kind: "plan_updated".to_string(),
                method,
                thread_id,
                turn_id: read_string(params.get("turnId")),
                item_id: None,
                role: Some("assistant".to_string()),
                delta: None,
                text,
                status: Some("running".to_string()),
                plan_steps,
                ts: None,
            })
        }
        "item/completed" => {
            let thread_id = read_string(params.get("threadId"))?;
            let item = params.get("item")?;
            let item_type = read_string(item.get("type"))?;
            let (event_kind, role, text) = match item_type.as_str() {
                "agentMessage" => (
                    "assistant_done".to_string(),
                    Some("assistant".to_string()),
                    read_string(item.get("text"))?,
                ),
                "plan" => (
                    "plan_done".to_string(),
                    Some("assistant".to_string()),
                    read_string(item.get("text"))?,
                ),
                "userMessage" => (
                    "user_done".to_string(),
                    Some("user".to_string()),
                    user_message_text(item)?,
                ),
                _ => return None,
            };
            Some(CodexAppServerRealtimeEvent {
                event_kind,
                method,
                thread_id,
                turn_id: read_string(params.get("turnId")),
                item_id: read_string(item.get("id")),
                role,
                delta: None,
                text: Some(text),
                status: Some("running".to_string()),
                plan_steps: Vec::new(),
                ts: params.get("completedAtMs").and_then(Value::as_u64),
            })
        }
        "thread/status/changed" => {
            let thread_id = read_string(params.get("threadId"))?;
            Some(CodexAppServerRealtimeEvent {
                event_kind: "status_changed".to_string(),
                method,
                thread_id,
                turn_id: None,
                item_id: None,
                role: None,
                delta: None,
                text: None,
                status: Some(app_server_status_to_thread_status(params.get("status"))),
                plan_steps: Vec::new(),
                ts: None,
            })
        }
        "turn/started" => {
            let thread_id = read_string(params.get("threadId"))?;
            let turn = params.get("turn");
            Some(CodexAppServerRealtimeEvent {
                event_kind: "turn_started".to_string(),
                method,
                thread_id,
                turn_id: turn.and_then(|turn| read_string(turn.get("id"))),
                item_id: None,
                role: None,
                delta: None,
                text: None,
                status: Some("running".to_string()),
                plan_steps: Vec::new(),
                ts: turn
                    .and_then(|turn| turn.get("startedAt"))
                    .and_then(Value::as_u64)
                    .map(seconds_to_epoch_ms),
            })
        }
        "turn/completed" => {
            let thread_id = read_string(params.get("threadId"))?;
            let turn = params.get("turn");
            Some(CodexAppServerRealtimeEvent {
                event_kind: "turn_completed".to_string(),
                method,
                thread_id,
                turn_id: turn.and_then(|turn| read_string(turn.get("id"))),
                item_id: None,
                role: None,
                delta: None,
                text: None,
                status: turn
                    .and_then(|turn| read_string(turn.get("status")))
                    .map(|status| app_server_turn_status_to_thread_status(&status)),
                plan_steps: Vec::new(),
                ts: turn
                    .and_then(|turn| turn.get("completedAt"))
                    .and_then(Value::as_u64)
                    .map(seconds_to_epoch_ms),
            })
        }
        _ => None,
    }
}

fn plan_steps_from_value(value: Option<&Value>) -> Vec<CodexAppServerPlanStep> {
    value
        .and_then(Value::as_array)
        .map(|steps| {
            steps
                .iter()
                .filter_map(|step| {
                    Some(CodexAppServerPlanStep {
                        step: read_string(step.get("step"))?,
                        status: read_string(step.get("status"))
                            .unwrap_or_else(|| "pending".to_string()),
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

fn current_plan_text(plan_steps: &[CodexAppServerPlanStep]) -> Option<String> {
    plan_steps
        .iter()
        .find(|step| step.status == "inProgress")
        .or_else(|| {
            plan_steps
                .iter()
                .rev()
                .find(|step| step.status == "completed")
        })
        .or_else(|| plan_steps.first())
        .map(|step| step.step.clone())
}

fn messages_from_app_server_thread_value(value: &Value) -> Vec<CodexAppServerMessage> {
    let mut messages = Vec::new();
    let turns = value
        .get("turns")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    for turn in turns {
        let ts = turn
            .get("completedAt")
            .and_then(Value::as_u64)
            .or_else(|| turn.get("startedAt").and_then(Value::as_u64))
            .map(seconds_to_epoch_ms);
        let items = turn
            .get("items")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        for item in items {
            match item.get("type").and_then(Value::as_str) {
                Some("userMessage") => {
                    if let Some(content) = user_message_text(&item) {
                        messages.push(CodexAppServerMessage {
                            role: "user".to_string(),
                            content,
                            ts,
                        });
                    }
                }
                Some("agentMessage") | Some("plan") => {
                    if let Some(content) = read_string(item.get("text")) {
                        if !content.is_empty() {
                            messages.push(CodexAppServerMessage {
                                role: "assistant".to_string(),
                                content,
                                ts,
                            });
                        }
                    }
                }
                _ => {}
            }
        }
    }

    if messages.len() > MAX_THREAD_MESSAGES {
        messages.drain(0..messages.len() - MAX_THREAD_MESSAGES);
    }
    messages
}

fn user_message_text(item: &Value) -> Option<String> {
    let text = item
        .get("content")
        .and_then(Value::as_array)?
        .iter()
        .filter_map(|content| {
            if content.get("type").and_then(Value::as_str) == Some("text") {
                read_string(content.get("text"))
            } else {
                None
            }
        })
        .filter(|text| !text.is_empty())
        .collect::<Vec<_>>()
        .join("\n");
    if text.is_empty() { None } else { Some(text) }
}

fn app_server_status_to_thread_status(value: Option<&Value>) -> String {
    match value
        .and_then(|status| status.get("type"))
        .and_then(Value::as_str)
    {
        Some("active") => "running",
        Some("systemError") => "failed",
        Some("idle") | Some("notLoaded") => "idle",
        _ => "unknown",
    }
    .to_string()
}

fn app_server_turn_status_to_thread_status(status: &str) -> String {
    match status {
        "completed" => "completed",
        "failed" => "failed",
        "interrupted" => "idle",
        "inProgress" => "running",
        _ => "unknown",
    }
    .to_string()
}

fn success_snapshot(threads: Vec<CodexAppServerThread>) -> CodexAppServerThreadSnapshot {
    CodexAppServerThreadSnapshot {
        source_kind: "app_server".to_string(),
        source_label: "Codex app-server".to_string(),
        error_message: None,
        threads,
    }
}

fn send_app_server_message(stdin: &mut impl Write, message: &Value) -> Result<(), String> {
    writeln!(stdin, "{message}")
        .and_then(|_| stdin.flush())
        .map_err(|error| format!("Failed writing codex app-server request: {error}"))
}

fn stop_child(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

fn read_string(value: Option<&Value>) -> Option<String> {
    value
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn read_raw_string(value: Option<&Value>) -> Option<String> {
    value
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn seconds_to_epoch_ms(seconds: u64) -> u64 {
    seconds.saturating_mul(1_000)
}

fn resolve_codex_cli_path() -> Option<PathBuf> {
    resolve_codex_cli_path_from_env(
        env::var("HOME").ok().as_deref(),
        env::var("PATH").ok().as_deref(),
        env::var("CODEX_BIN").ok().as_deref(),
        Path::is_file,
    )
}

pub(crate) fn resolve_codex_cli_path_from_env(
    home: Option<&str>,
    path_env: Option<&str>,
    codex_bin_env: Option<&str>,
    exists: impl Fn(&Path) -> bool,
) -> Option<PathBuf> {
    if let Some(path) = codex_bin_env
        .map(str::trim)
        .filter(|path| !path.is_empty())
        .map(PathBuf::from)
        .filter(|path| exists(path))
    {
        return Some(path);
    }

    if let Some(path) = path_env.and_then(|path_env| {
        env::split_paths(path_env)
            .map(|path| path.join("codex"))
            .find(|path| exists(path))
    }) {
        return Some(path);
    }

    let home = home?.trim();
    if home.is_empty() {
        return None;
    }

    [
        PathBuf::from(home).join(".local/bin/codex"),
        PathBuf::from(home).join(".cargo/bin/codex"),
        PathBuf::from("/opt/homebrew/bin/codex"),
        PathBuf::from("/usr/local/bin/codex"),
    ]
    .into_iter()
    .find(|path| exists(path))
}
