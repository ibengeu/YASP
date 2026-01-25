# SRS 00: Integration & Cross-Feature Dependencies

## 1. Overview
This document serves as the master integration guide for YASP, defining how all features interconnect, their dependencies, and the overall system cohesion.

**Purpose**: Ensure all SRS documents (01-05) work together as a unified system.

## 2. MVP vs v2 Scope Clarification

### 2.1 MVP (Minimum Viable Product) Scope

**Included in MVP**:
- ✅ Foundation & Core Infrastructure (SRS_01)
  - IndexedDB persistence
  - Zustand state management
  - Carbon Design System
  - React Router v7 with proxy route
  - Core services (storage, events, workers, http, security, di)
  - Plugin system architecture (framework only)

- ✅ Governance (SRS_02)
  - Spectral linting in Web Worker
  - Governance scoring algorithm
  - Diagnostics panel
  - Inline decorations

- ✅ Visual Designer (SRS_03)
  - Tiptap visual editor with semantic blocks
  - Monaco code editor for YAML/JSON
  - Bidirectional sync (visual ↔ code)
  - Cursor preservation

- ✅ AI Catalyst (SRS_04)
  - Groq (primary) + Gemini (secondary) integration
  - Prompt-to-Spec, Prompt-to-Schema, Refinement
  - Circuit breaker pattern
  - Quota management

- ✅ API Explorer (SRS_05)
  - Try It Out with server-side proxy
  - SSRF protection
  - Dynamic form generation
  - Response visualization
  - Monaco editor for request bodies

**Deferred to v2**:
- ❌ Multi-user authentication & authorization
- ❌ Real-time collaboration (Yjs CRDT)
- ❌ Server-side sync & conflict resolution
- ❌ Team workspaces with RBAC
- ❌ Advanced plugin marketplace
- ❌ Historical governance score tracking
- ❌ Request history export (HAR files)
- ❌ Mock server mode
- ❌ Collection runner (Postman import)

### 2.2 Architecture Clarification

**MVP Architecture**:
- **Pattern**: Plugin-based modular architecture with feature modules
- **State Management**: Zustand (not React Context)
- **Backend**: Minimal (only proxy route for Try It Out)
- **Storage**: Client-side IndexedDB only (no server database)
- **Sync**: None (local-only for MVP)

**Reference**: See `docs/MVP_ARCHITECTURE.md` for complete system design.

## 3. Feature Dependency Graph

```
SRS_01 (Foundation)
    ↓
    ├──→ SRS_02 (Governance)
    ├──→ SRS_03 (Visual Designer)
    ├──→ SRS_04 (AI Catalyst)
    └──→ SRS_05 (API Explorer)

SRS_03 (Visual Designer) ←──→ SRS_02 (Governance)
                               (bidirectional integration)

SRS_04 (AI Catalyst) ────→ SRS_02 (Governance)
                          (validation dependency)

SRS_05 (API Explorer) ────→ SRS_01 (Secrets storage)
                          (auth injection)
```

### 3.1 Dependency Details

**SRS_01 → All Others**:
- Provides core services (storage, events, workers, http, security)
- Provides design system (Carbon tokens)
- Provides state management (Zustand stores)

**SRS_03 → SRS_02**:
- Visual Designer subscribes to Governance diagnostics
- Renders inline decorations on Tiptap nodes
- Emits `spec:updated` event to trigger linting

**SRS_02 → SRS_03**:
- Governance emits `governance:lint-complete` event
- Diagnostics panel provides "Jump to Issue" → scrolls Visual Editor

**SRS_04 → SRS_02**:
- AI Catalyst uses Spectral worker for output validation
- Auto-repair loop re-prompts AI if validation fails

**SRS_05 → SRS_01**:
- API Explorer reads encrypted API keys from secrets store
- Uses SSRF validation from `core/security/validators.ts`

## 4. Cross-Feature Data Flows

### 4.1 Spec Editing Flow
```
User edits spec in Visual Designer (Tiptap)
    ↓
Visual Editor updates content in editorStore (Zustand)
    ↓
Editor emits event: spec:updated { specId, content }
    ↓
Governance listens to spec:updated
    ↓
Governance triggers Spectral worker (debounced 500ms)
    ↓
Worker returns diagnostics + score
    ↓
Governance stores results in governanceStore
    ↓
Visual Editor subscribes to governanceStore
    ↓
Visual Editor injects diagnostic props into Tiptap nodes
    ↓
User sees inline error/warning decorations
```

