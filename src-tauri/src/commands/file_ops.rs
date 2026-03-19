use std::path::PathBuf;
use walkdir::WalkDir;

fn get_project_root() -> Result<PathBuf, String> {
    // First try the compile-time project path (works in built app)
    let compile_time = env!("CARGO_MANIFEST_DIR");
    let project_dir = PathBuf::from(compile_time)
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from(compile_time));

    if project_dir.join("src").exists() {
        return Ok(project_dir);
    }

    // Fallback to cwd (works in dev mode)
    std::env::current_dir().map_err(|e| format!("Failed to get cwd: {}", e))
}

fn resolve_and_check(path: &str) -> Result<PathBuf, String> {
    let root = get_project_root()?;
    let full = root.join(path);
    let canonical_root = root
        .canonicalize()
        .map_err(|e| format!("Cannot canonicalize root: {}", e))?;
    let canonical_path = full
        .canonicalize()
        .unwrap_or_else(|_| full.clone());

    if !canonical_path.starts_with(&canonical_root) {
        return Err("Path traversal not allowed".into());
    }

    Ok(full)
}

#[tauri::command]
pub async fn read_source_file(path: String) -> Result<String, String> {
    let full = resolve_and_check(&path)?;
    std::fs::read_to_string(&full).map_err(|e| format!("Read error: {}", e))
}

#[tauri::command]
pub async fn write_source_file(path: String, content: String) -> Result<(), String> {
    let full = resolve_and_check(&path)?;
    if let Some(parent) = full.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Mkdir error: {}", e))?;
    }
    std::fs::write(&full, content).map_err(|e| format!("Write error: {}", e))
}

#[tauri::command]
pub async fn list_source_files(dir: String) -> Result<Vec<String>, String> {
    let root = get_project_root()?;
    let search_dir = root.join(&dir);

    if !search_dir.exists() {
        return Ok(vec![]);
    }

    let mut files = Vec::new();
    for entry in WalkDir::new(&search_dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let path = entry.path();
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if matches!(ext, "svelte" | "ts" | "css" | "js") {
                if let Ok(relative) = path.strip_prefix(&root) {
                    files.push(relative.to_string_lossy().to_string());
                }
            }
        }
    }

    files.sort();
    Ok(files)
}
