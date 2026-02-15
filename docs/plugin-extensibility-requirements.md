# Plugin and Extensibility System Requirements

## 1. Project Overview

- **Description**: A formal plugin system for YASP (Yet Another Swagger/OpenAPI Project) that extends the existing partial plugin foundation (`app/plugins/core/`) into a first-class, production-ready extensibility platform. The system allows users and teams to swap core platform services, extend processing pipelines, and customize behavior without forking the codebase.
- **Objectives**:
  - Define and implement a stable, versioned contract layer for storage and auth backends
  - Extend the existing `PluginRegistry` and `plugin-types.ts` to cover storage and auth plugin categories
  - Provide a discoverable, safe plugin installation and management experience within the UI
  - Enable third-party and community plugin development via a documented SDK
  - Maintain backward compatibility with the existing `IDBStorage` and local-auth defaults
- **Stakeholders**:
  - End Users: individuals using YASP locally or self-hosted who want to connect their own backend
  - Enterprise Teams: organizations needing LDAP/SAML/SSO auth and cloud storage (S3, GCS, Azure Blob)
  - Plugin Authors: third-party developers building and distributing YASP plugins
  - YASP Core Maintainers: responsible for plugin API stability and security review

---

## 2. Scope and Assumptions

### In Scope
- Storage plugin interface and contract (`IStoragePlugin`)
- Auth plugin interface and contract (`IAuthPlugin`)
- Extension of existing plugin types: linter, generator, exporter, transformer (already partially defined in `app/plugins/core/plugin-types.ts`)
- Plugin registration, lifecycle management, configuration, and sandboxing
- Built-in reference implementations: `IDBStoragePlugin` (wrapping the existing `IDBStorage`), `LocalAuthPlugin`
- Plugin settings UI accessible from the application
- Plugin manifest format for discovery and validation
- Migration utilities for switching between storage backends
- Security review checklist for plugin authors

### Out of Scope
- A hosted plugin marketplace or registry server (deferred to a future release)
- Server-side plugin execution (YASP is currently a pure client-side SPA)
- Plugin code signing infrastructure (noted as a future security enhancement)
- AsyncAPI or GraphQL spec type support (the storage schema already notes this is future work)

### Assumptions
- Plugins run in the same browser JavaScript context as the host application; there is no iframe or Worker sandbox at this stage
- The existing `DIContainer` (`app/core/di/container.ts`) is the canonical service locator and plugins should register and resolve services through it
- The existing `EventDispatcher` (`app/core/events/event-dispatcher.ts`) is the pub/sub backbone; plugins must use it for cross-module communication rather than direct coupling
- Plugin configuration is persisted via the existing `IDBStorage` `settings` object store (key-value) until a storage plugin replaces it
- The `PluginContext` passed to plugins is the single point of access to core services; plugins must not import core singletons directly
- The project uses Bun as its package manager and Vitest for testing
- Auth is currently local-only (no server session); the auth plugin system models a client-side session contract, not a full OAuth server flow

### Dependencies
- `app/core/di/container.ts` — service locator used for plugin resolution
- `app/core/storage/idb-storage.ts` — default storage implementation, must become a plugin
- `app/core/storage/storage-schema.ts` — data types all storage plugins must honour
- `app/core/events/event-dispatcher.ts` — event bus plugins subscribe to and emit on
- `app/plugins/core/plugin-registry.ts` — lifecycle manager to be extended
- `app/plugins/core/plugin-types.ts` — type contracts to be expanded
- `app/providers/app-provider.tsx` — bootstrap point where plugin init must be wired
- `app/core/config/config.ts` — feature flags for enabling plugin system

---

## 3. Functional Requirements

### 3.1 User Stories

**US-01 — Storage Plugin Registration**
As a developer, I want to register a custom storage plugin so that YASP persists specs and workflows to my chosen backend (e.g., Firebase, S3, PostgreSQL via REST).
- Acceptance Criteria:
  - A plugin implementing `IStoragePlugin` can be registered via `PluginRegistry.register()`
  - After registration the DI container resolves `'storage'` to the plugin instance
  - All existing CRUD operations (`createSpec`, `getSpec`, `getAllSpecs`, `updateSpec`, `deleteSpec`, `searchSpecsByTitle`, plus workflow and settings equivalents) are fulfilled by the plugin
  - The `CatalogPage` loads specs from the registered storage plugin without code changes

