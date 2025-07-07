# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YASP (Yet Another Swagger/OpenAPI Project) is a React-based web application for managing and exploring OpenAPI 3.x specifications. It allows users to upload, store, and interact with API documentation through an intuitive interface.

## Development Commands

```bash
# Development
npm run dev          # Start development server with Vite
npm run build        # Build for production (TypeScript compile + Vite build)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality
npm run test         # Run tests with Vitest

# TypeScript checking
npx tsc --noEmit     # Type checking without emitting files
npx tsc -b           # Build with TypeScript project references

# Testing specific files
npm test -- SpecCard   # Run tests matching "SpecCard" 
npm test -- --watch   # Run tests in watch mode
```

## Architecture Overview

### Core Technologies
- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **React Router v7** for client-side routing
- **Radix UI** components for accessible UI primitives
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing with OpenAPI syntax support
- **IndexedDB** and **localStorage** for client-side data persistence
- **Vitest** for testing

### Application Structure

The app follows a feature-based architecture:

```
src/
├── core/           # Shared utilities and infrastructure
│   ├── components/ # Reusable UI components (Radix-based)
│   ├── context/    # React contexts (SpecContext for state management)
│   ├── services/   # Business logic (IndexedDBService)
│   └── lib/        # Utility functions
├── features/       # Feature-specific code
│   ├── directory/  # API specification listing and management (legacy)
│   ├── spec-page/  # Individual API spec viewer and testing
│   └── workspace/  # Multi-spec workspace editor with templates
└── common/         # Shared types and interfaces
```

### Key Components and Data Flow

1. **SpecContext** (`src/core/context/spec-context.tsx`): Manages global state for OpenAPI specifications using React Context
2. **IndexedDBService** (`src/core/services/indexdbservice.ts`): Handles local persistence of API specs in browser's IndexedDB
3. **OpenAPI Types** (`src/common/openapi-spec.ts`): Comprehensive TypeScript definitions for OpenAPI 3.1.0 specification

### Routing Structure
- `/` - Landing page with hero section and import functionality
- `/specs` - Specification listing and management (legacy directory feature)
- `/workspace` - Modern workspace feature with multi-spec editing and templates
- `/spec/:id` - Individual specification viewer with interactive testing

### Data Architecture

The application uses dual client-side storage patterns:

**Legacy Directory Feature** (`/specs`):
- **SpecContext** provides centralized state management
- **IndexedDBService** handles CRUD operations for specifications
- **OpenApiDocument** interface defines the complete OpenAPI spec structure
- Specs are stored with metadata (id, title, version, createdAt, workspaceType, syncStatus, tags, isDiscoverable) plus the full specification
- Recently upgraded with modern UI components: SpecCard, StatsGrid, AdvancedControls, SettingsPanel

**Modern Workspace Feature** (`/workspace`):
- **localStorage** persistence for workspace data and UI preferences
- **Workspace** and **ApiSpec** interfaces for multi-spec organization
- State managed locally within WorkspacePage component
- Template system for quick-start workflows

### Security Features

The codebase includes security measures:
- **SSRF Protection**: URL validation in `executeApiRequest` prevents dangerous requests
- **Input Validation**: Comprehensive sanitization of user inputs with size limits
- **Security Headers**: CSP and other security headers in index.html
- **Error Handling**: Safe error messages that don't expose sensitive information

### Testing Setup

- **Vitest** for unit testing with jsdom environment
- **React Testing Library** for component testing
- **MSW** for API mocking
- **Axe** for accessibility testing
- Tests are configured with globals enabled and jest-dom matchers

### Build Configuration

- **Vite** with TypeScript project references for fast builds
- **Tailwind CSS v4** with modern CSS features and OKLCH color support
- **Path aliases** configured via `vite-tsconfig-paths` plugin
- **Monaco Editor** integration for code editing capabilities
- **React Router v7** for modern routing and server actions
- **Bundle optimization** with automatic code splitting and tree shaking

