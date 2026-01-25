# YASP - Modular Architecture & System Design

## 1. Design Philosophy

YASP follows a **plugin-based, feature-first modular architecture** that prioritizes extensibility, testability, and clear separation of concerns. This design enables adding new features without modifying core code.

### Core Principles

- **Feature-First (Vertical Slices)**: Code organized by domain feature, not technical role
- **Plugin System**: Features as self-contained modules with standard interfaces
- **Dependency Injection**: Loosely coupled services via inversion of control
- **Feature Isolation**: Each feature owns its UI, logic, state, and domain
- **Clear Contracts**: TypeScript interfaces define all service boundaries
- **Testability**: All components independently testable with mocked services
- **Offline-First**: Client-side as primary store, optional sync layers
- **Asset Reuse**: Leverage existing shadcn/ui primitives and shared utilities

---

## 2. Architectural Layers

The application follows a clean architecture with distinct responsibility layers:

### Layer 1: Routes & Pages (React Router v7)
Entry points to the application, responsible for:
- URL routing and navigation
- Page layout composition
- Passing route params to features
- Page-level error boundaries

**Routes:**
- `/` → Library (Dashboard)
- `/spec/:id` → API Workspace (IDE)
- `/settings` → Configuration
- `/auth/*` → Authentication flows

### Layer 2: Feature Modules (Vertical Slices)
Self-contained business domains, each containing:
- **Components**: Feature-specific UI components
- **Hooks**: Feature-scoped custom React hooks
- **Store**: Local state management (Zustand)
- **Services**: Business logic and data operations
- **Types**: Feature domain types
- **Index**: Public API exports

**Core Features:**
- **Editor**: Hybrid visual/code editing with Tiptap (visual) + Monaco (code)
- **Governance**: Spectral linting with research-backed scoring algorithm
- **AI Catalyst**: Groq (primary) + Gemini (secondary) with circuit breaker
- **Library**: Spec CRUD and management with workspace types
- **Settings**: Configuration and preferences
- **Auth**: User authentication and sessions

### Layer 3: Plugin System & Extension Points
Extensible framework for adding capabilities:
- **Linter Plugins**: Custom validation rules (Spectral, validators, etc.)
- **Generator Plugins**: Spec generation strategies (Groq, Gemini, templates, examples)
- **Exporter Plugins**: Format output (JSON, YAML, Postman, HTML, etc.)
- **Transformer Plugins**: Spec conversion (Swagger→OpenAPI, normalization, etc.)

Each plugin implements a standard interface and has access to core services via plugin context.

### Layer 4: Core Services & Infrastructure
Singleton services providing shared capabilities:

**Data Persistence**
- IndexedDB storage wrapper
- Schema migrations
- Transactions and atomicity
- Search and filtering

**Event System**
- Domain event dispatcher
- Event subscribers and handlers
- Event middleware (logging, persistence)
- Audit trail support

**Worker Pool**
- Web Worker management
- Heavy computation offloading (linting, parsing, formatting)
- Task queuing and prioritization

**HTTP & External Services**
- API client with interceptors
- Request/response middleware
- Error handling and retries
- Authentication header management

**Security**
- Input sanitization and validation
- Permission checks and RBAC
- SSRF protection for API calls
- Secure credential storage

**Caching & Performance**
- Memoization cache for expensive operations
- Cache invalidation strategies
- Debouncing and throttling

**Error Handling**
- Custom error types and hierarchy
- Global error handler
- React error boundaries
- User-friendly error messages

**Configuration & Feature Flags**
- Environment-based configuration
- Feature toggles for gradual rollout
- Plugin loading and enablement

**Dependency Injection**
- Service container for loose coupling
- Service registration and resolution
- Singleton management

---

## 3. Directory Structure (Target)

