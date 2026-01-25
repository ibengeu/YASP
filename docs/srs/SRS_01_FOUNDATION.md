# SRS 01: Foundation & Core Infrastructure

## 1. Overview
This pillar establishes the "Local-First" architecture, the application shell, and the design system enforcement that serves as the bedrock for all other features.

**Architecture Reference**: See `docs/MVP_ARCHITECTURE.md` for complete system design.

## 2. Functional Requirements

### 2.1 Local-First Persistence (IndexedDB)
- **Database Name**: `yasp_db_v1`
- **Architecture**:
    - **Mode**: Single-User (MVP Scope).
    - **Atomic Transactions**: All writes must use strict transactionality to ensure data integrity.
    - **Schema**:
        - `specs`: { id (auto-increment), type: 'openapi', content (YAML string), title, version, description, metadata: { score, tags, workspaceType, syncStatus, isDiscoverable }, created_at, updated_at }
        - `settings`: { key (string), value (JSON) } - For theme preferences, editor config
        - `secrets`: { key_id (UUID), service_name, enc_value (encrypted with Web Crypto API), created_at } - For API Keys used in Try It Out
    - **Service Layer**: `core/storage/idb-storage.ts` - IndexedDB wrapper as defined in MVP_ARCHITECTURE.
    - **Indexes**: Create index on `specs.title` for search performance.

### 2.2 State Management
- **Approach**: Zustand for feature-scoped state management.
- **Store Architecture**:
    - Each feature module has its own Zustand store (e.g., `features/editor/store/editor.store.ts`)
    - Global stores limited to:
        - `auth.store.ts`: User session, login state
        - `config.store.ts`: Feature flags, app settings
- **Benefits**: Isolated state per feature, no prop drilling, easier testing.
- **Reference**: MVP_ARCHITECTURE.md § 7 "State Management Strategy"

### 2.3 Application Layout
- **Shell**: React Router v7 layout components.
- **Theme**: Light/Dark mode via `html.dark` class and Carbon tokens.
- **Routing**: React Router v7.
    - `/` → Library (Dashboard / Spec List)
    - `/spec/:id` → API Workspace (IDE with Editor + Governance)
    - `/settings` → Configuration Panel
    - `/api/proxy` → Server-side proxy route (Resource Route)

### 2.4 Authentication & Secrets (MVP)
- **User Model**: Single implicit user (No login required for MVP).
- **API Keys** (for Try It Out):
    - **Storage**: IndexedDB `secrets` store via `core/storage/` service.
    - **Encryption**: Web Crypto API with AES-GCM.
        - Key derivation: PBKDF2 from a user-provided passphrase (prompted on first API key save).
        - MVP: Optional passphrase (can skip encryption for dev).
    - **Scope**: Keys are local-only and never synced to any server.
    - **Security Service**: `core/security/` handles encryption/decryption.

### 2.5 Sync Strategy (MVP Scope)
- **MVP**: **No sync**. Application is fully local-only.
- **Future**: Server sync with conflict resolution (see MVP_ARCHITECTURE.md § 16 "Migration Path").
- **Offline-First Clarification**: "Local-First" means all data persists locally in IndexedDB. No cloud dependency for core features.

## 3. Design System Implementation (IBM Carbon v11)

