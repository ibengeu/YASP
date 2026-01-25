# SRS 05: API Explorer (The Tester)

## 1. Overview
The API Explorer allows developers to "Try It Out" immediately. It renders an interactive test console for every endpoint, utilizing a server-side proxy to bypass browser CORS limitations.

**Feature Module**: Partially in `features/api-explorer/`, proxy in `app/routes/api/proxy.ts`

## 2. Functional Requirements

### 2.1 Fullstack Proxy Architecture

#### 2.1.1 Implementation
- **Route**: React Router v7 Resource Route (`app/routes/api/proxy.ts`)
- **Flow**: Client → POST `/api/proxy` → Server (Node.js) → Target API → Server → Client
- **Purpose**: Bypass browser CORS restrictions and inject authentication headers
- **Stateless**: Server does not persist request/response data

#### 2.1.2 SSRF Protection Rules
Based on [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) and [industry best practices](https://brightsec.com/blog/ssrf-server-side-request-forgery/):

**Goal**: Allow requests to **public external APIs** only. Block access to **internal/private networks** to prevent attackers from probing internal services.

**Strategy**: **Allowlist-first** approach (denylists are bypassable)

**Step 1: Protocol Validation**
- **Allowed**: `http://`, `https://` only
- **Blocked**: `file://`, `ftp://`, `gopher://`, `data://`, `jar://`, `tftp://`

**Step 2: DNS Resolution & IP Validation**
- Parse URL and extract hostname
- Resolve ALL IP addresses for hostname (A + AAAA records for IPv4 + IPv6)
- **Block private/internal IP ranges** (these are internal networks, NOT public internet):

**IPv4 Private Ranges (RFC 1918 + Special Use)**:
```
10.0.0.0/8          # Private Class A (internal networks)
172.16.0.0/12       # Private Class B (internal networks)
192.168.0.0/16      # Private Class C (home routers, internal)
127.0.0.0/8         # Loopback (localhost - server's own machine)
169.254.0.0/16      # Link-local (AWS/Azure metadata endpoints)
0.0.0.0/8           # Current network
100.64.0.0/10       # Shared address space (CGN)
224.0.0.0/4         # Multicast
240.0.0.0/4         # Reserved
255.255.255.255/32  # Broadcast
```

**IPv6 Private/Special Ranges**:
```
::1/128             # Loopback (localhost)
fe80::/10           # Link-local
fc00::/7            # Unique local addresses (ULA - private networks)
ff00::/8            # Multicast
fd00:ec2::254/128   # AWS metadata (IPv6)
::ffff:0:0/96       # IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1)
```

**What's Allowed**: All **public IP addresses** (e.g., `8.8.8.8`, `1.1.1.1`, any public API like `api.github.com` resolving to public IPs)

**Step 3: DNS Rebinding Prevention**
- Retrieve IP addresses BEFORE making request
- After response, re-resolve hostname
- If IPs changed during request → abort (DNS rebinding attack)

**Step 4: Hostname Validation**
- **Block hostname keywords**: `localhost`, `local`, `internal`, `intranet`, `metadata`
- **Case-insensitive** matching

**Step 5: Port Restrictions**
- **Allowed**: 80 (HTTP), 443 (HTTPS), 8080, 8443
- **Blocked**: All other ports (prevents scanning internal services on unusual ports)

#### 2.1.3 Header Forwarding Policy
**Security-first approach**:

**ALWAYS Strip (Never Forward)**:
- `Cookie` (prevent session hijacking)
- `Authorization` (unless explicitly set by user)
- `X-Forwarded-For`, `X-Real-IP` (prevent header injection)
- `Origin`, `Referer` (privacy)

**User-Controlled Headers**:
- User can add custom headers in Try It Out UI
- Validate header names (alphanumeric + `-` only)
- Sanitize header values (strip newlines, prevent CRLF injection)

**Auto-Injected Headers**:
- `User-Agent`: `YASP-API-Explorer/1.0`
- `Accept`: Based on expected response content type
- Custom headers from OpenAPI `security` schemes (API Key, Bearer)

#### 2.1.4 Request/Response Logging
**Purpose**: Audit trail and debugging (stored client-side only)

**What to Log**:
- Request: Method, URL (sanitized), headers (redacted sensitive), timestamp
- Response: Status code, latency (ms), size (bytes)
- **DO NOT LOG**: Request/response bodies (may contain PII)

**Storage**: IndexedDB `request_history` table (max 100 entries, FIFO)

### 2.2 Dynamic Form Generation

#### 2.2.1 Parameter Inputs
Automatically generate form fields based on OpenAPI parameter schemas:

**Type Mapping**:
- `string` → Text input
- `integer` / `number` → Number input
- `boolean` → Checkbox
- `string` with `enum` → Dropdown select
- `string` with `format: date` → Date picker
- `array` → Multi-value input (comma-separated or repeatable field)

**Validation**:
- **Required**: Red asterisk, block submit if empty
- **Pattern**: Regex validation (e.g., `pattern: ^[A-Z]{3}$`)
- **Min/Max**: Enforce `minimum`, `maximum`, `minLength`, `maxLength`

**Example UI**:
```
Query Parameters
┌─────────────────────────────────────┐
│ limit *         [50________] (max:100)│
│ offset          [0_________]          │
│ sort            [▼ created_at desc]   │ ← enum dropdown
└─────────────────────────────────────┘
```

#### 2.2.2 Request Body Editor
**Editor**: Monaco Editor (consistent with code editing in SRS_03)

**Features**:
- Syntax highlighting for JSON/XML based on `Content-Type`
- Auto-format button (Monaco's built-in formatter)
- Real-time schema validation with error squiggles
- **Pre-fill Example**: Button to populate with `example` data from schema
- Line numbers, bracket matching, find/replace

**Content-Type Support**:
- `application/json` → Monaco JSON mode
- `application/xml` → Monaco XML mode
- `multipart/form-data` → File upload + form fields (not Monaco)
- `application/x-www-form-urlencoded` → Key-value pair inputs (not Monaco)
- `text/plain` → Monaco plain text mode

#### 2.2.3 Auth Injection
**Source**: IndexedDB `secrets` store (encrypted API keys)

**Flow**:
1. Detect `security` schemes in OpenAPI spec (Bearer, API Key, OAuth2)
2. If scheme detected, show auth selector in Try It Out panel
3. User selects saved credential from dropdown (or enters new one)
4. Proxy injects credential into appropriate location:
   - **Bearer**: `Authorization: Bearer {token}` header
   - **API Key (header)**: Custom header (e.g., `X-API-Key: {key}`)
   - **API Key (query)**: Query parameter (e.g., `?api_key={key}`)
   - **OAuth2**: `Authorization: Bearer {access_token}` (user must provide token)

**Security**: Keys are decrypted client-side before sending to proxy.

### 2.3 Response Visualization

#### 2.3.1 Status Badge
**Design**: Color-coded badge with Carbon tokens

- **2xx (Success)**: `bg-success text-success-foreground` (green)
- **3xx (Redirect)**: `bg-info text-info-foreground` (blue)
- **4xx (Client Error)**: `bg-warning text-warning-foreground` (yellow)
- **5xx (Server Error)**: `bg-destructive text-destructive-foreground` (red)

**Display**: `200 OK`, `404 Not Found`, `500 Internal Server Error`

#### 2.3.2 Metadata Display
**Metrics**:
- **Latency**: Round-trip time in milliseconds (e.g., `342 ms`)
- **Size**: Response body size (e.g., `12.4 KB`, `1.2 MB`)
- **Date**: Timestamp (e.g., `2026-01-24 10:35:42 UTC`)

**Layout**: Horizontal row below status badge with subtle `text-muted-foreground` styling

#### 2.3.3 Body Viewer
**Format Detection**: Auto-detect based on `Content-Type` header

**Supported Formats**:
- **JSON**: Syntax-highlighted tree view (expandable/collapsible nodes) using lightweight library (e.g., `react-json-view`)
- **XML**: Syntax-highlighted with pretty-print
- **HTML**: Rendered in sandboxed iframe (CSP-protected)
- **Plain Text**: Monospace font display
- **Binary** (images, PDFs): Download button + preview if applicable

**Actions**:
- **Copy to Clipboard**: Copy response body as text
- **Download File**: Save as file (auto-name: `response-{timestamp}.json`)
- **View Raw**: Toggle between formatted and raw view

## 3. Technical Constraints

### 3.1 Streaming Response Support (Optional MVP)
**Nice to Have**: Stream large responses progressively

**Implementation**:
- Use `ReadableStream` API in fetch
- Display chunks as they arrive
- Show progress indicator

**Fallback**: Buffer entire response before display (MVP)

### 3.2 Timeout Handling
- **Default Timeout**: 30 seconds
- **User-Configurable**: Allow override in settings (max 120s)
- **Abort Signal**: User can cancel in-flight request

## 4. Security Implementation

### 4.1 SSRF Protection Validation Flow
```
User submits URL
    ↓
Parse URL (extract protocol, hostname, port)
    ↓
Protocol allowed? ───No→ [Reject: "Only HTTP/HTTPS allowed"]
    ↓ Yes
DNS Resolve hostname → IP addresses (A + AAAA)
    ↓
For each IP:
    ├─ Private/Internal IP? ───Yes→ [Reject: "Private IP blocked (use public APIs only)"]
    ├─ IPv4-mapped IPv6? ────Yes→ [Reject: "IPv4-mapped IPv6 blocked"]
    └─ Port allowed? ─────────No→ [Reject: "Port not allowed"]
    ↓ All checks pass (public IP on allowed port)
Make HTTP request to public API
    ↓
Re-resolve DNS (detect rebinding)
    ↓
IPs changed? ───Yes→ [Abort: "DNS rebinding detected"]
    ↓ No
Return response to client
```

**Implementation**: `core/security/validators.ts` provides `validateProxyUrl(url: string): Promise<ValidationResult>`

### 4.2 Why Block Private IPs?
**Attack Scenario Without Protection**:
1. Attacker uses YASP "Try It Out" with URL: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`
2. YASP proxy (running on cloud VM) makes request to **its own** cloud metadata endpoint
3. Attacker receives AWS credentials, keys, secrets → Full account compromise

**With Protection**:
- YASP detects `169.254.169.254` is in private range → Blocks request
- Same for `localhost`, `192.168.x.x`, `10.x.x.x` (internal company networks)

**Result**: Users can only test **public external APIs** (the intended use case), not probe internal infrastructure.

### 4.3 Input Sanitization
**All User Inputs** (URL, headers, body) sanitized via:
- **URL**: Parse with `new URL()`, reject malformed
- **Headers**: Strip newlines (`\r\n`), validate header names
- **Body**: JSON schema validation, max size 10MB

### 4.4 Error Messages
**User-Friendly** (don't leak internal info):
- ❌ `Request blocked: Target resolves to private network. Use public APIs only.`
- ❌ `Request failed: Invalid URL format`
- ✅ `Response received: 200 OK` (success)

**DO NOT expose**:
- Internal server IPs
- Stack traces
- Detailed DNS resolution info

## 5. Error Handling

### 5.1 Network Errors
- **Timeout**: "Request timed out after 30s. Try increasing timeout in settings."
- **DNS Failure**: "Could not resolve hostname. Check URL and try again."
- **Connection Refused**: "Target server refused connection. Server may be down."

### 5.2 SSRF Violations
- **Private IP**: "Request blocked: URL resolves to internal network. Only public endpoints allowed for security."
- **Localhost**: "Request blocked: localhost access not permitted (SSRF protection)."
- **DNS Rebinding**: "Request aborted: DNS resolution changed mid-request (potential attack)."

### 5.3 Server Errors
- **500**: "Target API returned error. Check response body for details."
- **Proxy Error**: "YASP proxy error. Please report this issue."

## 6. Testing Requirements

### 6.1 Security Tests
**SSRF Attack Simulations**:
- Test URL: `http://127.0.0.1:8080/admin` → Expect block
- Test URL: `http://169.254.169.254/latest/meta-data/` → Expect block (AWS metadata)
- Test URL: `http://[::1]/` → Expect block (IPv6 localhost)
- Test URL: `http://localhost/` → Expect block
- Test URL: `https://api.github.com/users` → Expect ALLOW (public API)
- Test DNS rebinding: Mock DNS returns public IP → private IP on re-resolution → Expect abort

### 6.2 Integration Tests
- Mock target API with various response types (JSON, XML, binary)
- Test auth injection (Bearer, API Key)
- Test header forwarding (verify Cookie stripped)

### 6.3 Performance Tests
- Benchmark latency overhead (proxy vs direct)
- Test timeout handling (abort after 30s)

## 7. Future Enhancements (v2)

### 7.1 Request History
- Persist request/response pairs in IndexedDB
- Searchable history with filters
- Export history as HAR file

### 7.2 Mock Server Mode
- Generate mock responses based on schema examples
- Useful for testing UI before backend ready

### 7.3 Collection Runner
- Import Postman/Insomnia collections
- Batch execute multiple requests
- Assertions and test scripts

## 8. References
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Top 10 2021: A10 SSRF](https://owasp.org/Top10/2021/A10_2021-Server-Side_Request_Forgery_(SSRF)/)
- [Bright Security: 7 SSRF Mitigation Techniques](https://brightsec.com/blog/7-ssrf-mitigation-techniques-you-must-know/)
- [Subnet Filtering for SSRF Protection](https://www.svix.com/blog/ssrf-protection/)
- [IPv6 SSRF Bypass Prevention](https://github.com/discourse/discourse/commit/fd16eade7fcc6bba4b71e71106a2eb13cdfdae4a)