```
app/
├── features/                          # Vertical slices (domains)
│   ├── editor/
│   │   ├── components/                # EditorPanel, Toolbar, etc.
│   │   ├── hooks/                     # useEditor, useEditorSync
│   │   ├── services/                  # editor.service, formatter.service
│   │   ├── store/                     # editor.store (Zustand)
│   │   ├── types.ts                   # EditorState, EditorContent
│   │   └── index.ts                   # Public API
│   │
│   ├── governance/
│   │   ├── components/                # ScoreBoard, DiagnosticsPanel
│   │   ├── hooks/                     # useSpectral, useGovernanceScore
│   │   ├── services/                  # spectral.service, scoring.service
│   │   ├── rulesets/                  # oas3.ruleset.json, custom.ruleset.json
│   │   ├── store/                     # governance.store
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── ai-catalyst/
│   │   ├── components/                # GeneratePanel, PromptBuilder
│   │   ├── hooks/                     # useAiGeneration
│   │   ├── services/                  # groq.service, gemini.service, circuit-breaker.service
│   │   ├── store/                     # ai.store (provider state, quota, circuit breaker)
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── library/
│   │   ├── components/                # SpecCard, SpecList, ImportDialog
│   │   ├── hooks/                     # useSpecLibrary, useSpecFilter
│   │   ├── services/                  # spec-library.service
│   │   ├── store/                     # library.store
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── settings/
│   │   ├── components/                # SettingsPanel, ApiKeyForm
│   │   ├── hooks/                     # useSettings
│   │   ├── store/                     # settings.store
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── auth/
│       ├── components/
│       ├── hooks/                     # useAuth
│       ├── store/                     # auth.store
│       ├── types.ts
│       └── index.ts
│
├── plugins/                           # Plugin system
│   ├── core/
│   │   ├── plugin-registry.ts         # Plugin discovery & loading
│   │   ├── plugin-types.ts            # Plugin interfaces
│   │   ├── plugin-context.ts          # Plugin API
│   │   └── plugin-loader.ts           # Dynamic loading
│   │
│   ├── linters/                       # Linter plugins
│   │   ├── spectral-linter.plugin.ts
│   │   ├── custom-rules.plugin.ts
│   │   └── oas-validator.plugin.ts
│   │
│   ├── generators/                    # Generator plugins
│   │   ├── openai-generator.plugin.ts
│   │   ├── template-generator.plugin.ts
│   │   └── example-generator.plugin.ts
│   │
│   ├── exporters/                     # Exporter plugins
│   │   ├── json-exporter.plugin.ts
│   │   ├── yaml-exporter.plugin.ts
│   │   ├── postman-exporter.plugin.ts
│   │   └── html-exporter.plugin.ts
│   │
│   └── transformers/                  # Transformer plugins
│       ├── swagger-to-openapi.plugin.ts
│       └── spec-normalizer.plugin.ts
│
├── core/                              # Infrastructure & shared services
│   ├── storage/
│   │   ├── idb-storage.ts             # IndexedDB wrapper
│   │   ├── storage.types.ts           # Storage interfaces
│   │   ├── storage-schema.ts          # Schema definitions
│   │   └── migrations/                # Schema versioning
│   │
│   ├── events/
│   │   ├── event-dispatcher.ts        # Event bus
│   │   ├── event-types.ts             # Domain events enum
│   │   └── middleware/                # Event middleware
│   │
│   ├── workers/
│   │   ├── worker-pool.ts             # Worker management
│   │   ├── spectral.worker.ts
│   │   ├── parser.worker.ts
│   │   └── formatter.worker.ts
│   │
│   ├── http/
│   │   ├── api-client.ts              # HTTP client
│   │   ├── request-interceptors.ts
│   │   └── response-interceptors.ts
│   │
│   ├── security/
│   │   ├── sanitizer.ts               # Input sanitization
│   │   ├── validators.ts              # Input validation
│   │   └── permissions.ts             # RBAC checks
│   │
│   ├── cache/
│   │   ├── cache-manager.ts
│   │   └── invalidation.ts
│   │
│   ├── errors/
│   │   ├── error-types.ts             # Custom error classes
│   │   ├── error-boundary.tsx         # React boundary
│   │   └── error-handler.ts           # Global handler
│   │
│   ├── di/
│   │   ├── container.ts               # DI container
│   │   ├── service-locator.ts
│   │   └── decorators.ts
│   │
│   └── config/
│       ├── config.ts                  # App configuration
│       └── feature-flags.ts           # Feature toggles
│
├── components/                        # Shared UI components
│   ├── ui/                            # Radix/shadcn primitives
│   └── layout/                        # Layout components
│
├── hooks/                             # Shared custom hooks
│   ├── useAsync.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
│
├── lib/                               # Utility functions
│   ├── utils.ts
│   ├── spec-utils.ts
│   └── validation.ts
│
├── routes/                            # Page routes
│   ├── _index.tsx
│   ├── editor.$id.tsx
│   ├── settings.tsx
│   └── _layout.tsx
│
└── types/                             # Global types
    ├── openapi-spec.ts
    └── global.ts
```

