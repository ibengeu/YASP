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

The app follows React Router v7 conventions with a flat, organized structure:

```
app/
├── routes/              # Route components (file-based routing)
│   ├── home.tsx         # Landing page
│   ├── login.tsx        # Login page
│   ├── sign-up.tsx      # Sign up page
│   ├── catalog.tsx      # API catalog/directory
│   ├── spec.$id.tsx     # Individual spec viewer
│   ├── explorer.tsx     # API explorer
│   ├── profile.tsx      # User profile
│   └── invites.tsx      # Invite management
├── components/          # UI components organized by purpose
│   ├── ui/              # shadcn/ui components (47 components)
│   ├── auth/            # Authentication components
│   ├── landing/         # Landing page components
│   ├── spec-viewer/     # Spec viewing components
│   ├── directory/       # Directory/catalog components
│   ├── catalog/         # OpenAPI catalog components
│   ├── api-explorer/    # API explorer components
│   ├── workspace/       # Workspace components
│   ├── layout/          # Layout components
│   └── ...              # Other component groups
├── context/             # React contexts
│   ├── auth-context.tsx # Authentication state
│   └── spec-context.tsx # Spec management state
├── services/            # Business logic services
│   └── indexdbservice.ts # IndexedDB operations
├── actions/             # Server actions
│   └── execute-api-request.tsx # API request execution
├── lib/                 # Utility functions
│   ├── utils.ts         # General utilities
│   ├── sanitize.ts      # Input sanitization
│   └── spec-utils.ts    # Spec-related utilities
├── hooks/               # Custom React hooks
│   └── useMediaQuery.ts # Media query hook
├── types/               # TypeScript type definitions
│   └── openapi-spec.ts  # OpenAPI 3.1.0 types
├── __tests__/           # Test files
│   ├── context/         # Context tests
│   └── components/      # Component tests
└── test-utils/          # Testing utilities
```

### Key Components and Data Flow

1. **SpecContext** (`app/context/spec-context.tsx`): Manages global state for OpenAPI specifications using React Context
2. **IndexedDBService** (`app/services/indexdbservice.ts`): Handles local persistence of API specs in browser's IndexedDB
3. **OpenAPI Types** (`app/types/openapi-spec.ts`): Comprehensive TypeScript definitions for OpenAPI 3.1.0 specification

### Routing Structure
- `/` - Landing page (routes/home.tsx)
- `/login` - Login page (routes/login.tsx)
- `/sign-up` - Sign up page (routes/sign-up.tsx)
- `/catalog` - API catalog/directory (routes/catalog.tsx)
- `/spec/:id` - Individual specification viewer (routes/spec.$id.tsx)
- `/explorer` - API explorer (routes/explorer.tsx)
- `/profile` - User profile (routes/profile.tsx)
- `/invites` - Invite management (routes/invites.tsx)

**Note**: The `/workspace` route is referenced in the UI but not yet implemented. The workspace feature exists only in documentation.

### Data Architecture

The application uses client-side storage:

**Directory Feature** (`/specs`):
- **SpecContext** provides centralized state management
- **IndexedDBService** handles CRUD operations for specifications
- **OpenApiDocument** interface defines the complete OpenAPI spec structure
- Specs are stored with metadata (id, title, version, createdAt, workspaceType, syncStatus, tags, isDiscoverable) plus the full specification
- Modern UI components: SpecCard, StatsGrid, AdvancedControls, SettingsPanel

**Workspace Feature** (**NOT YET IMPLEMENTED**):
- Planned feature for multi-spec organization
- Intended to use localStorage persistence for workspace data and UI preferences
- Will support template system for common API patterns

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

1. **Entry Points** (`app/entry.client.tsx`, `app/entry.server.tsx`): Client and server entry points for React Router v7
2. **Root Layout** (`app/root.tsx`): Root component with providers
3. **Route Configuration** (`app/routes.ts`): File-based routing configuration
4. **Spec Context** (`app/context/spec-context.tsx`): Central state management for specs
5. **Auth Context** (`app/context/auth-context.tsx`): Authentication state management
6. **Spec Viewer Route** (`app/routes/spec.$id.tsx`): Individual spec viewer with Try It Out
7. **Try It Out** (`app/components/spec-viewer/TryItOut.tsx`): API testing interface
8. **Execute API Request** (`app/actions/execute-api-request.tsx`): Server action for API calls
9. **OpenAPI Types** (`app/types/openapi-spec.ts`): Complete type definitions
10. **IndexedDB Service** (`app/services/indexdbservice.ts`): Data persistence layer

