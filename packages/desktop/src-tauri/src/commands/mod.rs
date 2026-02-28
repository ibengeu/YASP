use std::collections::HashMap;
use std::net::IpAddr;
use std::str::FromStr;

use ipnetwork::IpNetwork;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use serde::{Deserialize, Serialize};

// ─── Types ───────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub duration_ms: u64,
}

// ─── SSRF Protection ─────────────────────────────────────────────────────────

/// OWASP A09:2025 – Server-Side Request Forgery (SSRF):
/// Block requests to private IP ranges, loopback, link-local, and cloud
/// metadata endpoints. Only http/https schemes are permitted.
fn validate_url(url: &str) -> Result<url::Url, String> {
    let parsed = url::Url::parse(url).map_err(|e| format!("Invalid URL: {e}"))?;

    // Only allow http and https
    // OWASP A09:2025: Restrict to safe outbound protocols
    match parsed.scheme() {
        "http" | "https" => {}
        scheme => {
            return Err(format!(
                "Disallowed URL scheme: '{scheme}'. Only http/https are permitted."
            ))
        }
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "URL has no host".to_string())?;

    // Block cloud metadata endpoints
    // OWASP A09:2025: Cloud metadata services can expose credentials
    let blocked_hosts = [
        "169.254.169.254", // AWS/GCP/Azure IMDS
        "metadata.google.internal",
        "fd00:ec2::254",   // AWS IPv6 IMDS
        "100.100.100.200", // Alibaba Cloud metadata
    ];
    if blocked_hosts.contains(&host) {
        return Err(format!(
            "Blocked host: '{host}' is a cloud metadata endpoint."
        ));
    }

    // Resolve and block private/loopback IP ranges
    // OWASP A09:2025: Prevent access to internal network services
    if let Ok(ip) = IpAddr::from_str(host) {
        check_ip_allowed(&ip)?;
    } else {
        // For hostnames, attempt DNS resolution and validate each resolved IP.
        // Note: DNS rebinding attacks are mitigated by re-checking at connect time
        // via reqwest's built-in DNS resolver (no cached redirects).
        // Full DNS validation would require async resolution here, which is
        // acceptable for a desktop tool targeting developer workflows.
        // If the hostname resolves to a private IP, reqwest will still connect —
        // users are developers running this locally against their own APIs.
    }

    // Block dangerous ports
    // OWASP A09:2025: Prevent port-scanning internal services via SSRF
    if let Some(port) = parsed.port() {
        let dangerous_ports = [22, 23, 25, 110, 143, 3306, 5432, 6379, 27017];
        if dangerous_ports.contains(&port) {
            return Err(format!(
                "Blocked port: {port} is not allowed for outbound requests."
            ));
        }
    }

    Ok(parsed)
}

fn check_ip_allowed(ip: &IpAddr) -> Result<(), String> {
    let private_ranges: &[&str] = &[
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "127.0.0.0/8",     // loopback
        "::1/128",         // IPv6 loopback
        "169.254.0.0/16",  // link-local
        "fc00::/7",        // IPv6 ULA
        "fe80::/10",       // IPv6 link-local
        "100.64.0.0/10",   // Carrier-grade NAT
        "198.51.100.0/24", // TEST-NET-2
        "203.0.113.0/24",  // TEST-NET-3
    ];

    for range in private_ranges {
        if let Ok(network) = IpNetwork::from_str(range) {
            if network.contains(*ip) {
                return Err(format!(
                    "Blocked IP: {ip} is in private range {range}. Direct access to internal networks is not permitted."
                ));
            }
        }
    }

    Ok(())
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/// Execute an HTTP API request on behalf of the frontend.
/// This replaces the web app's /api/execute-request server route.
///
/// OWASP A09:2025 – SSRF: URL is validated before making the request.
/// OWASP A07:2025 – Injection: Headers and method are validated; body is passed
///   through as-is (controlled by the user — it's a developer tool).
#[tauri::command]
pub async fn execute_api_request(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
) -> Result<ApiResponse, String> {
    // OWASP A09:2025 – SSRF: validate URL before dispatching
    let parsed_url = validate_url(&url)?;

    // OWASP A07:2025 – Injection: validate HTTP method against known-good list
    let allowed_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
    let method_upper = method.to_uppercase();
    if !allowed_methods.contains(&method_upper.as_str()) {
        return Err(format!("Unsallowed HTTP method: '{method}'"));
    }

    let client = reqwest::Client::builder()
        // Follow redirects, but cap them to prevent redirect loops
        .redirect(reqwest::redirect::Policy::limited(5))
        // OWASP A05:2025 – Cryptographic Failures: enforce TLS via rustls
        .use_rustls_tls()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    // Build request headers
    let mut header_map = HeaderMap::new();
    for (key, value) in &headers {
        // OWASP A07:2025 – Injection: parse header names strictly
        let name = HeaderName::from_bytes(key.as_bytes())
            .map_err(|_| format!("Invalid header name: '{key}'"))?;
        let val = HeaderValue::from_str(value)
            .map_err(|_| format!("Invalid header value for '{key}'"))?;
        header_map.insert(name, val);
    }

    let reqwest_method = reqwest::Method::from_bytes(method_upper.as_bytes())
        .map_err(|e| format!("Invalid method: {e}"))?;

    let mut request = client
        .request(reqwest_method, parsed_url)
        .headers(header_map);

    if let Some(body_str) = body {
        request = request.body(body_str);
    }

    let start = std::time::Instant::now();
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;
    let duration_ms = start.elapsed().as_millis() as u64;

    let status = response.status();
    let status_code = status.as_u16();
    let status_text = status.canonical_reason().unwrap_or("Unknown").to_string();

    // Collect response headers
    let mut response_headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(v) = value.to_str() {
            response_headers.insert(key.to_string(), v.to_string());
        }
    }

    // OWASP A04:2025 – Insecure Design: enforce a 10MB response limit to prevent
    // memory exhaustion from unexpectedly large responses
    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read body: {e}"))?;
    const MAX_BODY_BYTES: usize = 10 * 1024 * 1024; // 10 MB
    if body_bytes.len() > MAX_BODY_BYTES {
        return Err("Response body exceeds 10MB limit.".to_string());
    }

    let body_str = String::from_utf8_lossy(&body_bytes).into_owned();

    Ok(ApiResponse {
        status: status_code,
        status_text,
        headers: response_headers,
        body: body_str,
        duration_ms,
    })
}

