use serde::Serialize;

#[derive(Serialize)]
pub struct WebResult {
    pub url: String,
    pub text: String,
}

#[tauri::command]
pub async fn fetch_web_page(url: String) -> Result<WebResult, String> {
    let parsed_url = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;

    let client = reqwest::Client::builder()
        .user_agent("SpeedRead/1.0")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Client error: {}", e))?;

    let response = client
        .get(parsed_url.as_str())
        .send()
        .await
        .map_err(|e| format!("Fetch error: {}", e))?;

    let html = response
        .text()
        .await
        .map_err(|e| format!("Read error: {}", e))?;

    // Try readability extraction first, fall back to raw text
    let mut cursor = std::io::Cursor::new(html.as_bytes());
    let text = match readability::extractor::extract(&mut cursor, &parsed_url) {
        Ok(extracted) => extracted.text,
        Err(_) => {
            // Strip HTML tags as fallback
            let re = regex::Regex::new(r"<[^>]*>").unwrap_or_else(|_| regex::Regex::new(".^").unwrap());
            let stripped = re.replace_all(&html, " ");
            stripped.split_whitespace().collect::<Vec<_>>().join(" ")
        }
    };

    // Limit to ~4000 chars to not overwhelm the AI context
    let truncated = if text.len() > 4000 {
        format!("{}...\n[truncated at 4000 chars]", &text[..4000])
    } else {
        text
    };

    Ok(WebResult {
        url: parsed_url.to_string(),
        text: truncated,
    })
}