### 4.2 AI Generation Flow
```
User types prompt in AI Catalyst panel
    ↓
AI Catalyst calls Groq API (primary provider)
    ↓
If Groq fails 3x → Circuit breaker switches to Gemini
    ↓
AI streams response tokens (show in UI)
    ↓
AI output parsed as YAML
    ↓
AI Catalyst sends to Spectral worker (validation)
    ↓
If invalid → Auto-repair (re-prompt AI with errors)
    ↓
If still invalid → Show "Generated with Errors" modal
    ↓
User accepts → Insert into Visual Editor
    ↓
Visual Editor syncs to Code Editor (Monaco)
    ↓
Triggers spec:updated event → Governance re-lints
```

### 4.3 API Testing Flow
```
User opens endpoint in Visual Designer
    ↓
Clicks "Try It Out" → Opens API Explorer panel
    ↓
API Explorer auto-fills parameters from OpenAPI spec
    ↓
User enters test data in Monaco editor (request body)
    ↓
User selects auth credential from secrets store
    ↓
Click "Send Request"
    ↓
Client sends to /api/proxy route (server-side)
    ↓
Proxy validates URL (SSRF check: block private IPs)
    ↓
If valid public API → Proxy makes HTTP request
    ↓
Proxy returns response to client
    ↓
API Explorer displays formatted response
    ↓
User sees status badge, latency, JSON tree view
```

## 5. Event Contracts

### 5.1 Core Events (Event Dispatcher)

All events use `core/events/event-dispatcher.ts`:

| Event Name | Payload | Emitter | Subscribers |
|------------|---------|---------|-------------|
| `spec:created` | `{ specId, title, version }` | Library | Analytics |
| `spec:updated` | `{ specId, content }` | Editor | Governance |
| `spec:deleted` | `{ specId }` | Library | All features (cleanup) |
| `governance:lint-complete` | `{ specId, score, diagnostics }` | Governance | Editor, Library |
| `governance:lint-failed` | `{ specId, error }` | Governance | Editor (show error) |
| `editor:mode-switch` | `{ mode: 'visual' \| 'code' }` | Editor | Analytics |
| `diagnostic:jump` | `{ yamlPath, diagnostic }` | Governance Panel | Visual Editor |

### 5.2 Event Middleware

**Available Middleware**:
- **Logging**: All events logged to console (dev mode)
- **Persistence**: Critical events persisted to IndexedDB (audit trail)
- **Analytics**: Events tracked for usage metrics (future)

## 6. State Management Architecture

### 6.1 Global Stores (Zustand)

**Minimal Global State**:
- `auth.store.ts`: User session (placeholder for MVP, no-op)
- `config.store.ts`: Feature flags, app settings

**Feature-Scoped Stores**:
- `features/editor/store/editor.store.ts`: Editor content, mode, undo/redo
- `features/governance/store/governance.store.ts`: Diagnostics, score, linting state
- `features/ai-catalyst/store/ai.store.ts`: Provider state, quota, circuit breaker
- `features/library/store/library.store.ts`: Spec list, filters, sort

**No Context API** (except for React Router loaders):
- All state managed via Zustand for better performance and devtools

### 6.2 Store Subscriptions

**Cross-Store Dependencies**:
- Visual Editor subscribes to `governanceStore.diagnostics`
- Library subscribes to `governanceStore.score` (for spec cards)
- AI Catalyst subscribes to `editorStore.content` (current spec context)

## 7. Security Architecture

### 7.1 OWASP Top 10:2025 Coverage

| Risk | Mitigation | SRS Reference |
|------|------------|---------------|
| A01: Broken Access Control | N/A (single-user MVP) | SRS_01 § 7.3 |
| A02: Cryptographic Failures | Web Crypto API for secrets | SRS_01 § 6.1 |
| A03: Injection | Input validation, DOMPurify | SRS_01 § 6.2, SRS_04 § 2.4.2 |
| A04: Insecure Design | Threat modeling per feature | All SRS |
| A05: Misconfiguration | Secure defaults, CSP headers | SRS_01 § 7.3 |
| A06: Vulnerable Components | Dependency scanning (CI/CD) | SRS_01 § 7.3 |
| A09: SSRF | Comprehensive URL validation | SRS_05 § 4.1 |

