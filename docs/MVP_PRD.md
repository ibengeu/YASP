# YASP - Product Requirements Document (MVP)

## 1. Product Vision: The Governance-Driven Design Platform
**Product Name:** YASP (Yet Another Swagger/OpenAPI Project)

YASP is not merely a documentation reader; it is a **Governance-Driven Design Platform**. In the modern API lifecycle, documentation is often an afterthought, leading to "Spec Drift" and poor developer experience. YASP flips this paradigm by making **Governance** the starting point of the design process. 

By integrating real-time linting into a semantic, block-based editor (Tiptap) and leveraging AI to jumpstart development, YASP empowers individual developers to create high-quality, spec-compliant OpenAPI 3.x definitions with zero friction and 100% offline-first privacy.

---

## 2. Core Strategic Pillars (MVP)

### 2.1 Governance-First (The Enforcer)
Governance is the central nervous system of YASP. 
- **Real-time Feedback**: As the user types in the Tiptap editor or modifies blocks, Spectral runs in the background. Errors and warnings are highlighted semantically within the editor, not just in a side panel.
- **Standardized Rulesets**: The MVP ships with the `spectral:oas` ruleset, enforcing industry best practices (e.g., operation IDs, response descriptions, security schemes).
- **Governance Score**: A unique "0-100" score is assigned to every specification, providing an immediate visual indicator of quality and compliance.

### 2.2 Visual Designer (The Builder)
The Visual Designer moves away from the intimidating "wall of YAML."
- **Tiptap Semantic Editing**: Using Tiptap, YASP treats OpenAPI elements (Paths, Operations, Parameters) as semantic blocks. This allows for a "WYSIWYG-like" experience for API design.
- **Bidirectional Sync**: The underlying YAML/JSON source is always available. Changes in the block-based UI reflect in the source code within <100ms, and vice versa.
- **Intuitive Navigation**: A powerful sidebar/directory allows users to jump between endpoints and models without scrolling through thousands of lines of code.

### 2.3 AI Catalyst (The Generator)
The AI Catalyst is designed to eliminate the "blank page" problem.
- **Prompt-to-Spec**: Users provide a natural language description (e.g., "Build a pet store API with endpoints for adding pets and searching by status").
- **OpenAI Integration**: YASP uses OpenAI's GPT-4o to generate a valid, high-fidelity OpenAPI 3.1.0 boilerplate.
- **Validation Loop**: The generated spec is immediate run through the Governance engine, ensuring the AI output meets quality standards before the user even starts editing.

---

## 3. Target User Persona: The Precision Architect
- **Profile**: A senior developer or architect who values speed but refuses to compromise on quality and standards.
- **Need**: A tool that respects their data privacy (offline-first), understands the nuances of OpenAPI 3.1, and helps them maintain a high "Governance Score" across 20+ microservice specs.

---

## 4. Key Features & Functional Requirements (MVP)

### 4.1 Library Management & Persistence
- **Offline-First Storage**: All data is stored in **IndexedDB**. There is no "YASP Server" that stores specs in the MVP.
- **Atomic CRUD**: Creating, updating, or deleting a spec is atomic; the UI and the database are always in sync.
- **Import/Export Engine**: Drag-and-drop file uploads or URL imports with live validation.

### 4.2 Interactive API Explorer (Try It Out)
- **CORS/SSRF Proxy**: To allow testing of restricted endpoints, YASP utilizes a server-side proxy. This proxy is built with security in mind: only allowed methods reach the destination, and no request data is logged.
- **Dynamic Input Forms**: Parameters (Path, Query, Header) are automatically extracted from the spec and presented as a clean UI form for testing.

### 4.3 Semantic Editor (Tiptap)
- **Custom Extensions**: Custom Tiptap extensions for OpenAPI-specific nodes (e.g., Paths, Methods, Schemas).
- **Hot-Reloading Linting**: Spectral linting triggers on every document change, providing instant feedback.

---

## 5. Technical Design & Constraints

### 5.1 Performance Targets
- **Init Time**: The application must be interactive in < 3 seconds on a standard 4G connection.
- **Sync Latency**: Sync between Tiptap and the YAML source must be < 100ms.
- **Memory Footprint**: Efficiently handle specs up to 5MB in size without browser lag.