---

## 4. Feature Module Architecture

### Module Structure

Each feature module is self-contained and exports a clean public API via `index.ts`:

**Components**: UI elements specific to the feature
- Presentation and interaction logic
- Use feature hooks and stores
- Consume only from feature services
- No cross-feature imports

**Hooks**: Custom React hooks for the feature
- Feature state management
- Side effect orchestration
- Encapsulate complex logic
- Re-usable across components

**Services**: Business logic layer
- Domain operations
- External service integration
- Data transformation
- Feature-specific algorithms

**Store**: Local state management (Zustand)
- Feature state shape
- State mutations and actions
- Derived state selectors
- Persistence hooks (optional)

**Types**: Domain types and interfaces
- Feature-specific data models
- API contracts
- State shape definitions

**Index**: Public API
- Exports only what other features need
- Acts as facade to hide internals
- Enables easier refactoring

### Data Flow Within Feature

```
Component
  ↓
Hook (useFeature)
  ↓
Store (Zustand)
  ↓
Service (business logic)
  ↓
Core Services (storage, http, events)
  ↓
External System
```

### Key Feature Implementations

**Editor Feature (SRS_03)**:
- **Visual Mode**: Tiptap v2 for semantic block editing with custom OpenAPI nodes
- **Code Mode**: Monaco Editor for raw YAML/JSON editing with syntax highlighting
- **Bidirectional Sync**: YAML AST-based synchronization preserving cursor position
- **Mode Toggle**: Users switch between Visual and Code modes seamlessly
- **Why Both**: Tiptap for structured/semantic editing, Monaco for raw code editing

**Governance Feature (SRS_02)**:
- **Linting Engine**: Spectral in Web Worker (debounced 500ms)
- **Scoring Algorithm**: Research-backed normalized severity weighting (0-100 scale)
  - Formula: `score = 100 × (1 - (totalPenalty / (totalPenalty + baselinePenalty)))`
  - Weights: Error (25), Warning (5), Info (1)
- **Integration**: Subscribes to `spec:updated` events, provides diagnostics to editor

**AI Catalyst Feature (SRS_04)**:
- **Primary Provider**: Groq API (Llama 3.3 70B) - 14,400 req/day, 276 tokens/sec
- **Secondary Provider**: Google Gemini 2.5 Flash - fallback when Groq fails
- **Circuit Breaker**: Automatic provider switching on 3 consecutive failures
- **Validation Loop**: Auto-repair with Spectral validation before spec insertion

**API Explorer Feature (SRS_05)**:
- **Request Editor**: Monaco Editor for JSON/XML request bodies
- **SSRF Protection**: Comprehensive IPv4/IPv6 private range blocking
- **Server Proxy**: React Router v7 Resource Route (`/api/proxy`) for CORS bypass
- **Security**: DNS rebinding prevention, metadata endpoint protection

---

## 5. Plugin System Architecture

### Plugin Types

**Linter Plugins**: Validate and lint OpenAPI specifications
- Implement linting logic
- Return diagnostics (errors, warnings, info)
- Can be chained together
- Examples: Spectral, custom rules, schema validation

**Generator Plugins**: Create or augment OpenAPI specifications
- Accept prompts or templates
- Return complete or partial specs
- Used in AI Catalyst feature
- Examples: Groq, Gemini, template-based, example generators

**Exporter Plugins**: Export specs in different formats
- Input: OpenAPI spec + export options
- Output: Blob or file
- Support various formats
- Examples: JSON, YAML, Postman, HTML, OpenAPI UI

**Transformer Plugins**: Convert between formats or normalize specs
- Input/output: OpenAPI specs
- Modify spec structure or content
- Used for data transformation
- Examples: Swagger→OpenAPI, normalization, validation

### Plugin Lifecycle

