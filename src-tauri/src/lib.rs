mod commands;

use commands::readability::fetch_and_parse_url;
use commands::file_ops::{read_source_file, write_source_file, list_source_files};
use commands::web::fetch_web_page;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            fetch_and_parse_url,
            read_source_file,
            write_source_file,
            list_source_files,
            fetch_web_page,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
