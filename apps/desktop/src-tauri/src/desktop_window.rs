use serde::Serialize;
use tauri::{AppHandle, LogicalSize, Manager, Size};

const MAIN_WINDOW_LABEL: &str = "main";
const DEFAULT_MAIN_WINDOW_WIDTH: f64 = 1200.0;
const DEFAULT_MAIN_WINDOW_HEIGHT: f64 = 800.0;
const MIN_MAIN_WINDOW_WIDTH: f64 = 960.0;
const MIN_MAIN_WINDOW_HEIGHT: f64 = 640.0;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MainWindowResetResult {
    status: &'static str,
    width: f64,
    height: f64,
    min_width: f64,
    min_height: f64,
    message: String,
}

#[tauri::command]
pub fn reset_main_window_to_default_size(app: AppHandle) -> Result<MainWindowResetResult, String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "未找到 Aiotto 主窗口。".to_string())?;

    if window.is_fullscreen().map_err(window_error)? {
        window.set_fullscreen(false).map_err(window_error)?;
    }

    if window.is_maximized().map_err(window_error)? {
        window.unmaximize().map_err(window_error)?;
    }

    window
        .set_min_size(Some(Size::Logical(LogicalSize {
            width: MIN_MAIN_WINDOW_WIDTH,
            height: MIN_MAIN_WINDOW_HEIGHT,
        })))
        .map_err(window_error)?;
    window
        .set_size(Size::Logical(LogicalSize {
            width: DEFAULT_MAIN_WINDOW_WIDTH,
            height: DEFAULT_MAIN_WINDOW_HEIGHT,
        }))
        .map_err(window_error)?;
    window.center().map_err(window_error)?;

    Ok(MainWindowResetResult {
        status: "reset",
        width: DEFAULT_MAIN_WINDOW_WIDTH,
        height: DEFAULT_MAIN_WINDOW_HEIGHT,
        min_width: MIN_MAIN_WINDOW_WIDTH,
        min_height: MIN_MAIN_WINDOW_HEIGHT,
        message: "主窗口已重置为 1200 x 800。".to_string(),
    })
}

fn window_error(error: tauri::Error) -> String {
    format!("主窗口默认大小重置失败：{error}")
}