### Important Conventions

- **Path aliases**: `@/` maps to `app/` directory
- **Component naming**: PascalCase for React components
- **File structure**: Flat component organization by purpose (no deep feature nesting)
- **Routing**: File-based routing with React Router v7 (app/routes/)
- **TypeScript**: Strict typing with comprehensive OpenAPI type definitions
- **Security**: All user inputs are validated and sanitized
- **Error boundaries**: Graceful error handling throughout the application
- **Design System**: OKLCH color system with CSS custom properties, chart colors for data visualization
- **Component Library**: Radix UI primitives with consistent styling patterns

### Development Notes

- The app uses React Router v7 with SSR capabilities
- Single storage system: IndexedDB for specification persistence
- OpenAPI specifications are parsed and validated on import
- The "Try It Out" feature makes actual HTTP requests to external APIs
- Security headers and validation prevent common web vulnerabilities
- Monaco Editor provides syntax highlighting and validation for YAML/JSON
- Mobile-first responsive design with 768px breakpoint
- Path alias @/ points to app/ directory (not src/)

### Directory/Catalog Feature Architecture

The catalog feature (`/catalog`) is the main interface for API specification management:

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

## Security Guidelines

The YASP project follows comprehensive security practices based on OWASP Top 10 2021 principles. All development work MUST adhere to these security guidelines.

### OWASP Top 10 2021 Implementation Standards

#### A01: Broken Access Control
**Required Practices:**
- Implement Role-Based Access Control (RBAC) for all user interactions
- Use SQL Server row-level security for multi-tenant data isolation
- Validate user permissions before any data access
- Apply principle of least privilege for all accounts and services
- Never trust client-side access control decisions

**Implementation Pattern:**
```typescript
// Resource-based authorization middleware
const requireResourceAccess = (resourceType: 'specification' | 'workspace' | 'team') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const hasAccess = await checkResourcePermission(req.user.id, resourceType, req.params.id);
    if (!hasAccess) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
};
```

#### A02: Cryptographic Failures
**Required Practices:**
- Use Azure Key Vault for all secrets and encryption keys
- Enforce TLS 1.3 for all data in transit
- Enable SQL Server Transparent Data Encryption (TDE)
- Use Always Encrypted for PII fields
- Hash passwords with bcrypt (minimum 12 rounds)

**Implementation Pattern:**
```typescript
// Secure password hashing
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;
export const hashPassword = async (password: string) => bcrypt.hash(password, SALT_ROUNDS);

// Azure Key Vault integration
import { SecretClient } from '@azure/keyvault-secrets';
const getSecret = async (secretName: string) => {
  const secret = await secretClient.getSecret(secretName);
  return secret.value!;
};
```

#### A03: Injection
**Required Practices:**
- Use parameterized queries for all SQL operations
- Implement JSON schema validation for all API inputs
- Sanitize user-generated content in React components
- Automate SQL injection testing in CI/CD

**Implementation Pattern:**
```typescript
// Parameterized SQL queries (SQL Server)
export const getSpecificationsByUser = async (userId: string) => {
  const result = await pool.request()
    .input('userId', userId)
    .query('SELECT * FROM specifications WHERE user_id = @userId');
  return result.recordset;
};

// Input validation with Joi
import Joi from 'joi';
const specSchema = Joi.object({
  title: Joi.string().max(255).required(),
  spec_data: Joi.object().required()
});
```

#### A04: Insecure Design
**Required Practices:**
- Perform threat modeling for each major feature
- Conduct security architecture reviews before implementation
- Apply zero-trust principles to all service communications
- Use secure defaults for all Azure service configurations

#### A05: Security Misconfiguration
**Required Practices:**
- Maintain 90%+ Azure Security Center compliance
- Use Infrastructure as Code (Terraform) with security configurations
- Establish and monitor security baselines
- Perform regular security configuration audits