1. **Discovery**: Plugin files loaded from `plugins/` directory
2. **Registration**: Plugin registered with PluginRegistry
3. **Loading**: Plugin.onLoad() called with PluginContext
4. **Operation**: Feature invokes plugin via registry
5. **Unloading**: Plugin.onUnload() on shutdown or disable

### Plugin API (Context)

Plugins receive a `PluginContext` object providing access to:
- **Storage Service**: Persist and query data
- **Event Dispatcher**: Emit and subscribe to domain events
- **HTTP Client**: Make external API calls
- **Config**: Access to app configuration
- **Logger**: Structured logging
- **Cache Manager**: Caching and memoization

---

## 6. Core Services Layer

### Storage Service

**Responsibility**: Persist and retrieve application data

**Operations**:
- CRUD for specs and related entities
- Batch operations for performance
- Search and filtering
- Transactional operations for consistency
- Automatic timestamping and versioning

**Implementation**: IndexedDB with schema migrations
- Typed schema definitions per version
- Migration functions for version updates
- Atomic transactions

### Event System

**Responsibility**: Decouple features via domain events

**Event Types**:
- Spec lifecycle events (created, updated, deleted)
- Linting events (completed, failed)
- Generation events (started, completed)
- User action events
- System events (offline, online, sync complete)

**Characteristics**:
- Events are immutable records
- Include timestamp and source
- Can have metadata and audit trail
- Support middleware for cross-cutting concerns

### Worker Pool

**Responsibility**: Offload heavy computation to background threads

**Features**:
- Manages pool of Web Workers
- Queue tasks when all workers busy
- Priority-based scheduling
- Timeout handling
- Error propagation

**Use Cases**:
- Spectral linting (intensive)
- YAML/JSON parsing (large files)
- Spec formatting and normalization
- Complex transformations

### HTTP Client

**Responsibility**: Handle external API communication

**Features**:
- Request/response interceptors
- Automatic retry with exponential backoff
- Timeout handling
- Error normalization
- SSRF protection for API calls

**Services Used**:
- Groq API (primary) and Gemini API (secondary) for spec generation
- Custom proxy for "Try It Out" feature with SSRF protection

### Security Service

**Responsibility**: Protect against common vulnerabilities

**Components**:
- Input validation and sanitization
- XSS prevention (DOMPurify)
- SQL injection prevention
- SSRF protection (URL whitelisting)
- OWASP compliance checks

### Caching Layer

**Responsibility**: Improve performance via caching

**Strategies**:
- Memoization for expensive computations
- Debouncing editor changes before linting
- Query result caching
- Cache invalidation on data changes

---

## 7. State Management Strategy

### Feature-Scoped State (Zustand)

Each feature has its own Zustand store for local state:
- Feature state shape defined in feature types
- Actions for state mutations
- Selectors for derived state
- Middleware for persistence (optional)

**Benefits**:
- Isolated state per feature
- No prop drilling
- Easier testing (can reset per test)
- Performance optimization (re-render only affected feature)

### Global State (Minimal)

Only truly global state in root stores:
- **Auth Store**: User session, login state
- **Config Store**: Feature flags, app settings

**Rationale**:
- Keep global state minimal
- Auth and config needed everywhere
- Other state is feature-scoped

---

## 8. Data Flow Architecture

### Component to Service Flow

```
User Interaction
  ↓
Component Event Handler
  ↓
Feature Hook (orchestration)
  ↓
Store Action (state update)
  ↓
Service Call (business logic)
  ↓
Core Service (storage/http/events)
  ↓
External System (DB/API)
  ↓
Event Emission (notify other features)
  ↓
Component Re-render (via store subscription)
```

### Cross-Feature Communication

Features communicate via:
- **Domain Events**: Loosely coupled, async
- **Shared Store**: For tightly coupled features
- **Service Locator**: For one-off service access

**Example**: Editor changes trigger Governance linting
1. Editor updates content in store
2. Editor emits `spec:updated` event
3. Governance listens to event, triggers lint
4. Governance stores results in its store
5. DiagnosticsPanel subscribes to governance store

---

## 9. Extension Points

### Adding a New Plugin

Steps to add plugin for new capability:
1. Create plugin file in `plugins/{type}/`
2. Implement plugin interface
3. Register with PluginRegistry
4. Feature discovers and uses plugin

