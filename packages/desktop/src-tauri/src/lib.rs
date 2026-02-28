mod commands;

use tauri::Manager;

#[tauri::command]
async fn close_splashscreen(app: tauri::AppHandle) -> Result<(), ()> {
    let splash = app.get_webview_window("splashscreen").unwrap();
    let main = app.get_webview_window("main").unwrap();
    splash.close().unwrap();
    main.show().unwrap();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            // Mitigation for OWASP A06:2025 – Identification and Authentication Failures:
            // updater verifies ed25519 signature before installing any update.
            tauri_plugin_updater::Builder::new().build()
        )
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::execute_api_request,
            commands::fetch_spec,
            close_splashscreen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running YASP desktop application");
}