**US-02 — Auth Plugin Registration**
As a developer, I want to register a custom auth plugin so that YASP delegates login, logout, and token management to my identity provider (e.g., Auth0, Azure AD, SAML SP).
- Acceptance Criteria:
  - A plugin implementing `IAuthPlugin` can be registered via `PluginRegistry.register()`
  - After registration the DI container resolves `'auth'` to the plugin instance
  - Login, logout, session refresh, and `getCurrentUser` flows route through the plugin
  - The local no-op auth (current state) is treated as a built-in default plugin

**US-03 — Plugin Lifecycle**
As a plugin author, I want my plugin's `onLoad`, `onActivate`, `onDeactivate`, and `onUnload` hooks called at the correct application lifecycle moments so that I can initialise and clean up resources safely.
- Acceptance Criteria:
  - `onLoad` is called once during application bootstrap with a `PluginContext`
  - `onActivate` is called when the plugin is enabled (either at start or by user toggle)
  - `onDeactivate` is called when the plugin is disabled without unregistering it
  - `onUnload` is called on application teardown or explicit uninstall; all subscriptions must be cleaned up
  - Errors in any hook are caught, logged via the event dispatcher, and do not crash the host application

**US-04 — Plugin Configuration Persistence**
As a user, I want plugin-specific configuration (API keys, endpoint URLs, etc.) to be persisted between sessions so that I do not need to re-enter credentials on every page load.
- Acceptance Criteria:
  - Each plugin can call `context.storage.setSetting(pluginId + ':' + key, value)` to store config
  - Plugin config values are never logged in plaintext; sensitive values must use `context.storage.createSecret()`
  - Plugin settings UI reads and writes through the same storage abstraction

**US-05 — Storage Migration**
As a user, I want to migrate my existing specs from IndexedDB to a new storage backend so that I do not lose data when switching plugins.
- Acceptance Criteria:
  - A `MigrationService` exports all records from the current storage adapter
  - The `MigrationService` imports records into the new storage adapter in a single transaction
  - Migration progress is reported via `EventDispatcher` events that the UI can subscribe to
  - Migration is idempotent: re-running it does not create duplicates (upsert by `id`)
  - On failure, migration rolls back (or reports partial failure) and leaves original data intact

**US-06 — Plugin Discovery UI**
As a user, I want a plugin management screen where I can see installed plugins, their status, version, and a link to their documentation so that I can understand what is extending my installation.
- Acceptance Criteria:
  - A `/settings/plugins` route lists all registered plugins with: id, name, version, type, status (active/inactive/error), and description
  - Each plugin entry has an Enable/Disable toggle
  - Each plugin entry shows a configuration button that opens a settings panel if `configSchema` is defined on the `PluginManifest`
  - Error state is displayed when a plugin's `onLoad` or `onActivate` threw an exception

**US-07 — Built-in Linter Plugin (Spectral)**
As a developer, I want the existing Spectral worker (`app/core/workers/spectral.worker.ts`) to be wrapped as a first-class `LinterPlugin` so that the linter conforms to the plugin contract and can be replaced by a custom ruleset linter.
- Acceptance Criteria:
  - A `SpectralLinterPlugin` class implements `LinterPlugin` and delegates to the existing worker
  - The plugin is auto-registered as a built-in during bootstrap
  - A custom linter plugin with the same `id` overrides the built-in via registry de-duplication logic

**US-08 — Request Interceptor Plugin**
As a developer, I want to register a request interceptor plugin so that I can modify outgoing API requests (e.g., inject tracing headers, modify auth tokens, or route via a proxy) before they are dispatched by the `executeApiRequest` action.
- Acceptance Criteria:
  - An `IRequestInterceptorPlugin` interface exists with a `beforeRequest(request): Promise<ApiRequestData>` method
  - The `executeApiRequest` action calls all registered interceptor plugins in registration order before sending
  - An `afterResponse(response): Promise<ApiResponseData>` hook is available for post-processing
  - A plugin can abort a request by throwing with a structured `PluginError`