### 7.2 Security Service Integration

**Core Security Services** (`core/security/`):
- `validators.ts`: URL validation (SSRF), input validation
- `sanitizer.ts`: DOMPurify for rendered content
- `permissions.ts`: RBAC checks (future)

**Used By**:
- SRS_05: SSRF protection in proxy route
- SRS_04: AI output sanitization
- SRS_03: Schema validation

## 8. Performance Constraints Summary

### 8.1 Load Time Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Initial Hydration | < 500ms | Lighthouse (4x CPU slowdown) |
| Bundle Size | < 300kb gzipped | Vite build analyzer |
| Spec Load (5MB) | < 500ms | Performance API |
| Linting (500 lines) | < 200ms | Worker benchmarks |
| Visual ↔ Code Sync | < 100ms | User perception threshold |
| AI First Token | < 2s | Groq benchmark |

### 8.2 Optimization Strategies

**Code Splitting**:
- Route-based: `/`, `/spec/:id`, `/settings`
- Plugin lazy loading: Load generators/linters on demand

**Worker Offloading**:
- Spectral linting in `core/workers/spectral.worker.ts`
- YAML parsing in worker for specs > 1MB

**Caching**:
- Memoize governance scores
- Cache Spectral results by content hash
- Debounce editor changes (300ms)

## 9. Testing Strategy

### 9.1 Unit Tests (Per Feature)

**SRS_01 (Foundation)**:
- IndexedDB CRUD operations
- Event dispatcher pub/sub
- Input sanitization functions

**SRS_02 (Governance)**:
- Scoring algorithm edge cases
- Worker communication contract
- Debounce/cancellation logic

**SRS_03 (Visual Designer)**:
- YAML ↔ Tiptap conversion (round-trip)
- Cursor preservation algorithm
- Undo/redo stack

**SRS_04 (AI Catalyst)**:
- Circuit breaker state transitions
- Quota calculation (token bucket)
- Output sanitization

**SRS_05 (API Explorer)**:
- SSRF validation (private IP detection)
- Header sanitization
- Auth injection

### 9.2 Integration Tests

**Cross-Feature Flows**:
- Editor change → Governance lint → Diagnostics display
- AI generation → Validation → Editor insertion
- Try It Out → Auth injection → Proxy request

### 9.3 E2E Tests (Playwright)

**Critical User Journeys**:
1. Import spec → Edit → Lint → Fix errors → Save
2. Blank spec → AI generate → Review → Insert → Lint
3. Open endpoint → Try It Out → Add auth → Send request → View response

## 10. Design System Consistency

### 10.1 Editor Component Matrix

| Context | Visual Editing | Code Editing | Simple Input |
|---------|---------------|--------------|--------------|
| **Spec Structure** | Tiptap blocks | Monaco YAML | - |
| **Request Body** | - | Monaco JSON | - |
| **Parameters** | - | - | Form inputs |
| **AI Prompts** | - | - | Textarea |

**Rule**: Use Tiptap for semantic/structured editing, Monaco for code, simple inputs for forms.

### 10.2 Carbon Token Usage

**Consistent Across All Features**:
- Colors: `bg-primary`, `text-foreground`, `border-border` (semantic tokens only)
- Spacing: 4px grid (`p-4`, `gap-2`, `mb-6`)
- Radius: `rounded-none` (default), `rounded-sm` (inputs only)
- Typography: `text-base` (16px), `text-sm` (14px), `font-mono` (code)

**Reference**: `docs/DESIGN_TOKENS.md`, `docs/CARBON_IMPLEMENTATION.md`

## 11. Deployment Architecture

### 11.1 MVP Deployment Model

**Option 1: Static SPA + Serverless Function**
- Frontend: Vite build → CDN (Cloudflare Pages, Vercel)
- Backend: `/api/proxy` route → Serverless function (Cloudflare Worker, Vercel Function)
- Database: None (client-side IndexedDB only)

**Option 2: Single Server Deployment**
- Frontend + Backend: React Router v7 app on Node.js server
- Database: None
- Hosting: Any Node.js host (Railway, Render, Fly.io)

**Recommended**: Option 1 for scalability and cost efficiency.

### 11.2 Environment Variables

**Required**:
- None (user provides API keys client-side)

