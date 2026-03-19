use serde::Serialize;

#[derive(Serialize)]
pub struct ParsedArticle {
    pub title: String,
    pub text: String,
}

#[tauri::command]
pub async fn fetch_and_parse_url(url: String) -> Result<ParsedArticle, String> {
    let parsed_url = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;

    let response = reqwest::get(parsed_url.as_str())
        .await
        .map_err(|e| format!("Fetch error: {}", e))?;

    let html = response
        .text()
        .await
        .map_err(|e| format!("Read error: {}", e))?;

    let mut cursor = std::io::Cursor::new(html.as_bytes());
    let extracted = readability::extractor::extract(&mut cursor, &parsed_url)
        .map_err(|e| format!("Parse error: {}", e))?;

    Ok(ParsedArticle {
        title: extracted.title,
        text: extracted.text,
    })
}