**US-09 — Spec Transformer Plugin in Import Pipeline**
As a developer, I want to register a transformer plugin that converts a Swagger 2.0 or custom format into OpenAPI 3.1 automatically during the spec import flow so that users can import non-standard specs.
- Acceptance Criteria:
  - The `TransformerPlugin` (already defined in `plugin-types.ts`) is invoked by the registration wizard's `SpecUploadStep` before parsing
  - Multiple transformer plugins are chained in priority order
  - Transformer output is validated against the `OpenApiDocument` schema before storage

### 3.2 Workflows

**Plugin Bootstrap (Application Start)**
1. `AppProvider.useEffect` calls `pluginRegistry.init(context)` as it currently does
2. Registry resolves built-in plugins from the DI container (IDB storage, local auth, Spectral linter)
3. Registry resolves user-installed plugins from persisted settings (`plugin:installed` setting key)
4. Each plugin's `onLoad` hook is called sequentially in dependency order
5. Plugins that load successfully have `onActivate` called
6. Plugin that fail are quarantined: their id is recorded with an error state, the built-in fallback remains active
7. The DI container's `'storage'` binding is replaced with the active storage plugin instance
8. A `plugin:system-ready` event is emitted on the `EventDispatcher`

**Storage Plugin Switch**
1. User opens `/settings/plugins`, selects a new storage plugin and provides config
2. System presents migration prompt: "Migrate existing data to new backend? [Yes / No / Later]"
3. If confirmed, `MigrationService.migrate(from, to)` is called; progress events emitted on `EventDispatcher`
4. DI container rebinds `'storage'` to the new plugin instance
5. A `storage:plugin-switched` domain event is emitted
6. UI reloads the catalog from the new storage source

---

## 4. Non-Functional Requirements

- **Performance**: Plugin `onLoad` hooks must complete within 2000ms or be terminated; the registry reports a timeout error. Storage plugin read operations for the catalog (`getAllSpecs`) must return within 3000ms for up to 500 specs.
- **Scalability**: The plugin system must support up to 20 simultaneously registered plugins without measurable UI latency increase.
- **Security**:
  - OWASP A01:2025 (Broken Access Control): Plugins receive a scoped `PluginContext` and cannot access DI container directly; the context exposes only allowed service references.
  - OWASP A03:2025 (Injection): Plugin config values received from UI inputs must pass through the existing `validateStringLength` and `sanitize` utilities before being passed to `context.storage.setSetting`.
  - OWASP A04:2025 (Insecure Design): Auth plugins must not receive raw passwords from the host; they receive only a structured `AuthCredentials` object that the plugin itself defines.
  - OWASP A06:2025 (Authentication Failures): Auth plugins must implement `refreshSession` to support token rotation; the host calls this before session expiry.
  - OWASP A08:2025 (Software Integrity): Plugin manifests must declare a `minHostVersion` and `maxHostVersion`; the registry rejects out-of-range plugins at install time.
  - OWASP A09:2025 (Logging): All plugin lifecycle events (load, activate, deactivate, error) are emitted on the `EventDispatcher` so the logging middleware captures them.
  - OWASP A10:2025 (Vulnerable Components): Plugin authors must declare their npm dependency manifest in `PluginManifest.dependencies`; the host warns users if known CVEs are detected (future: npm audit integration).
- **Reliability**: If the active storage plugin throws on any CRUD operation, the host catches the error, emits a `storage:error` event, and surfaces a user-facing toast without crashing the application.
- **Usability**: The plugin settings UI must be fully keyboard-navigable and meet WCAG 2.1 AA contrast requirements, consistent with the existing Radix UI component usage.
- **Maintainability**: Plugin interfaces must be versioned with a `pluginApiVersion` field. Breaking changes to interfaces require a major version bump and a migration guide.
- **Testability**: Every plugin interface must have a corresponding `createMockPlugin(type)` factory in the test utilities so that unit tests can inject fake plugins without a real backend.

---

## 5. Data Requirements

### 5.1 Entities

