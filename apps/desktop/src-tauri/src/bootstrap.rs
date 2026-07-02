use serde::Serialize;

#[derive(Debug, Serialize, PartialEq, Eq)]
pub struct AppBootstrapState {
    pub product_name: &'static str,
    pub platform_scope: &'static str,
    pub mvp_data_boundary: &'static str,
}

pub fn build_app_bootstrap_state() -> AppBootstrapState {
    AppBootstrapState {
        product_name: "Aiotto",
        platform_scope: "macOS-first",
        mvp_data_boundary: "local-only",
    }
}

#[tauri::command]
pub fn get_app_bootstrap_state() -> AppBootstrapState {
    build_app_bootstrap_state()
}
