mod auto_update;
mod backup;
mod bootstrap;
mod codex_app_server;
mod codex_home;
mod codex_session_usage;
mod extension_inventory;
mod project_memory;
mod system_notification;
mod thread_terminal;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window_vibrancy::apply_vibrancy(
                        &window,
                        window_vibrancy::NSVisualEffectMaterial::UnderWindowBackground,
                        Some(window_vibrancy::NSVisualEffectState::Active),
                        Some(12.0),
                    );
                }
            }

            let _ = codex_session_usage::start_codex_session_usage_background_sync(None);
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = codex_app_server::start_codex_app_server_realtime_bridge(app_handle).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            bootstrap::get_app_bootstrap_state,
            codex_home::detect_codex_home,
            codex_home::scan_codex_home,
            codex_home::scan_codex_sessions,
            codex_home::list_codex_sessions,
            codex_home::get_codex_session_messages,
            codex_home::apply_codex_thread_file_action,
            codex_home::scan_codex_env_conflicts,
            codex_home::check_codex_cli_status,
            codex_session_usage::sync_codex_session_usage,
            codex_session_usage::read_codex_session_usage_dashboard,
            codex_session_usage::get_model_pricing,
            codex_session_usage::update_model_pricing,
            codex_session_usage::delete_model_pricing,
            codex_session_usage::get_default_cost_multiplier,
            codex_session_usage::set_default_cost_multiplier,
            codex_session_usage::get_pricing_model_source,
            codex_session_usage::set_pricing_model_source,
            codex_app_server::read_codex_app_server_thread_snapshot,
            codex_app_server::start_codex_app_server_realtime_bridge,
            codex_app_server::stop_codex_app_server_realtime_bridge,
            codex_app_server::start_codex_app_server_turn,
            extension_inventory::read_codex_extension_inventory,
            extension_inventory::inspect_prompt_backfill,
            auto_update::check_auto_update_manifest,
            auto_update::check_auto_update_install_preflight,
            auto_update::prepare_auto_update_install,
            system_notification::get_system_notification_permission,
            system_notification::deliver_system_notification,
            backup::create_backup_snapshot,
            backup::list_backup_snapshots,
            backup::read_backup_lock_state,
            backup::save_backup_lock_state,
            backup::restore_backup_snapshot,
            backup::create_safe_archive,
            thread_terminal::open_thread_restore_in_terminal,
            project_memory::inspect_project_memory,
            project_memory::write_project_memory_template,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                codex_app_server::request_stop_codex_app_server_realtime_bridge();
            }
        });
}