**PluginManifest** (extended from existing `plugin-types.ts`)
```typescript
interface PluginManifest {
  id: string;                     // Unique reverse-domain identifier, e.g. 'com.example.firebase-storage'
  name: string;
  version: string;                // SemVer
  type: PluginType;               // Extended to include 'storage' | 'auth' | 'request-interceptor'
  description: string;
  author?: string;
  capabilities: string[];         // Human-readable list of what the plugin does
  dependencies?: string[];        // Other plugin IDs this plugin depends on
  configSchema?: JSONSchema7;     // JSON Schema for the plugin's configuration object
  minHostVersion: string;         // Minimum YASP version required (SemVer)
  maxHostVersion?: string;        // Maximum compatible YASP version
  documentationUrl?: string;
  pluginApiVersion: '1';          // Contract version
}
```

**PluginInstallRecord** (stored in IDB `settings` store under key `plugin:registry`)
```typescript
interface PluginInstallRecord {
  id: string;
  installedAt: string;            // ISO timestamp
  enabled: boolean;
  config: Record<string, any>;    // Encrypted if configSchema marks fields as secret
  errorState?: string;            // Last error message if plugin failed to load
}
```

**StoragePluginResult** — wraps all existing storage schema types with a unified error boundary:
```typescript
type StorageResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PluginError };
```

### 5.2 Data Flows

- Plugin config written by user through settings UI flows through input validation then to `context.storage.setSetting(pluginId + ':config', encryptedConfig)`
- On application boot, config is read from `settings`, decrypted, and passed to `plugin.onLoad(context)` as `context.config`
- Storage plugin operations are called from existing feature stores (workflow store, catalog page) and routes via the DI container — they do not call `idbStorage` directly
- Auth plugin session tokens are held in memory only; they are not persisted to IndexedDB (only refresh tokens may be persisted with user consent, encrypted via existing `SecretEntry`)

### 5.3 Storage

- Plugin install records: IDB `settings` store, key `plugin:registry`, value `PluginInstallRecord[]`
- Plugin-specific config: IDB `settings` store, key `{pluginId}:config`, value is JSON-serializable
- Plugin-specific secrets: IDB `secrets` store using the existing `SecretEntry` structure; `service_name` follows the pattern `{pluginId}:{secretName}`
- After a storage plugin is active, the plugin is responsible for persisting all new `OpenApiDocument`, `WorkflowDocument`, and `SettingEntry` records to its own backend

---

## 6. Interface Contracts

### 6.1 Storage Plugin Interface

```typescript
// New PluginType union: 'linter' | 'generator' | 'exporter' | 'transformer' | 'storage' | 'auth' | 'request-interceptor'

interface IStoragePlugin extends BasePlugin {
  type: 'storage';

  // Lifecycle
  onLoad(context: PluginContext): Promise<void>;
  onUnload(): Promise<void>;

  // Spec CRUD — mirrors IDBStorage public API exactly
  createSpec(spec: Omit<OpenApiDocument, 'id' | 'created_at' | 'updated_at'>): Promise<OpenApiDocument>;
  getSpec(id: string): Promise<OpenApiDocument | null>;
  getAllSpecs(): Promise<OpenApiDocument[]>;
  updateSpec(id: string, updates: Partial<Omit<OpenApiDocument, 'id' | 'created_at'>>): Promise<OpenApiDocument>;
  deleteSpec(id: string): Promise<void>;
  searchSpecsByTitle(query: string): Promise<OpenApiDocument[]>;

  // Workflow CRUD — mirrors IDBStorage workflow API exactly
  createWorkflow(workflow: Omit<WorkflowDocument, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowDocument>;
  getWorkflow(id: string): Promise<WorkflowDocument | null>;
  getAllWorkflows(): Promise<WorkflowDocument[]>;
  updateWorkflow(id: string, updates: Partial<Omit<WorkflowDocument, 'id' | 'created_at'>>): Promise<WorkflowDocument>;
  deleteWorkflow(id: string): Promise<void>;
  removeSpecFromWorkflows(specId: string): Promise<void>;

  // Settings — mirrors IDBStorage settings API
  getSetting<T = any>(key: string): Promise<T | null>;
  setSetting<T = any>(key: string, value: T): Promise<void>;

  // Secrets — mirrors IDBStorage secrets API
  createSecret(secret: Omit<SecretEntry, 'key_id' | 'created_at'>): Promise<SecretEntry>;
  getAllSecrets(): Promise<SecretEntry[]>;
  deleteSecret(key_id: string): Promise<void>;
}
```