Example: Adding HTML exporter plugin
- Create `plugins/exporters/html-exporter.plugin.ts`
- Implement `ExporterPlugin` interface
- Call `pluginRegistry.register(htmlExporterPlugin)` on app init
- Library feature uses registry to list exporters

### Adding a New Feature Module

Steps to add new feature:
1. Create `features/{name}/` directory
2. Implement components, hooks, services, store
3. Define types and public API in `index.ts`
4. Export from feature index
5. Wire into root routes if needed

Example: Adding collaboration feature
- Create `features/collaboration/`
- Implement components (presence, cursors, comments)
- Services (sync, conflict resolution)
- Store (collaboration state)
- Public API exports

### Adding Core Service

Steps to add new infrastructure service:
1. Define service interface in `core/{service}/`
2. Implement service
3. Register in DI container
4. Inject into features that need it

Example: Adding analytics service
- Define `AnalyticsService` interface
- Implement tracking methods
- Register in container
- Inject into features

---

## 10. Data Schemas & Contracts

### Spec Entity (IndexedDB)

Persisted structure for OpenAPI specification:
- **ID**: Unique identifier (UUID)
- **Title & Version**: Metadata
- **Content**: Full spec as YAML/JSON string
- **Metadata**: Tags, workspace type, sync status
- **Score**: Governance score (0-100)
- **Timestamps**: Created, modified, accessed

### Governance Diagnostics

Result of linting operation:
- **Diagnostic**: Issue identified in spec
  - Type: error, warning, info
  - Message: Human-readable description
  - Range: Line/character position in spec
  - Rule: Which rule triggered it
- **Score**: Aggregated quality metric (0-100)

### Plugin Manifest

Metadata for plugin discovery:
- **ID**: Unique identifier
- **Name & Version**: Display name and version
- **Type**: Linter, generator, exporter, transformer
- **Capabilities**: What it can do
- **Dependencies**: Other plugins or services required
- **Config Schema**: Configurable options

---

## 11. Security Architecture

### OWASP Top 10 Mitigations

**A01 - Broken Access Control**
- Client-side features don't assume auth (server validates)
- Permission checks before data operations

**A02 - Cryptographic Failures**
- Sensitive data (API keys) via settings, not localStorage
- TLS in transit (HTTPS only)
- Hashing for passwords (if auth implemented)

**A03 - Injection**
- Input validation on all user inputs
- Sanitization with DOMPurify for rendered HTML
- Parameterized queries (via IndexedDB ORM)

**A04 - Insecure Design**
- Threat modeling for new features
- Security code review before implementation
- Fail-secure defaults

**A05 - Security Misconfiguration**
- Secure defaults in config
- No debug info in production
- Security headers in index.html

**A06 - Vulnerable Components**
- Dependency scanning in CI/CD
- Regular npm audit and updates
- SBOM maintained

**A07 - Identification & Auth Failures**
- (Future) MFA for team collaboration
- Session tokens with rotation
- Account lockout on failed attempts

**A09 - SSRF (Server-Side Request Forgery)**
- Comprehensive URL validation in "Try It Out" feature
- Block private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16)
- Block private IPv6 ranges (::1/128, fe80::/10, fc00::/7, ::ffff:0:0/96)
- DNS rebinding prevention
- Prevent access to internal networks and cloud metadata endpoints
- Refer to SRS_05 § 4 for complete SSRF protection specifications

---

## 12. Performance Considerations

### Code Splitting

- Route-based splitting (editor, library, settings)
- Plugin lazy loading (only load enabled plugins)
- Feature modules tree-shakeable

### Rendering Optimization

- Editor uses virtual scrolling for large specs
- DiagnosticsPanel paginated for many errors
- Debounced linting on editor changes (500ms)

### Caching Strategy

- Memoize expensive computations
- Cache linting results per spec content hash
- Cache AI provider responses (Groq/Gemini)
- Invalidate on spec update

### Worker Offloading

- Spectral linting in worker (no UI blocking)
- YAML parsing in worker for large files
- Spec formatting in worker

---

## 13. Testing Architecture

### Unit Tests

**Feature Level**: Test hooks, stores, services in isolation
- Mock external services
- Test state transitions
- Test business logic

**Service Level**: Test core services
- Mock storage/http for integration tests
- Test error handling
- Test middleware