**Implementation Pattern:**
```hcl
# Secure Azure SQL Database configuration
resource "azurerm_mssql_database" "yasp_db" {
  transparent_data_encryption_enabled = true
  threat_detection_policy {
    state = "Enabled"
    email_addresses = ["security@yasp.com"]
  }
}
```

#### A06: Vulnerable and Outdated Components
**Required Practices:**
- Integrate automated dependency scanning in CI/CD
- Apply security updates within 48 hours for critical vulnerabilities
- Maintain inventory of all third-party components
- Track and apply Azure service updates promptly

**Implementation Pattern:**
```yaml
# GitHub Actions security scanning
name: Security Scan
on: [push, pull_request]
jobs:
  security-scan:
    steps:
      - name: Run Snyk vulnerability scan
        uses: snyk/actions/node@master
      - name: Run npm audit
        run: npm audit --audit-level=moderate
```

#### A07: Identification and Authentication Failures
**Required Practices:**
- Implement multi-factor authentication for paid tiers
- Use secure session management with token rotation
- Implement account lockout for brute force prevention
- Enforce strong password policies

**Implementation Pattern:**
```typescript
// Secure JWT token management
export const generateTokens = async (userId: string) => {
  const accessToken = jwt.sign({ userId }, await getSecret('jwt-secret'), { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, await getSecret('refresh-secret'), { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
```

#### A08: Software and Data Integrity Failures
**Required Practices:**
- Implement code signing for production deployments
- Perform supply chain security scanning
- Validate file integrity with checksums
- Verify API response integrity

#### A09: Security Logging and Monitoring Failures
**Required Practices:**
- Log all security events with Azure Application Insights
- Implement real-time security monitoring
- Maintain immutable audit trails
- Trigger automated incident response

**Implementation Pattern:**
```typescript
// Security event logging
export const logSecurityEvent = (eventType: string, details: any, userId?: string) => {
  applicationInsights.trackEvent({
    name: `Security.${eventType}`,
    properties: { userId, timestamp: new Date().toISOString(), details }
  });
};
```

#### A10: Server-Side Request Forgery (SSRF)
**Required Practices:**
- Validate and allowlist external URLs
- Implement network segmentation
- Use Azure WAF for request filtering
- Prevent access to internal networks

**Implementation Pattern:**
```typescript
// SSRF prevention for API testing
const ALLOWED_DOMAINS = ['api.example.com', 'httpbin.org'];
export const validateApiUrl = (url: string): boolean => {
  const parsedUrl = new URL(url);
  return ALLOWED_DOMAINS.some(domain => 
    parsedUrl.hostname.endsWith(domain)
  ) && !isPrivateNetwork(parsedUrl.hostname);
};
```

### Security Testing Requirements

**Automated Testing:**
- Static Application Security Testing (SAST) with SonarQube
- Dynamic Application Security Testing (DAST) with OWASP ZAP
- Interactive Application Security Testing (IAST) for runtime monitoring
- Dependency scanning with Snyk and npm audit

**Manual Testing:**
- Regular penetration testing
- Security code reviews
- Threat modeling sessions
- Compliance audits

### Azure Security Best Practices

**Service Configuration:**
- Enable Azure Security Center for all resources
- Use Azure Key Vault for secrets management
- Implement Azure Monitor for logging and alerting
- Configure Azure WAF for web application protection

**Database Security:**
- Enable SQL Server Transparent Data Encryption
- Use Always Encrypted for sensitive data
- Implement row-level security for multi-tenancy
- Configure threat detection and auditing

**Network Security:**
- Use Azure Virtual Network for isolation
- Implement Network Security Groups (NSGs)
- Enable DDoS protection
- Configure private endpoints for services

### Compliance and Governance

**Standards:**
- SOC 2 Type II compliance for Enterprise tier
- GDPR compliance for data protection
- ISO 27001 certification pursuit
- Regular security audits and assessments

**Incident Response:**
- Documented incident response procedures
- Automated threat detection and alerting
- Security breach notification processes
- Regular incident response plan testing
- @src\docs\ProductRequirementsDocument.md @src\docs\MonetizationSRS.md
- i'm using bun