**Design rationale**: The storage plugin contract deliberately mirrors the `IDBStorage` class method signatures one-to-one. This means wrapping the existing `IDBStorage` as a built-in plugin requires only a thin adapter class. Any new plugin author implementing the interface can be tested against the existing `IDBStorage` test suite used as a shared contract test.

### 6.2 Auth Plugin Interface

```typescript
interface IAuthPlugin extends BasePlugin {
  type: 'auth';

  // Session management
  login(credentials: AuthCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  refreshSession(): Promise<AuthSession>;
  getCurrentUser(): Promise<AuthUser | null>;
  isAuthenticated(): boolean;

  // Optional: OAuth / redirect flows
  getLoginUrl?(): string;
  handleCallback?(callbackParams: Record<string, string>): Promise<AuthSession>;
}

interface AuthCredentials {
  // Structured union — the auth plugin defines which fields are required
  type: 'password' | 'oauth-redirect' | 'api-key' | 'saml' | 'anonymous';
  username?: string;
  password?: string;    // Never logged, never stored in plaintext
  token?: string;
}

interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;    // ISO timestamp
  user: AuthUser;
}

interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  roles: string[];
  metadata?: Record<string, unknown>;
}
```

**Design rationale**: The auth plugin does not receive raw passwords from the host application layer beyond the structured `AuthCredentials` object. The built-in `LocalAuthPlugin` implements `type: 'anonymous'` and returns a synthetic local user, preserving the current no-auth behavior. An enterprise team can swap in an `Auth0Plugin` without the host application changing any login form logic.

### 6.3 Request Interceptor Plugin Interface

```typescript
interface IRequestInterceptorPlugin extends BasePlugin {
  type: 'request-interceptor';
  priority?: number;    // Lower number = earlier in chain; default 100

  beforeRequest(request: ApiRequestData): Promise<ApiRequestData>;
  afterResponse?(response: ApiResponseData, request: ApiRequestData): Promise<ApiResponseData>;
  onError?(error: Error, request: ApiRequestData): Promise<void>;
}
```

### 6.4 Extended Plugin Context

The existing `PluginContext` in `plugin-types.ts` uses `any` types. These must be replaced with concrete types:

```typescript
interface PluginContext {
  storage: IStoragePlugin;           // Active storage plugin (NOT the raw IDBStorage)
  events: EventDispatcher;           // Typed event dispatcher
  http: PluginHttpClient;            // SSRF-protected HTTP client (see §6.5)
  config: Record<string, unknown>;   // Plugin-specific config resolved at load time
  logger: PluginLogger;              // Structured logger (wraps console in dev, silent in test)
  pluginId: string;                  // Identity of the requesting plugin (for scoping)
}
```

### 6.5 Plugin HTTP Client

Plugins that need to make outbound HTTP requests (e.g., a Firebase storage plugin calling the Firestore REST API) must use the `PluginHttpClient` provided in context rather than `fetch` directly. This ensures SSRF validation (already implemented in `validateApiUrl` and `validateProxyUrl`) applies to plugin-originated requests.

```typescript
interface PluginHttpClient {
  get(url: string, options?: PluginRequestOptions): Promise<PluginHttpResponse>;
  post(url: string, body: unknown, options?: PluginRequestOptions): Promise<PluginHttpResponse>;
  put(url: string, body: unknown, options?: PluginRequestOptions): Promise<PluginHttpResponse>;
  delete(url: string, options?: PluginRequestOptions): Promise<PluginHttpResponse>;
}
```

### 6.6 Plugin Error Type

```typescript
class PluginError extends Error {
  constructor(
    message: string,
    public readonly pluginId: string,
    public readonly code: PluginErrorCode,
    public readonly cause?: unknown
  ) { super(message); }
}

type PluginErrorCode =
  | 'LOAD_FAILED'
  | 'CONFIG_INVALID'
  | 'STORAGE_ERROR'
  | 'AUTH_FAILED'
  | 'VERSION_INCOMPATIBLE'
  | 'DEPENDENCY_MISSING'
  | 'TIMEOUT'
  | 'REQUEST_ABORTED';
```

---

## 7. Plugin Architecture Decisions

### 7.1 Plugin Registry Extension