### 3.1 Token System
- **Color Tokens**: Use Carbon Design System semantic tokens via CSS custom properties.
    - Format: `--color-{token}` (e.g., `--color-primary`, `--color-background`)
    - Tailwind Usage: `bg-primary`, `text-foreground`, `border-border`
    - **Mapping**: Tailwind semantic tokens map to Carbon base tokens:
        - `bg-primary` → `--interactive-01` (#0f62fe)
        - `bg-background` → `--ui-01` (#ffffff light, #161616 dark)
        - `text-foreground` → `--text-01` (#161616 light, #f4f4f4 dark)
    - **Reference**: `docs/DESIGN_TOKENS.md` for complete mapping.

### 3.2 Spacing & Typography
- **Spacing**: Strict 4px grid using Tailwind spacing scale (Carbon standard).
    - `p-4` = 16px, `gap-2` = 8px, `mb-6` = 24px
- **Typography**:
    - Sans-serif: System fonts (fallback to IBM Plex Sans if available)
    - Monospace: `font-mono` for code blocks
    - Font sizes: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), etc.

### 3.3 Border Radius Rules
- **Sharp (0px)**: Default for all containers, buttons, cards (`rounded-none`)
- **Subtle (4px)**: Only for inputs and badges (`rounded-sm`)
- **Standard (8px)**: Modals and dropdowns if needed (`rounded-md`)
- **Never use**: `rounded-lg` (12px) or `rounded-full` (not Carbon-compliant)

### 3.4 Component Library
- **Location**: `app/components/ui/` (shadcn/ui primitives adapted to Carbon)
- **Base**: Radix UI primitives styled with Carbon tokens.
- **Required Components**: Button, Input, Dialog, Dropdown, Card, Badge, Toast.

## 4. Backend Architecture (MVP)

### 4.1 Server Requirements
- **Minimal Backend**: Required ONLY for API Explorer proxy.
- **Implementation**: React Router v7 Resource Route (`app/routes/api/proxy.ts`).
- **Deployment**: Can be deployed as static SPA + single serverless function for proxy.
- **No Database**: Server is stateless; all data lives in client IndexedDB.

### 4.2 Proxy Route Specification
- **Endpoint**: `POST /api/proxy`
- **Purpose**: Forward HTTP requests to external APIs (bypass CORS).
- **Implementation**: Uses `core/http/api-client.ts` with SSRF protection via `core/security/validators.ts`.
- **Request Body**:
    ```typescript
    {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      headers?: Record<string, string>;
      body?: string;
    }
    ```
- **Response**: Proxied API response with CORS headers.
- **Security**: See SRS_05 for complete SSRF protection rules.

## 5. Technical Constraints

### 5.1 Architecture
- **Pattern**: Plugin-based, feature-first modular architecture.
- **Directory Structure**: As defined in MVP_ARCHITECTURE.md § 3.
    ```
    app/
    ├── features/             # Vertical slices (editor, governance, ai-catalyst, library)
    │   └── {feature}/
    │       ├── components/   # Feature-specific UI
    │       ├── hooks/        # Feature hooks
    │       ├── services/     # Business logic
    │       ├── store/        # Zustand store
    │       ├── types.ts      # Feature types
    │       └── index.ts      # Public API
    ├── plugins/              # Plugin system (linters, generators, exporters, transformers)
    ├── core/                 # Infrastructure (storage, events, workers, http, security, cache, errors, di, config)
    ├── components/           # Shared UI (ui/, layout/)
    ├── hooks/                # Shared hooks
    ├── lib/                  # Utilities
    ├── routes/               # React Router v7 routes
    └── types/                # Global types
    ```
- **Plugin System**: Core part of MVP architecture for extensibility.

### 5.2 Performance Targets
- **Hydration**: < 500ms on mid-range device (Desktop Chrome, simulated 4x CPU slowdown).
- **Bundle Size**: < 300kb gzipped for initial chunk.
- **Code Splitting**: Route-based splitting (editor, library, settings) + plugin lazy loading.
- **Measurement**: Use Lighthouse CI in GitHub Actions.

### 5.3 Browser Support
- **Target**: Last 2 versions of Chrome, Firefox, Safari, Edge.
- **Minimum**: ES2020, Web Crypto API, IndexedDB v2.

### 5.4 Tech Stack
- **Framework**: React 19 with TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Router**: React Router v7
- **Styling**: Tailwind CSS v4 + CSS Custom Properties (Carbon tokens)
- **State**: Zustand for feature stores
- **Storage**: IndexedDB via wrapper in `core/storage/`
- **Package Manager**: Bun

## 6. Core Services Layer

### 6.1 Storage Service (`core/storage/`)
- **Responsibility**: Persist and retrieve application data.
- **Implementation**: IndexedDB wrapper with schema migrations.
- **Operations**: CRUD for specs, batch operations, search/filtering, transactional operations.

### 6.2 Event System (`core/events/`)
- **Responsibility**: Decouple features via domain events.
- **Event Types**: Spec lifecycle, linting events, generation events, user actions, system events.
- **Example**: Editor emits `spec:updated` → Governance listens and triggers lint.

### 6.3 Worker Pool (`core/workers/`)
- **Responsibility**: Offload heavy computation to background threads.
- **Workers**: `spectral.worker.ts`, `parser.worker.ts`, `formatter.worker.ts`.
- **Use Cases**: Spectral linting, YAML/JSON parsing, spec formatting.

### 6.4 HTTP Client (`core/http/`)
- **Responsibility**: Handle external API communication.
- **Features**: Request/response interceptors, retry with exponential backoff, timeout handling, SSRF protection.

### 6.5 Security Service (`core/security/`)
- **Components**: Input validation (`validators.ts`), sanitization (`sanitizer.ts`), RBAC checks (`permissions.ts`).
- **Implementation**: DOMPurify for XSS prevention, SSRF URL validation.

### 6.6 Dependency Injection (`core/di/`)
- **Pattern**: Service container for loose coupling.
- **Registration**: Services registered in `container.ts` and resolved via service locator.

## 7. Security Implementation

### 7.1 Data Protection
- **Secrets Encryption**: Web Crypto API (AES-GCM-256) via `core/security/`.
- **Key Derivation**: PBKDF2 with 100,000 iterations (user passphrase).
- **Storage**: Encrypted values only in IndexedDB; keys never in localStorage.

### 7.2 Input Validation
- **All User Inputs**: Validated via `core/security/validators.ts` and sanitized via `core/security/sanitizer.ts`.
- **Max Sizes**:
    - Spec content: 10MB
    - Title: 255 chars
    - Description: 2000 chars
- **Allowed Protocols**: `http://`, `https://` only for URLs.

### 7.3 OWASP Mitigations (MVP Scope)
- **A01 (Access Control)**: N/A for single-user MVP. Client-side features don't assume auth.
- **A02 (Cryptographic Failures)**: Web Crypto API for secrets, TLS for transit.
- **A03 (Injection)**: Input validation on all inputs, sanitization with DOMPurify, parameterized queries via IndexedDB.
- **A04 (Insecure Design)**: Threat modeling for new features, security code review.
- **A05 (Misconfiguration)**: Secure defaults, no debug info in prod, security headers in index.html.
- **A06 (Vulnerable Components)**: Dependency scanning in CI/CD, regular npm audit.
- **A09 (SSRF)**: URL validation in Try It Out feature, whitelist of allowed domains.
- **Reference**: MVP_ARCHITECTURE.md § 11 "Security Architecture"

## 8. Testing Requirements

### 8.1 Unit Tests
- **Coverage Target**: > 80% for services layer.
- **Framework**: Vitest with React Testing Library.
- **Scope**:
    - **Feature Level**: Test hooks, stores, services in isolation (mock external services).
    - **Service Level**: Test core services (mock storage/http).
    - **Plugin Level**: Test each plugin (provide mock context).

### 8.2 Integration Tests
- **Feature Integration**: Test components with real stores/hooks (mock core services).
- **Service Integration**: Test services together (mock only external APIs).

### 8.3 E2E Tests
- **Framework**: Playwright (future).
- **User Workflows**: Import spec → Edit → Lint → Export.
- **Reference**: MVP_ARCHITECTURE.md § 13 "Testing Architecture"

## 9. Feature Flags & Configuration

### 9.1 Environment Config (`core/config/config.ts`)
- API endpoints and keys
- Feature enablement
- Storage configuration
- Logging levels

### 9.2 Feature Flags (`core/config/feature-flags.ts`)
- AI generation toggle
- Governance (linting) toggle
- Custom rules toggle
- Collaboration (future)

### 9.3 Plugin Configuration
- Enabled/disabled per environment
- Custom rules for linters
- API keys for generators
- Output options for exporters

## 10. Migration Path to v2

### 10.1 Multi-User Support
- Add authentication (OAuth2 or JWT-based).
- Implement workspace permissions and RBAC.

### 10.2 Sync Layer
- Introduce server-side persistence (PostgreSQL or MongoDB).
- Implement CRDTs or operational transforms for conflict resolution.

### 10.3 Collaboration Features
- Real-time editing with presence awareness.
- Comments and annotations on specs.

**Reference**: MVP_ARCHITECTURE.md § 16 "Migration Path from Current Architecture"
