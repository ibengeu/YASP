# YASP - Software Requirements Specification (MVP)

## 1. Functional Requirements

### 1.1 Specification Management
- **CRUD**: Create, Read, Update, Delete OpenAPI 3.0/3.1 specs.
- **Import**: File upload (.yaml, .json) and URL import.
- **Storage**: 100% client-side persistence using IndexedDB.

### 1.2 Governance & Linting
- **Spectral**: Real-time linting using default `spectral:oas` ruleset.
- **Feedback**: Inline error/warning highlighting in the Tiptap editor.

### 1.3 Try It Out (API Explorer)
- **Execution**: Support for standard HTTP methods (GET, POST, PUT, DELETE).
- **Security**: Proxy all requests to bypass CORS and prevent SSRF.
- **Auth**: Basic Header-based authentication (API Key, Bearer).

### 1.4 Visual Designer
- **Sync**: Instant bidirectional synchronization between Tiptap blocks and YAML source.
- **Basics**: Title, Description, and Path/Method editing via interactive blocks.

### 1.5 AI Catalyst
- **Generation**: Convert one-shot text prompts into valid OpenAPI 3.1.0 boilerplate.

## 2. Non-Functional Requirements

### 2.1 Performance
- **Latency**: < 100ms for UI-to-YAML synchronization.
- **Load Time**: < 3s for application readiness.

### 2.2 Security
- **Sanitization**: All user-provided strings sanitized before rendering to prevent XSS.
- **Privacy**: Local-first; no data sent to servers except for AI generation and proxy.

## 3. Technical Stack
- **Frontend**: React 19, TypeScript, Vite, React Router v7.
- **Styles**: Tailwind CSS v4.
- **Editor**: Tiptap (ProseMirror-based semantic editor).
- **Storage**: IndexedDB.
- **Docs Sync**: Real-time Notion sync with **optimized performance** using state machines and parallel processing.