The existing `PluginRegistry` in `app/plugins/core/plugin-registry.ts` must be extended with:
- A `getStorage(): IStoragePlugin` convenience method that returns the active storage plugin (or throws if none is active, which should not happen after bootstrap)
- A `getAuth(): IAuthPlugin` convenience method
- A `getRequestInterceptors(): IRequestInterceptorPlugin[]` method that returns interceptors sorted by `priority`
- An activation state map: `private activePlugins = new Set<string>()` separate from `plugins` map
- A `setActiveStoragePlugin(pluginId: string): Promise<void>` method that rebinds `'storage'` in the DI container

The registry must not be a singleton that is imported directly by feature code. Feature code must resolve plugins via the DI container. The existing singleton export `export const pluginRegistry` in the registry file should remain for bootstrap use in `AppProvider` only.

### 7.2 Built-in Plugins (Reference Implementations)

The following built-in plugins must be provided as reference implementations and registered automatically during bootstrap:

| Plugin ID | Type | Description |
|---|---|---|
| `yasp.storage.indexeddb` | `storage` | Wraps existing `IDBStorage`; the default |
| `yasp.auth.local` | `auth` | Anonymous local session; the current behavior |
| `yasp.linter.spectral` | `linter` | Wraps the existing `spectral.worker.ts` |
| `yasp.exporter.yaml` | `exporter` | YAML export (current behavior) |
| `yasp.exporter.json` | `exporter` | JSON export (current behavior) |
| `yasp.transformer.swagger2` | `transformer` | Swagger 2.0 to OpenAPI 3.1 conversion |

### 7.3 Activation Model

- Only one `storage` plugin and one `auth` plugin can be active at a time
- Multiple `linter`, `exporter`, `transformer`, and `request-interceptor` plugins may be simultaneously active
- The built-in plugins are always registered but can be deactivated when a replacement is active
- Plugin priority for multi-instance types is determined by `PluginManifest.priority` (lower number = higher priority; default 100)

### 7.4 Dependency Resolution

When a plugin declares `dependencies` in its manifest, the registry must:
1. Check all dependencies are registered before calling `onLoad`
2. Call `onLoad` on dependencies first (topological sort)
3. Reject registration with `PluginErrorCode.DEPENDENCY_MISSING` if any dependency is absent

### 7.5 Versioning and Compatibility

- The plugin API contract is versioned independently from the YASP application version using a `pluginApiVersion` field on `PluginManifest`
- The current version is `'1'`
- When the host application changes a plugin interface in a breaking way, `pluginApiVersion` is incremented to `'2'`
- The registry validates `pluginApiVersion` against a `SUPPORTED_PLUGIN_API_VERSIONS` constant and rejects incompatible plugins with `PluginErrorCode.VERSION_INCOMPATIBLE`
- `minHostVersion` and `maxHostVersion` in the manifest use SemVer and are checked against `config.app.version` at registration time

---

## 8. Integration Requirements

### 8.1 DI Container Integration

The `DIContainer` in `app/core/di/container.ts` must have two new well-known service names:
- `'storage'` — resolves the active `IStoragePlugin` instance
- `'auth'` — resolves the active `IAuthPlugin` instance

All existing direct imports of `idbStorage` singleton in feature code (`catalog.tsx`, workflow store IDB tests, etc.) must be migrated to resolve from the DI container. This is a prerequisite for the plugin system to be effective.

### 8.2 AppProvider Bootstrap Integration

The `AppProvider` in `app/providers/app-provider.tsx` currently initializes services in a `useEffect`. The bootstrap sequence must be updated to:
1. Register the built-in `IDBStoragePlugin` and `LocalAuthPlugin` in the DI container
2. Load `PluginInstallRecord[]` from IDB `settings` (`plugin:registry`)
3. Register and activate user-installed plugins
4. Allow user-installed storage plugins to override the DI `'storage'` binding before the rest of the UI renders
5. Gate rendering with a loading state during plugin initialization (to prevent race conditions where the catalog tries to load specs before a remote storage plugin is connected)

### 8.3 Event System Integration