**Optional**:
- `VITE_ENABLE_AI`: Feature flag for AI Catalyst (default: true)
- `VITE_ENABLE_GOVERNANCE`: Feature flag for Governance (default: true)
- `NODE_ENV`: `development` | `production`

## 12. Migration Path to v2

### 12.1 Authentication & Multi-User

**Changes Required**:
- Add backend database (PostgreSQL)
- Implement JWT-based auth
- Update all stores to include `userId` scoping
- Add RBAC to IndexedDB operations

**Affected SRS**: All (global change)

### 12.2 Real-Time Collaboration

**Changes Required**:
- Integrate Yjs CRDT for Tiptap
- Add WebSocket server (Hocuspocus)
- Implement presence awareness (cursors, selections)
- Add conflict-free merging

**Affected SRS**: SRS_03 (Visual Designer)

### 12.3 Server-Side Sync

**Changes Required**:
- Add sync service in backend
- Implement change log in IndexedDB
- Add conflict resolution UI
- Support offline-first with eventual consistency

**Affected SRS**: SRS_01 (Foundation)

## 13. Open Questions & Decisions Log

### 13.1 Resolved Decisions

| Question | Decision | Rationale | Date |
|----------|----------|-----------|------|
| State management: Context vs Zustand? | Zustand | Better perf, devtools, scoped stores | 2026-01-24 |
| AI Provider: Gemini vs Groq? | Groq primary, Gemini fallback | Higher quota, faster inference | 2026-01-24 |
| Editor: Tiptap vs Monaco for all? | Both (visual + code modes) | Different paradigms for different use cases | 2026-01-24 |
| SSRF: Allow localhost? | No | Security risk (metadata endpoints) | 2026-01-24 |
| Plugin system: MVP or v2? | MVP (framework only) | Extensibility needed, full marketplace v2 | 2026-01-24 |

### 13.2 Pending Decisions

| Question | Options | Impact | Owner |
|----------|---------|--------|-------|
| Monaco bundle size impact? | Evaluate, consider code-splitting | Bundle size (SRS_01 § 5.2) | TBD |
| Governance score history storage? | IndexedDB table or defer to v2? | Features scope | TBD |

## 14. Glossary

**Terms Used Across SRS Documents**:

- **YAML Path**: Array representing path in YAML AST (e.g., `['paths', '/users', 'get']`)
- **Diagnostic**: Spectral linting issue (error, warning, info)
- **Governance Score**: 0-100 metric of spec quality
- **Circuit Breaker**: Failure detection pattern for AI providers
- **SSRF**: Server-Side Request Forgery attack
- **Private IP**: RFC 1918 internal network addresses
- **Semantic Token**: Tailwind color class mapping to Carbon base token
- **Carbon Design System**: IBM's design language
- **Tiptap**: ProseMirror-based WYSIWYG editor
- **Monaco**: VS Code's code editor
- **Zustand**: Lightweight state management library
- **IndexedDB**: Browser storage API
- **Web Worker**: Background thread for heavy computation

## 15. References

### 15.1 Internal Documents
- `docs/MVP_ARCHITECTURE.md`: Complete system architecture
- `docs/DESIGN_TOKENS.md`: Carbon token reference
- `docs/CARBON_IMPLEMENTATION.md`: Design system guide
- `docs/srs/SRS_01_FOUNDATION.md`: Foundation requirements
- `docs/srs/SRS_02_GOVERNANCE.md`: Governance requirements
- `docs/srs/SRS_03_VISUAL_DESIGNER.md`: Visual Designer requirements
- `docs/srs/SRS_04_AI_CATALYST.md`: AI Catalyst requirements
- `docs/srs/SRS_05_API_EXPLORER.md`: API Explorer requirements

### 15.2 External References
- [OWASP Top 10:2025](https://owasp.org/www-project-top-ten/)
- [IBM Carbon Design System](https://carbondesignsystem.com)
- [OpenAPI 3.1.0 Specification](https://spec.openapis.org/oas/v3.1.0)
- [Spectral Documentation](https://stoplight.io/open-source/spectral)
- [Groq API Documentation](https://console.groq.com/docs)
- [Tiptap Documentation](https://tiptap.dev)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

## 16. Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-24 | Initial integration document | Claude |

---

**Status**: ✅ Complete - All SRS documents aligned and integrated
