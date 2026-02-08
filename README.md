# YASP - Yet Another Swagger/OpenAPI Project

An open-source API documentation platform for creating, exploring, and testing OpenAPI 3.x specifications. Import existing specs or generate them from scratch with AI, browse rich interactive documentation, and test endpoints directly in the browser -- all offline-first with zero backend dependencies.

## Features

- **API Catalog** - Browse, search, and manage your API specifications in one place
- **Interactive Documentation** - Rich rendered docs with endpoint details, parameters, request bodies, and response schemas
- **Spec Editor** - YAML/JSON editor (CodeMirror 6) with syntax highlighting and live documentation preview
- **Try It Out** - Test API endpoints directly from the docs with auto-populated parameter forms, auth support, and response viewer
- **AI Generation** - Generate complete OpenAPI specs from natural language descriptions via OpenRouter
- **Import Anywhere** - Register APIs by uploading files, pasting YAML/JSON, or fetching from a URL
- **Linting & Quality Scores** - Real-time Spectral validation with a quality score (0-100) and AI-powered quick fixes
- **Offline-First** - Everything stored locally in IndexedDB; no account, no server, no data leaves your browser

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- Node.js 20+ (for React Router SSR)

### Installation

```bash
git clone https://github.com/ibengeu/YASP.git
cd YASP
bun install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required for AI spec generation (OpenRouter)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Optional feature flags
VITE_ENABLE_AI=true
VITE_ENABLE_GOVERNANCE=true
```

The app works fully without API keys -- AI generation will simply be disabled.

### Development

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production Build

```bash
bun run build
bun run start
```

## Project Structure

```
app/
├── routes/                 # React Router v7 file-based routes
│   ├── _dashboard.tsx      # Dashboard layout (sidebar + header)
│   ├── catalog.tsx         # API catalog browser
│   └── editor.$id.tsx      # Spec editor with docs & Try It Out
├── features/               # Domain feature modules
│   ├── ai-catalyst/        # AI-powered spec generation
│   ├── api-explorer/       # API testing & request execution
│   ├── diff/               # Spec diffing & comparison
│   ├── editor/             # CodeMirror editor integration
│   ├── governance/         # Spectral linting & quality scoring
│   ├── library/            # Spec import & management
│   └── registration/       # Multi-step API registration wizard
├── core/                   # Infrastructure layer
│   ├── config/             # Application configuration
│   ├── di/                 # Dependency injection container
│   ├── events/             # Event dispatcher & middleware
│   ├── security/           # Input validators & sanitizers
│   ├── storage/            # IndexedDB persistence layer
│   └── workers/            # Web Workers (Spectral linting)
├── components/             # Shared UI components
│   ├── ui/                 # Radix UI primitive wrappers
│   ├── api-details/        # Try It Out drawer & API viewer
│   ├── catalog/            # Catalog cards & list components
│   ├── editor/             # Floating action bar & editor UI
│   └── navigation/         # CommandDeck, PageHeader
├── lib/                    # Utilities & constants
├── actions/                # React Router server actions
├── providers/              # React context providers
├── plugins/                # Plugin system
├── stores/                 # Zustand state stores
└── types/                  # TypeScript type definitions
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, React Router v7 |
| Language | TypeScript 5.9 |
| Build | Vite 7, Bun |
| Styling | Tailwind CSS v4, Radix UI |
| Code Editor | CodeMirror 6 |
| Linting | Spectral (OpenAPI rules) |
| State | Zustand |
| Storage | IndexedDB (offline-first) |
| AI | OpenRouter API |
| Validation | Zod v4 |
| Testing | Vitest, Playwright, React Testing Library |

## Scripts

```bash
# Development
bun run dev              # Start dev server
bun run build            # Production build
bun run start            # Serve production build

# Type Checking
bun run typecheck        # TypeScript + React Router typegen

# Testing
bun run test             # Unit tests (watch mode)
bun run test:run         # Unit tests (single run)
bun run test:ui          # Vitest UI
bun run test:e2e         # Playwright E2E tests
bun run test:e2e:ui      # Playwright UI
bun run test:e2e:headed  # E2E tests with browser visible

# Utilities
bun run sync:notion      # Sync docs to Notion workspace
```

## Architecture

### Offline-First Storage

All specifications are stored in the browser's IndexedDB. No backend server is required for core functionality. The storage layer provides a typed API over IndexedDB with CRUD operations, metadata management, and workspace types (personal, team, partner, public).

### API Testing Proxy

The "Try It Out" feature uses React Router v7 server actions as a proxy to avoid CORS restrictions when testing external APIs. All outbound requests are validated against SSRF rules before execution.

### Linting

Spectral linting runs inside a Web Worker to keep the UI responsive. Results include severity-based diagnostics, a quality score, and optional AI-powered fix suggestions.

### Plugin System

YASP includes a plugin architecture with a registry, lifecycle hooks, and dependency injection for extending functionality.

## Security

The project follows [OWASP Top 10:2025](https://owasp.org/Top10/) practices:

- **SSRF Prevention** - URL validation and private network blocking for the API testing proxy
- **Input Sanitization** - DOMPurify for user content, Zod for schema validation
- **Injection Protection** - No raw string interpolation in sensitive paths
- **Security Headers** - CSP and standard security headers configured
- **Safe Error Handling** - No stack traces or internal details exposed to the client
- **Supply Chain** - Unused dependencies actively removed; lockfile-verified installs

## Testing

- **Unit Tests** (Vitest + React Testing Library) - Components, services, utilities
- **E2E Tests** (Playwright) - Full user workflows across Chromium
- **API Mocking** (MSW) - Deterministic test responses
- **CI** - GitHub Actions runs E2E tests on every push and PR

```bash
bun run test:run && bun run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Write tests first, then implement (TDD)
4. Ensure `bun run typecheck` and `bun run test:run` pass
5. Submit a pull request

### Guidelines

- Path alias: `@/` maps to `app/`
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- All user inputs must be validated and sanitized
- Follow existing patterns (feature modules, Radix UI components, Zustand stores)

## Roadmap

- [ ] Cloud sync and multi-device persistence
- [ ] Team workspaces with real-time collaboration
- [ ] API versioning and changelog diffing
- [ ] Custom linting rulesets
- [ ] Export to Postman, Insomnia, cURL
- [ ] SDK and server stub generation

## License

This project is not yet licensed. All rights reserved.