New `EventNames` constants to be added to `app/core/events/event-types.ts`:
```typescript
PLUGIN_LOADED:              'plugin:loaded'
PLUGIN_ACTIVATED:           'plugin:activated'
PLUGIN_DEACTIVATED:         'plugin:deactivated'
PLUGIN_UNLOADED:            'plugin:unloaded'
PLUGIN_ERROR:               'plugin:error'
PLUGIN_SYSTEM_READY:        'plugin:system-ready'
STORAGE_PLUGIN_SWITCHED:    'storage:plugin-switched'
AUTH_PLUGIN_SWITCHED:       'auth:plugin-switched'
STORAGE_MIGRATION_STARTED:  'storage:migration-started'
STORAGE_MIGRATION_PROGRESS: 'storage:migration-progress'
STORAGE_MIGRATION_COMPLETED:'storage:migration-completed'
STORAGE_MIGRATION_FAILED:   'storage:migration-failed'
```

### 8.4 Config Feature Flag

Add `plugins.enabled: boolean` to `AppConfig` in `app/core/config/config.ts`. When false (default in the current release), the plugin management UI is hidden and only built-in plugins are loaded. This allows a phased rollout.

### 8.5 Execute API Request Integration

The `executeApiRequest` action in `app/actions/execute-api-request.ts` must be updated to run the chain of active `IRequestInterceptorPlugin` instances via `pluginRegistry.getRequestInterceptors()` before dispatching the fetch call.

---

## 9. User Experience Requirements

### 9.1 Plugin Management Route

- Path: `/settings/plugins`
- Access: accessible without authentication (consistent with current local-first model)
- Layout: uses existing `PageHeader` component pattern from `app/components/navigation/PageHeader.tsx`
- Content: a list of installed plugins; each entry shows name, version, type badge, status badge (Active / Inactive / Error), description, and action buttons (Configure, Enable/Disable)
- The "Configure" action opens a `Sheet` (Radix UI, already in the component library at `app/components/ui/sheet.tsx`) with a dynamically rendered form built from `configSchema`
- If `configSchema` is undefined, the "Configure" button is not shown

### 9.2 Plugin Configuration Form

- JSON Schema fields of type `string` with `format: 'password'` or `"x-secret": true` are rendered as password inputs; values are stored via `context.storage.createSecret()` not `setSetting()`
- Validation follows the JSON Schema `required` and `maxLength` constraints, using the existing `validateStringLength` utility
- On save, the form calls `plugin.onLoad(context)` with the new config to allow the plugin to reinitialise its connection

### 9.3 Migration UX

- Migration is triggered from the plugin management screen when a new storage plugin is activated
- A modal dialog (using existing `Dialog` component) presents: "Migrate X specs and Y workflows to [Plugin Name]?" with a progress indicator
- Progress is driven by `EventDispatcher` subscription to `storage:migration-progress` events
- On completion: "Migration complete. X records transferred." toast via Sonner
- On failure: "Migration failed at record [id]: [error message]" with a "View Details" option that shows a failure report

### 9.4 Error Handling

- Plugin load failures are surfaced as a non-blocking banner at the top of the plugin management page: "[Plugin Name] failed to load: [error code]"
- The built-in fallback remains active and the application continues to function
- Critical failures (built-in storage plugin fails to init) retain the current `console.error` logging and show an application-level error toast

---

## 10. Constraints

### 10.1 Technical
- Must work within the existing React Router v7 / Vite / Bun stack without additional build-time plugin systems
- Plugin code must be synchronous-import-compatible (no dynamic `import()` from remote URLs at this stage; plugins are local npm packages or inline classes)
- TypeScript strict mode must be maintained for all plugin contracts
- No runtime eval or `Function()` constructor use in plugin infrastructure (CSP compliance)
- The existing `PluginType` union in `plugin-types.ts` must be extended, not replaced, to avoid breaking any existing code referencing it

### 10.2 Security Review (OWASP Top 10:2025)

