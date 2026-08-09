# YASP

Offline-first API documentation and governance platform. Manage, explore, validate, and test OpenAPI specifications without routing document data through a cloud service.

**Live:** [heraldsqr.com/catalog](https://heraldsqr.com/catalog) · **Case study:** [portfolio.heraldsqr.com/work/yasp.html](https://portfolio.heraldsqr.com/work/yasp.html)

## Why

Most API-documentation SaaS tools require an account and send every spec you open to a third-party server — a non-starter for teams working with internal or unreleased APIs. YASP keeps your specs on your device by default: everything is stored in IndexedDB, with no backend and no account required for the core editor and linter.

## Features

- **Interactive spec editor** — CodeMirror 6, with syntax validation and autocomplete for OpenAPI documents
- **Live "Try It Out" testing** — requests proxy through the server, so testing an API doesn't hit browser CORS restrictions
- **Background linting** — Spectral runs inside a Web Worker, so quality scoring never blocks the editor, even on large specs
- **AI-powered generation and fixes** — generate a spec from a description, or apply one-click fixes to lint issues, via OpenRouter
- **Offline-first storage** — every spec persists in IndexedDB; nothing is sent to a backend to use the core editor and linter
- **Desktop app** — the same core package ships as a Tauri desktop build, for a local-only workflow

## Architecture

This is a Turborepo monorepo managed with Bun workspaces:

```
packages/
├── core/      shared logic: spec parsing, linting, storage, AI integration
├── web/       React 19 web app (React Router v7, Tailwind CSS v4)
└── desktop/   Tauri desktop shell wrapping the same core package
```

Both `web` and `desktop` depend on `core`, so features and fixes ship to both targets without duplicated implementation.

## Quick start

```bash
bun install
bun run dev:web        # start the web app
bun run dev:desktop    # start the desktop app
```

Other scripts:

```bash
bun run build           # build all packages
bun run build:web       # build the web app only
bun run build:desktop   # build the desktop app only
bun run test            # run tests across all packages
bun run typecheck       # typecheck all packages
bun run lint            # lint all packages
```

## Stack

React 19 · TypeScript · React Router v7 · Tailwind CSS v4 · CodeMirror 6 · Spectral · Tauri · Zustand · Vite · Bun · Turborepo

Testing: Vitest, Playwright

## Security

- SSRF prevention on the API-testing proxy: URL allowlisting and private-network blocking, so the proxy can't be used to reach internal infrastructure
- No spec data leaves the device for core functionality — the backend is only involved for the optional AI generation/fix features