**Plugin Level**: Test each plugin
- Provide mock context
- Verify plugin contract

### Integration Tests

**Feature Integration**: Test components with real stores/hooks
- Use test utilities (render, userEvent)
- Mock core services
- Test user interactions

**Service Integration**: Test services together
- Mock only external APIs
- Test event flow
- Test storage operations

### E2E Tests

**User Workflows**: Full app flow
- Import spec → Edit → Lint → Export
- Create → Modify → Save
- Feature interactions

---

## 14. Configuration & Feature Flags

### Environment Config

- API endpoints and keys
- Feature enablement
- Storage configuration
- Logging levels

### Feature Flags

Enable/disable features per environment:
- AI generation toggle
- Governance (linting) toggle
- Custom rules toggle
- Collaboration (future)

### Plugin Configuration

Plugins can be configured:
- Enabled/disabled per environment
- Custom rules for linters
- API keys for generators
- Output options for exporters

---

## 15. Key Benefits of This Architecture

| Benefit | How Achieved |
|---------|-------------|
| **Extensibility** | Plugin system for new capabilities without core changes |
| **Modularity** | Feature-first vertical slices with clear boundaries |
| **Testability** | Interfaces for all services, mockable dependencies |
| **Maintainability** | Single responsibility, clear separation of concerns |
| **Scalability** | Feature modules can grow independently, lazy loading |
| **Type Safety** | TypeScript interfaces for all contracts |
| **Performance** | Worker offloading, caching, code splitting |
| **Reusability** | Core services shared across features |
| **Loose Coupling** | Features communicate via events, not direct calls |

---

## 16. Migration Path from Current Architecture

### Phase 1: Foundation (Weeks 1-2)
- Create feature directory structure
- Extract core services from scattered locations
- Establish plugin registry and interfaces

### Phase 2: Feature Modules (Weeks 3-4)
- Migrate editor logic to `features/editor`
- Migrate governance to `features/governance`
- Migrate library management to `features/library`

### Phase 3: State Management (Weeks 5-6)
- Implement Zustand stores per feature
- Connect components to feature stores
- Remove Context usage (except auth)

### Phase 4: Plugin System (Weeks 7-8)
- Convert existing linters to plugins
- Implement plugin registry loader
- Add UI for plugin management

### Phase 5: Polish & Testing (Weeks 9+)
- Add comprehensive test suite
- Performance optimization
- Documentation and examples

---

## 17. Summary

This modular architecture provides a scalable, extensible foundation for YASP that:

✅ Isolates features into independent vertical slices
✅ Provides clear extension points via plugin system
✅ Uses dependency injection for loose coupling
✅ Implements event-driven communication
✅ Emphasizes testability and type safety
✅ Enables easy onboarding of new features
✅ Supports offline-first with optional sync
✅ Maintains backward compatibility during migration

---

## 18. References

### Internal Documentation
- `docs/srs/SRS_00_INTEGRATION.md` - Master integration document (feature dependencies, data flows, event contracts)
- `docs/srs/SRS_01_FOUNDATION.md` - Foundation & core infrastructure requirements
- `docs/srs/SRS_02_GOVERNANCE.md` - Governance (Spectral linting, scoring algorithm)
- `docs/srs/SRS_03_VISUAL_DESIGNER.md` - Visual Designer (Tiptap + Monaco, bidirectional sync)
- `docs/srs/SRS_04_AI_CATALYST.md` - AI Catalyst (Groq + Gemini providers, circuit breaker)
- `docs/srs/SRS_05_API_EXPLORER.md` - API Explorer (Try It Out, SSRF protection)
- `docs/DESIGN_TOKENS.md` - IBM Carbon Design System token reference
- `docs/CARBON_IMPLEMENTATION.md` - Carbon Design System implementation guide

### External References
- [IBM Carbon Design System v11](https://carbondesignsystem.com)
- [React Router v7 Documentation](https://reactrouter.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Tiptap v2 Documentation](https://tiptap.dev)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Spectral Documentation](https://stoplight.io/open-source/spectral)
- [Groq API Documentation](https://console.groq.com/docs)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [OpenAPI 3.1.0 Specification](https://spec.openapis.org/oas/v3.1.0)