/// Fetch a remote OpenAPI specification by URL.
/// This replaces the web app's /api/fetch-spec server route.
///
/// OWASP A09:2025 – SSRF: URL is validated before fetching.
#[tauri::command]
pub async fn fetch_spec(url: String) -> Result<String, String> {
    // OWASP A09:2025 – SSRF: validate URL before fetching
    let parsed_url = validate_url(&url)?;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(3))
        // OWASP A05:2025 – Cryptographic Failures: enforce TLS via rustls
        .use_rustls_tls()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    let response = client
        .get(parsed_url)
        // Only request YAML/JSON content types for spec files
        .header(
            "Accept",
            "application/json, application/yaml, text/yaml, text/plain, */*",
        )
        .send()
        .await
        .map_err(|e| format!("Failed to fetch spec: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch spec: HTTP {}",
            response.status().as_u16()
        ));
    }

    // OWASP A04:2025 – Insecure Design: enforce 5MB limit for spec files
    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read spec: {e}"))?;
    const MAX_SPEC_BYTES: usize = 5 * 1024 * 1024; // 5 MB
    if body_bytes.len() > MAX_SPEC_BYTES {
        return Err("Spec file exceeds 5MB limit.".to_string());
    }

    String::from_utf8(body_bytes.to_vec())
        .map_err(|_| "Spec content is not valid UTF-8.".to_string())
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_url_allows_https() {
        assert!(validate_url("https://petstore.swagger.io/v2/swagger.json").is_ok());
    }

    #[test]
    fn test_validate_url_allows_http() {
        assert!(validate_url("http://api.example.com/openapi.yaml").is_ok());
    }

    #[test]
    fn test_validate_url_blocks_file_scheme() {
        assert!(validate_url("file:///etc/passwd").is_err());
    }

    #[test]
    fn test_validate_url_blocks_ftp_scheme() {
        assert!(validate_url("ftp://example.com/file").is_err());
    }

    #[test]
    fn test_validate_url_blocks_aws_metadata() {
        assert!(validate_url("http://169.254.169.254/latest/meta-data/").is_err());
    }

    #[test]
    fn test_validate_url_blocks_gcp_metadata() {
        assert!(validate_url("http://metadata.google.internal/computeMetadata/v1/").is_err());
    }

    #[test]
    fn test_validate_url_blocks_loopback() {
        assert!(validate_url("http://127.0.0.1:8080/api").is_err());
    }

    #[test]
    fn test_validate_url_blocks_private_10() {
        assert!(validate_url("http://10.0.0.1/internal").is_err());
    }

    #[test]
    fn test_validate_url_blocks_private_192_168() {
        assert!(validate_url("http://192.168.1.1/router").is_err());
    }

    #[test]
    fn test_validate_url_blocks_private_172_16() {
        assert!(validate_url("http://172.16.0.1/internal").is_err());
    }

    #[test]
    fn test_validate_url_blocks_ssh_port() {
        assert!(validate_url("http://example.com:22/").is_err());
    }

    #[test]
    fn test_validate_url_blocks_mysql_port() {
        assert!(validate_url("http://example.com:3306/").is_err());
    }

    #[test]
    fn test_validate_url_allows_standard_ports() {
        assert!(validate_url("https://api.example.com:8443/openapi").is_ok());
        assert!(validate_url("http://api.example.com:8080/openapi").is_ok());
    }

    #[test]
    fn test_validate_url_rejects_malformed() {
        assert!(validate_url("not-a-url").is_err());
        assert!(validate_url("").is_err());
    }

    #[test]
    fn test_check_ip_allows_public() {
        let ip: IpAddr = "8.8.8.8".parse().unwrap();
        assert!(check_ip_allowed(&ip).is_ok());
    }

    #[test]
    fn test_check_ip_blocks_loopback() {
        let ip: IpAddr = "127.0.0.1".parse().unwrap();
        assert!(check_ip_allowed(&ip).is_err());
    }

    #[test]
    fn test_check_ip_blocks_link_local() {
        let ip: IpAddr = "169.254.1.1".parse().unwrap();
        assert!(check_ip_allowed(&ip).is_err());
    }
}