### Key Files to Understand

1. **Main Entry** (`src/main.tsx`): App initialization with routing and providers
2. **Spec Context** (`src/core/context/spec-context.tsx`): Central state management for legacy directory
3. **Workspace Page** (`src/features/workspace/WorkspacePage.tsx`): Modern workspace with templates and localStorage
4. **Try It Out** (`src/features/spec-page/components/try-it-out.tsx`): API testing interface
5. **Execute API Request** (`src/features/spec-page/actions/execute-api-request.tsx`): Server action for API calls
6. **OpenAPI Types** (`src/common/openapi-spec.ts`): Complete type definitions
7. **Templates** (`src/features/workspace/templates/quick-start-templates.ts`): Pre-built workspace templates

### Important Conventions

- **Path aliases**: `@/` maps to `src/` directory
- **Component naming**: PascalCase for React components
- **File structure**: Co-locate related files (components, hooks, utils) within feature directories
- **TypeScript**: Strict typing with comprehensive OpenAPI type definitions
- **Security**: All user inputs are validated and sanitized
- **Error boundaries**: Graceful error handling throughout the application
- **Design System**: OKLCH color system with CSS custom properties, chart colors for data visualization
- **Component Library**: Radix UI primitives with consistent styling patterns

### Development Notes

- The app works entirely client-side with no backend dependencies
- Two storage systems: IndexedDB (legacy directory) and localStorage (workspace feature)
- OpenAPI specifications are parsed and validated on import
- The "Try It Out" feature makes actual HTTP requests to external APIs
- Security headers and validation prevent common web vulnerabilities
- Monaco Editor provides syntax highlighting and validation for YAML/JSON
- Workspace feature includes collapsible sidebar and template system for better UX

### Workspace Feature Architecture

The workspace feature (`/workspace`) represents the modern approach to API specification management:

**Components Structure:**
- `WorkspacePage.tsx` - Main container with dual storage (localStorage) and empty state handling
- `EmptyState.tsx` - Onboarding experience with template selection
- `TemplateSelectionDialog.tsx` - Template picker with visual categories
- `Sidebar.tsx` - Collapsible navigation with workspace/spec management
- `ApiEditor.tsx` - Monaco Editor integration for YAML/JSON editing
- `DocumentationViewer.tsx` - Live preview with "Try It Out" functionality

**Key Workflow:**
1. Empty state guides users to templates or custom workspace creation
2. Templates create pre-populated workspaces with working API specifications
3. Collapsible sidebar allows multi-workspace and multi-spec management
4. Split view enables simultaneous editing and documentation preview
5. All data persists in localStorage with graceful error handling

### Directory Feature Architecture (Modern Upgrade)

The directory feature (`/specs`) has been modernized with a comprehensive UI upgrade:

**Components Structure:**
- `DirectoryPage.tsx` - Main container with gradient background and modern layout
- `SpecCard.tsx` - Modern card component with hover effects, workspace badges, and action buttons
- `StatsGrid.tsx` - Dashboard metrics showing totals, workspace types, and activity
- `AdvancedControls.tsx` - Enhanced search, sort, and filter controls
- `SettingsPanel.tsx` - Slide-out panel for workspace configuration and tag management
- `ImportSpec.tsx` - Shared import component with file upload, paste, and URL options

**Key Features:**
- Modern card-based layout with hover animations and overflow protection
- Workspace type management (Personal, Team, Partner, Public) with color-coded badges
- Tag system for organization and filtering
- Sync status indicators (synced, syncing, offline)
- Discoverability settings for public/private specs
- Statistics dashboard with real-time metrics
- Advanced search across title, description, and tags
- Multiple sorting options (recent, name, version)

**Design Integration:**
- Uses YASP's OKLCH color system with chart colors for workspace types
- Consistent with existing Radix UI component patterns
- Responsive design with mobile-first approach
- Follows established TypeScript and component organization patterns