| Category | Applicability | Mitigation |
|---|---|---|
| A01 Broken Access Control | High — plugins run in the same JS context as core | PluginContext scoping; plugins cannot import DI container directly |
| A02 Security Misconfiguration | Medium — plugin config stored in IDB | Sensitive fields use `createSecret()` with AES-GCM encryption (already implemented in the secrets store) |
| A03 Injection | High — plugin config values from user input | All config values pass through `validateStringLength` and `sanitize` before use |
| A04 Insecure Design | High — auth credentials flow through plugins | Auth plugins receive structured `AuthCredentials`, never raw passwords from form state |
| A05 Cryptographic Failures | Medium — refresh tokens may be persisted | Refresh tokens use existing `SecretEntry` AES-GCM path |
| A06 Auth Failures | High — auth plugins handle sessions | `refreshSession` is mandatory; host calls it before access token expiry |
| A08 Software Integrity | Medium — no code signing yet | `pluginApiVersion` + `minHostVersion` range checks; code signing deferred to a future milestone |
| A09 Logging and Monitoring | Medium — plugin errors must be observable | All lifecycle events emitted on `EventDispatcher`; logging middleware captures them |
| A10 Vulnerable Components | Medium — plugins declare their dependencies | Manifest `dependencies` field; npm audit integration is a future milestone |

### 10.3 Timeline Guidance (Phased)

- **Phase 1 — Storage Plugin Interface**: Define `IStoragePlugin`, wrap `IDBStorage` as `IDBStoragePlugin`, migrate DI container binding, write contract tests. Estimated: 2–3 weeks.
- **Phase 2 — Auth Plugin Interface**: Define `IAuthPlugin`, wrap local no-auth as `LocalAuthPlugin`, wire into AppProvider. Estimated: 1–2 weeks.
- **Phase 3 — Plugin Management UI**: `/settings/plugins` route, settings sheet, enable/disable toggle, migration dialog. Estimated: 2 weeks.
- **Phase 4 — Request Interceptor and Pipeline Plugins**: `IRequestInterceptorPlugin`, chain execution in `executeApiRequest`, extend transformer pipeline in import wizard. Estimated: 1 week.
- **Phase 5 — Community Plugin SDK and Documentation**: Extract plugin contracts into a publishable `@yasp/plugin-sdk` package, write authoring guide. Estimated: 1–2 weeks.

---

## 11. Glossary

| Term | Definition |
|---|---|
| Plugin | A self-contained module implementing one or more plugin interfaces that can be registered with the `PluginRegistry` at runtime |
| PluginContext | The scoped service object passed to each plugin on load; provides access to storage, events, HTTP, config, and logger |
| IStoragePlugin | The interface contract that all storage backend plugins must implement; mirrors the `IDBStorage` public API |
| IAuthPlugin | The interface contract that all authentication plugins must implement |
| PluginRegistry | The lifecycle manager in `app/plugins/core/plugin-registry.ts`; tracks registration, activation, and deactivation state |
| DIContainer | The service locator in `app/core/di/container.ts`; the canonical way to resolve active plugin instances |
| MigrationService | A utility that transfers all records from one `IStoragePlugin` to another |
| PluginManifest | The metadata descriptor for a plugin, including version bounds and config schema |
| PluginApiVersion | An integer string (`'1'`, `'2'`, ...) that identifies the breaking version of the plugin contract |
| AuthSession | The structured token object returned by an `IAuthPlugin` on successful authentication |
| AuthCredentials | The structured input object passed to `IAuthPlugin.login()`; avoids passing raw password strings |
| LinterPlugin | A plugin that validates OpenAPI spec content and returns `LintResult` diagnostics (already partially defined) |
| TransformerPlugin | A plugin that converts between API spec formats (already partially defined) |
| ExporterPlugin | A plugin that exports a spec in a specific output format (already partially defined) |
| GeneratorPlugin | A plugin that generates a spec from a prompt (already partially defined) |
| IRequestInterceptorPlugin | A plugin that can inspect and modify outbound API requests and their responses |
| PluginError | A typed error class with a `code: PluginErrorCode` field for structured error handling |
| SSRF | Server-Side Request Forgery; prevented in outbound plugin HTTP requests via `PluginHttpClient` |
| SemVer | Semantic Versioning (MAJOR.MINOR.PATCH); used for plugin and host version compatibility checks |

---

## 12. Revision History

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-02-14 | Requirements Analysis | Initial draft based on codebase review of `app/plugins/`, `app/core/`, `app/providers/app-provider.tsx`, `app/core/storage/idb-storage.ts`, `app/core/storage/storage-schema.ts`, `app/core/di/container.ts`, `app/core/events/`, and `app/actions/execute-api-request.ts` |