### 5.2 Security Posture
- **Input Sanitization**: All content rendered via Tiptap is sanitized using `DOMPurify` to prevent XSS.
- **Proxy Isolation**: The Try It Out proxy must not have access to any internal networks.

---

## 6. User Workflows (MVP Scope) - **TESTED**

### 6.1 Workflow A: Import & Validate
1. User drags a `.yaml` or `.json` OpenAPI file into YASP (or pastes URL).
2. YASP validates the spec and computes a Governance Score.
3. Spec is stored in IndexedDB immediately.
4. User can now browse, edit, or test the API.

### 6.2 Workflow B: Generate via AI
1. User clicks "Generate Spec" and enters a natural language prompt.
2. OpenAI generates a valid OpenAPI 3.1.0 boilerplate.
3. Spec is validated and assigned a Governance Score before being shown.
4. User can refine the generated spec in the visual editor.

### 6.3 Workflow C: Design & Test
1. User opens a spec in the visual editor or raw YAML view.
2. Real-time Spectral linting highlights issues inline.
3. User updates paths, methods, or parameters via block-based UI or YAML.
4. Changes sync bidirectionally (<100ms latency).
5. User tests API endpoints using "Try It Out" with auto-populated forms.

---

## 7. Out of Scope (Post-MVP)
- Cloud sync or multi-device persistence
- Team collaboration or permissions
- Custom Spectral rulesets
- Backend server for spec storage
- Advanced code generation (from spec to SDK)
- API mocking / stubbing

---

## 8. Success Metrics (MVP)

### Quantitative
1. **Import Success Rate**: % of uploaded specs that parse without critical errors
2. **Governance Score**: Average quality score across all stored specs (target: >70)
3. **AI Generation Quality**: % of AI-generated specs that pass Governance validation on first run (target: >80%)
4. **Performance**:
   - App readiness: <3s on 4G
   - YAML↔Block sync: <100ms latency

### Qualitative
1. **User Satisfaction**: Can users design an API spec in <10 minutes (import or generate)?
2. **Developer Experience**: Linting feedback feels responsive and actionable (not noisy)

---

## 9. Risk & Mitigation

### 9.1 Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| AI-generated specs are often invalid | High | Run validation loop before showing spec to user |
| Spectral linting output is overwhelming | Medium | Filter to high-priority issues; provide "quick fix" suggestions |
| IndexedDB storage limits (50MB typical) | Medium | Warn user; support export for large specs |
| CORS proxy becomes attack vector | High | Whitelist domains; disable proxy by default; log all requests |
| User data privacy concerns (AI requests) | High | Document that prompts are sent to OpenAI; offer offline fallback |

### 9.2 Mitigations in Place
- All AI requests logged to console (transparency)
- Proxy only accepts HTTPS destinations
- Input sanitization prevents XSS
- Security headers enforced in index.html

---

## 10. Acceptance Criteria (MVP Definition of Done)

A spec is considered "MVP-ready" when:

1. **Core Features**: Import, generate (AI), edit, validate (Spectral), test (Try It Out) all work end-to-end
2. **Data Persistence**: Specs survive browser refresh and tab closure
3. **Governance**: Spectral linting runs in real-time and highlights at least 5 error categories
4. **Performance**: Cold start <3s; sync <100ms; no memory leaks over 1-hour session
5. **Security**: All user inputs sanitized; no XSS/injection vulnerabilities; proxy whitelisting enforced
6. **Documentation**: Inline help for each feature; clear error messages (no stack traces to user)
7. **Testing**: >80% code coverage for core logic; E2E tests for critical workflows

---

## 11. Future Vision (Post-MVP Roadmap)

### Phase 2: Governance+ (The Enforcer Evolves)
- Custom Spectral rulesets per team
- Governance dashboard with trend analytics
- Integration with CI/CD pipelines

### Phase 3: Collaboration (The Social Layer)
- Cloud sync (optional; user-controlled)
- Team workspaces
- Spec versioning and change history

### Phase 4: Code Generation (The Developer Experience)
- Generate TypeScript/Python SDKs from specs
- Server stub generation
- Mock API servers
