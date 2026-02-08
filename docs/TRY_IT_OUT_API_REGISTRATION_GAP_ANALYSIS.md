# Try It Out & API Registration Integration - Gap Analysis & Requirements

**Document Type:** Technical Requirements Document
**Version:** 2.0
**Date:** 2026-02-07
**Status:** Draft for Review
**Owner:** Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Current State Analysis](#3-current-state-analysis)
4. [Identified Gaps](#4-identified-gaps)
5. [Proposed Solutions](#5-proposed-solutions)
6. [Implementation Plan](#6-implementation-plan)
7. [Testing Strategy](#7-testing-strategy)
8. [Success Metrics](#8-success-metrics)

---

## 1. Executive Summary

### 1.1 Purpose

This document identifies gaps between the **RegisterApiDrawer** (API registration flow) and **TryItOutDrawer** (API testing console) that prevent users from successfully testing registered APIs.

### 1.2 Critical Finding

**The Try It Out feature is unusable for 100% of APIs registered without uploading a complete OpenAPI specification.** This is because:

1. No valid base URL is guaranteed to be captured
2. Generated spec stubs have empty `paths: {}` with no testable endpoints
3. Authentication configuration is never captured during registration

### 1.3 Root Cause

**Redundant manual data entry:** Users manually enter information (name, version, base URL, etc.) that already exists in their OpenAPI spec, then upload the spec which gets ignored until final submission. This creates two problems:

- **Gap A:** Manual entry is error-prone (invalid URLs, missing data)
- **Gap B:** Spec metadata is not extracted and used to auto-fill the form

### 1.4 Impact

- **User Frustration:** 100% of users registering APIs without full specs cannot test them
- **Wasted Time:** 3-5 minutes of redundant data entry per API registration
- **Data Quality:** High error rate due to manual input of data that exists in specs
- **Feature Adoption:** Try It Out feature has 0% usage rate for manually registered APIs

### 1.5 Recommended Action

**Priority 1 (Immediate - 1 week):**
- Implement auto-inference: parse uploaded specs and auto-fill all form fields
- Add strict base URL validation to prevent invalid entries
- Allow manual endpoint definition when no spec provided

**Priority 2 (High - 1 week):**
- Capture authentication configuration during registration
- Store encrypted credentials for Try It Out pre-population

**Priority 3 (Medium - 2 weeks):**
- Support multiple server environments (dev/staging/prod)
- Implement environment variable substitution

---

## 2. Problem Statement

### 2.1 Current User Journey (Broken)

```
1. User clicks "Register New API"
2. Fills Step 1: name="My API", version="1.0.0", endpoint="/api/v1", description="..."
   → ERROR: Endpoint is relative path, not complete URL

3. Corrects to: endpoint="https://api.example.com"
   → OK, proceeds to Step 2

4. Uploads OpenAPI spec (stripe-api.yaml)
   → Contains: info.title="Stripe API", servers[0].url="https://api.stripe.com"
   → System ignores these values, uses manual input from Step 1

5. Submits registration
   → Stores spec with conflicting metadata:
     - Stored name: "My API" (from manual input)
     - Spec says: "Stripe API" (ignored)
     - Stored endpoint: "https://api.example.com" (wrong)
     - Spec says: "https://api.stripe.com" (ignored)

6. Opens editor, clicks "Try It Out"
   → Loads endpoint from manual input: "https://api.example.com"
   → Sends request to WRONG URL
   → Request fails with 404 or connection error

RESULT: Feature is broken, user frustrated
```

### 2.2 Expected User Journey (Fixed)

```
1. User clicks "Register New API"

2. Step 1: Upload OpenAPI spec FIRST
   → Uploads stripe-api.yaml
   → System parses immediately
   → Auto-fills ALL fields:
     - name: "Stripe API" ✓
     - version: "2023-10-16" ✓
     - endpoint: "https://api.stripe.com" ✓
     - description: "The Stripe REST API..." ✓
     - auth: "Bearer Token (JWT)" ✓
     - tags: ["payments", "customers"] ✓
   → Shows summary: "6/6 fields auto-filled from spec (High confidence)"

3. Step 2: Review & customize
   → User sees all pre-filled fields with "From spec ✓" badges
   → Can override any field if needed
   → Optionally enters auth token for testing

4. Step 3: Submit
   → Stores spec with correct metadata

5. Opens editor, clicks "Try It Out"
   → Uses correct base URL: "https://api.stripe.com"
   → Pre-populates auth: Bearer Token
   → Sends test request successfully
   → Returns 200 OK

RESULT: Feature works as expected
```

---

## 3. Current State Analysis

### 3.1 Data Flow Diagram

```
┌──────────────────────┐
│  RegisterApiDrawer   │
│   (Registration)     │
└──────────┬───────────┘
           │
           ├─ Step 1: Manual Input
           │  - name, version, endpoint, description
           │  - No validation of complete URL
           │  - No auto-inference from spec
           │
           ├─ Step 2: Upload Spec (Optional)
           │  - Accepts YAML/JSON
           │  - Validates OpenAPI format
           │  - DOES NOT update form fields ❌
           │
           └─ Step 3: Submit
              - Generates minimal spec if none provided:
                  paths: {}  ← EMPTY, no testable endpoints
              - Stores in IndexedDB

                    ↓

┌──────────────────────┐
│   editor.$id.tsx     │
│   (Editor View)      │
└──────────┬───────────┘
           │
           ├─ Loads spec from IndexedDB
           ├─ Parses YAML to extract baseUrl:
           │    baseUrl = spec.servers?.[0]?.url || 'https://api.example.com'
           │                                          ↑
           │                                     FALLBACK FAILS
           └─ Opens Try It Out drawer

                    ↓

┌──────────────────────┐
│  TryItOutDrawer      │
│   (API Testing)      │
└──────────┬───────────┘
           │
           ├─ Requires: baseUrl (string)
           ├─ Requires: spec.paths (object with endpoints)
           │
           ├─ Constructs URL: baseUrl + path
           │    Example: "https://api.example.com" + "/users"
           │              = "https://api.example.com/users"
           │
           └─ Sends request via executeApiRequest()
              - Validates URL (SSRF protection)
              - Applies auth headers
              - Executes fetch with 30s timeout

              FAILS IF:
              - baseUrl is invalid ❌
              - baseUrl is fallback "https://api.example.com" ❌
              - spec.paths is empty {} ❌
```

### 3.2 Code Analysis

#### Current: RegisterApiDrawer.tsx (Lines 147-186)

```typescript
const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    let specContent = formData.openapiSpec.content;
    let parsedSpec;

    // If user provided a spec, parse and validate it
    if (specContent) {
      try {
        parsedSpec = JSON.parse(specContent);
      } catch {
        const yaml = await import('yaml');
        parsedSpec = yaml.parse(specContent);
      }

      // ❌ PROBLEM: Only infers at submission, doesn't update UI
      const title = parsedSpec.info?.title || formData.name;
      const version = parsedSpec.info?.version || formData.version;
      const description = parsedSpec.info?.description || formData.description;

      // ❌ PROBLEM: servers[0].url is ignored, uses formData.endpoint instead
    } else {
      // ❌ PROBLEM: Generated spec has no endpoints
      specContent = `openapi: 3.1.0
info:
  title: ${formData.name}
  version: ${formData.version}
  description: ${formData.description}
servers:
  - url: ${formData.endpoint}
paths: {}`;  // ← EMPTY
    }

    await idbStorage.createSpec({
      type: 'openapi',
      content: specContent,
      title,  // May differ from spec.info.title
      version,  // May differ from spec.info.version
      description,
      metadata: {
        score: 0,
        tags: formData.tags,
        workspaceType: 'personal',
        syncStatus: 'offline',
        isDiscoverable: true,
        // ❌ PROBLEM: No servers array stored
        // ❌ PROBLEM: No auth config stored
      },
    });
  }
};
```

#### Current: editor.$id.tsx (Lines 619-621)

```typescript
<TryItOutDrawer
  baseUrl={parsedSpec?.servers?.[0]?.url || 'https://api.example.com'}
  //       ↑ Falls back to dummy URL if spec has no servers
  spec={parsedSpec}
  // ↑ May have empty paths: {}
/>
```

**Failure Scenarios:**

| Scenario | baseUrl | spec.paths | Try It Out Result |
|----------|---------|------------|-------------------|
| User uploads full spec | ✅ Valid | ✅ Has endpoints | ✅ Works |
| User enters manual URL, no spec | ❌ Fallback | ❌ Empty `{}` | ❌ "No endpoints found" |
| User enters invalid URL | ❌ Invalid | ❌ Empty `{}` | ❌ Request fails |
| Spec has no servers array | ❌ Fallback | ✅ Has endpoints | ❌ Wrong URL |

---

## 4. Identified Gaps

### 4.1 Gap Matrix

| # | Gap Name | Severity | Impact | Current Workaround | Solution Priority |
|---|----------|----------|--------|-------------------|-------------------|
| **0** | Redundant Manual Data Entry | Critical | Users re-enter data from spec | None | P0 - Immediate |
| **1** | Missing Base URL Validation | Critical | Invalid URLs break Try It Out | None | P0 - Immediate |
| **2** | No Server Array Persistence | High | Can't switch environments | Manual spec edit | P1 - High |
| **3** | No Authentication Capture | Critical | Manual auth every test | None | P1 - High |
| **4** | Empty Paths in Generated Specs | Critical | Try It Out unusable | Must upload full spec | P0 - Immediate |
| **5** | No Multi-Server Support | Medium | Can't test dev/staging | Manual URL change | P2 - Medium |
| **6** | No Environment Variables | Medium | Can't use `{{baseUrl}}` | Hardcode values | P2 - Medium |
| **7** | No Request History | Low | Can't replay tests | Re-enter manually | P3 - Low |

---

### 4.2 Gap Details

#### Gap 0: Redundant Manual Data Entry

**Problem:** Form fields are not auto-populated from uploaded OpenAPI specs.

**Evidence:**
```typescript
// User uploads spec with:
{
  "info": {
    "title": "Stripe API",
    "version": "2023-10-16",
    "description": "The Stripe REST API..."
  },
  "servers": [{ "url": "https://api.stripe.com" }],
  "components": {
    "securitySchemes": {
      "bearerAuth": { "type": "http", "scheme": "bearer" }
    }
  },
  "tags": [{ "name": "payments" }, { "name": "customers" }]
}

// But form still shows:
name: ""  // Empty, user must type
version: ""  // Empty, user must type
endpoint: ""  // Empty, user must type
```

**Impact:**
- Wastes 3-5 minutes per registration
- High error rate (typos, wrong values)
- Poor user experience

**What Can Be Auto-Inferred:**

| Field | OpenAPI Location | Example Value | Inference Logic |
|-------|------------------|---------------|-----------------|
| Name | `info.title` | "Stripe API" | Direct copy |
| Version | `info.version` | "2023-10-16" | Direct copy |
| Description | `info.description` | "The Stripe REST API..." | Direct copy, max 500 chars |
| Base URL | `servers[0].url` | "https://api.stripe.com" | First server or production server |
| All Servers | `servers[]` | [dev, staging, prod] | Map all servers with descriptions |
| Auth Type | `components.securitySchemes` | "bearer" → "Bearer Token" | Map scheme.type to UI options |
| Auth Scheme | `securitySchemes[].scheme` | "bearer" → JWT | Detect format |
| Auth Header | `securitySchemes[].name` | "X-API-Key" | For API key auth |
| Tags | `tags[].name` | ["payments", "customers"] | Extract all tag names |
| Endpoints | `paths.*` | 47 endpoints | Count and validate |
| Contact | `info.contact.email` | "api@stripe.com" | Display only |
| Docs | `externalDocs.url` | "https://stripe.com/docs" | Link in review |

---

#### Gap 1: Missing Base URL Validation

**Problem:** No validation that `endpoint` field contains a complete, valid URL.

**Current Validation (Lines 116-120):**
```typescript
if (!formData.endpoint) {
  newErrors.endpoint = 'Endpoint is required';
} else if (!formData.endpoint.startsWith('https://')) {
  newErrors.endpoint = 'Endpoint must use HTTPS';
}
```

**What's Missing:**
- ❌ No check for complete URL (protocol + hostname)
- ❌ Allows relative paths: `/api/v1`
- ❌ Allows partial URLs: `api.stripe.com` (missing protocol)
- ❌ Allows non-HTTP protocols: `ftp://example.com`

**Failure Examples:**

| User Input | Current Validation | Try It Out Result |
|------------|-------------------|-------------------|
| `/api/v1` | ✅ Passes | ❌ "Invalid URL" error |
| `api.stripe.com` | ✅ Passes | ❌ "Invalid URL" error |
| `http://api.example.com` | ❌ Fails (not HTTPS) | N/A |
| `https://api.stripe.com` | ✅ Passes | ✅ Works |

---

#### Gap 4: Empty Paths in Generated Specs

**Problem:** When users don't upload a spec, the generated stub has `paths: {}` with no endpoints.

**Current Generation (Lines 153-160):**
```typescript
specContent = `openapi: 3.1.0
info:
  title: ${formData.name}
  version: ${formData.version}
  description: ${formData.description}
servers:
  - url: ${formData.endpoint}
paths: {}`;  // ← EMPTY: No endpoints defined
```

**Impact:**
- Try It Out shows: "No endpoints found"
- Feature is completely unusable
- User cannot test their API

**Example:**
```
User registers "Payment API" with endpoint "https://api.payment.com"
→ Generated spec has paths: {}
→ Try It Out cannot display any endpoints
→ User cannot send test requests
→ Feature appears broken
```

---

#### Gap 3: No Authentication Capture

**Problem:** Authentication configuration is never captured during registration.

**Try It Out Auth Options:**
```typescript
type AuthType = 'none' | 'api-key' | 'bearer' | 'basic';

interface AuthConfig {
  type: AuthType;
  apiKey?: string;        // For api-key
  token?: string;         // For bearer
  username?: string;      // For basic
  password?: string;      // For basic
}
```

**Current State:**
- ✅ Try It Out supports 4 auth types
- ✅ Users can configure auth per-request
- ❌ No default auth stored during registration
- ❌ Users must reconfigure auth every time

**Can Be Inferred from Spec:**

```yaml
# Example: Bearer Token
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

**Inference Logic:**
```typescript
spec.components.securitySchemes.bearerAuth.type === 'http'
  && scheme === 'bearer'
  → Auth type: "bearer"
  → Show: "This API uses Bearer Token (JWT) authentication"
  → Prompt user to optionally enter token for testing
```

---

## 5. Proposed Solutions

### 5.1 Solution Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW (Enhanced)                  │
└─────────────────────────────────────────────────────────────────┘

Step 1: Upload OpenAPI Spec (MOVED TO FIRST STEP)
├─ Upload file / Paste YAML/JSON / Import from URL
├─ Parse spec immediately on load
├─ Extract all metadata using inferAllData()
├─ Display Spec Analysis Card:
│  ┌──────────────────────────────────────────────────┐
│  │ ✓ OpenAPI 3.1.0 Spec Parsed                      │
│  ├──────────────────────────────────────────────────┤
│  │ API Name:     Stripe API            (From spec)  │
│  │ Version:      2023-10-16            (From spec)  │
│  │ Base URL:     https://api.stripe.com (From spec) │
│  │ Auth:         Bearer Token (JWT)    (From spec)  │
│  │ Endpoints:    47 endpoints          (From spec)  │
│  │ Tags:         4 categories          (From spec)  │
│  │                                                   │
│  │ Confidence: ⭐⭐⭐⭐⭐ High (7/7 fields found)   │
│  └──────────────────────────────────────────────────┘
└─ Auto-fill ALL form fields from spec metadata

Step 2: Review & Customize (Previously Step 3)
├─ Show all auto-filled fields with "✓ From spec" badges
├─ Allow manual override of any field
├─ If no spec uploaded:
│  ├─ Show manual entry form
│  └─ Add "Manual Endpoint Definition" section:
│     - Path: /users
│     - Method: GET/POST/PUT/DELETE
│     - Summary: "List users"
│     - [+ Add Another Endpoint]
└─ Validate all fields before proceeding

Step 3: Configure Authentication (NEW - Optional)
├─ If auth detected in spec:
│  ├─ Show: "This API uses Bearer Token authentication"
│  ├─ Pre-fill: Auth type, header name, scheme
│  └─ Prompt: "Enter token for testing (optional)"
├─ If no auth in spec:
│  └─ Dropdown: Select auth type (None/API Key/Bearer/Basic)
└─ Store encrypted credentials in secrets table

Step 4: Submit
├─ Generate final spec:
│  ├─ If spec uploaded: Use as-is
│  └─ If manual entry: Generate from manual endpoints
├─ Store in IndexedDB with enhanced metadata:
│  └─ metadata: {
│       servers: [...],        // All server URLs
│       defaultAuth: {...},    // Auth configuration
│       inferredFields: [...], // Which fields came from spec
│     }
└─ Success: Navigate to editor
```

### 5.2 Implementation Details

#### 5.2.1 Auto-Inference Function

**File:** `app/features/registration/utils/spec-inference.ts`

```typescript
export interface InferredData {
  // Basic Information
  name?: string;
  version?: string;
  description?: string;

  // Server Configuration
  servers: ServerConfig[];
  primaryServerUrl?: string;

  // Authentication
  auth: AuthConfig | null;
  multipleAuthSupported: boolean;

  // Organization
  tags: string[];

  // Endpoints
  endpointCount: number;
  endpointsByMethod: Record<string, number>;

  // Metadata
  confidence: 'high' | 'medium' | 'low';
  fieldsPopulated: number;
  totalFields: number;
  validationIssues: ValidationIssue[];
}

export function inferAllData(spec: any): InferredData {
  // Parse OpenAPI structure
  const info = spec.info || {};
  const servers = spec.servers || [];
  const securitySchemes = spec.components?.securitySchemes || {};
  const globalSecurity = spec.security || [];
  const tags = spec.tags || [];
  const paths = spec.paths || {};

  // Infer servers
  const serverConfigs: ServerConfig[] = servers.map((s: any, idx: number) => ({
    url: s.url,
    description: s.description || `Server ${idx + 1}`,
    variables: s.variables || {},
    isDefault: idx === 0,  // First is default
  }));

  // Find primary server (prefer production)
  const primaryServer = servers.find((s: any) =>
    s.description?.toLowerCase().includes('production')
  ) || servers[0];

  // Infer authentication
  const authConfig = inferAuthFromSecuritySchemes(securitySchemes, globalSecurity);

  // Count endpoints
  const endpoints = countEndpointsByMethod(paths);

  // Calculate confidence
  let populated = 0;
  const total = 10;
  if (info.title) populated++;
  if (info.version) populated++;
  if (info.description) populated++;
  if (servers.length > 0) populated++;
  if (Object.keys(securitySchemes).length > 0) populated++;
  if (tags.length > 0) populated++;
  if (Object.keys(paths).length > 0) populated++;
  if (info.contact) populated++;
  if (spec.externalDocs) populated++;
  if (spec.components?.schemas) populated++;

  const confidence = populated >= 7 ? 'high' : populated >= 4 ? 'medium' : 'low';

  return {
    name: info.title,
    version: info.version,
    description: info.description,
    servers: serverConfigs,
    primaryServerUrl: primaryServer?.url,
    auth: authConfig,
    multipleAuthSupported: Object.keys(securitySchemes).length > 1,
    tags: tags.map((t: any) => t.name),
    endpointCount: endpoints.total,
    endpointsByMethod: endpoints.byMethod,
    confidence,
    fieldsPopulated: populated,
    totalFields: total,
    validationIssues: validateSpec(spec),
  };
}

function inferAuthFromSecuritySchemes(
  schemes: any,
  globalSecurity: any[]
): AuthConfig | null {
  const schemeNames = Object.keys(schemes);
  if (schemeNames.length === 0) return null;

  // Prioritize scheme used in global security
  let primarySchemeName = schemeNames[0];
  if (globalSecurity.length > 0) {
    primarySchemeName = Object.keys(globalSecurity[0])[0] || primarySchemeName;
  }

  const scheme = schemes[primarySchemeName];
  if (!scheme) return null;

  // HTTP Bearer Token
  if (scheme.type === 'http' && scheme.scheme === 'bearer') {
    return {
      type: 'bearer',
      scheme: 'bearer',
      bearerFormat: scheme.bearerFormat || 'JWT',
      description: scheme.description,
    };
  }

  // API Key
  if (scheme.type === 'apiKey') {
    return {
      type: 'api-key',
      keyLocation: scheme.in,  // 'header' | 'query' | 'cookie'
      keyName: scheme.name,    // e.g., 'X-API-Key'
      description: scheme.description,
    };
  }

  // HTTP Basic Auth
  if (scheme.type === 'http' && scheme.scheme === 'basic') {
    return {
      type: 'basic',
      scheme: 'basic',
      description: scheme.description,
    };
  }

  return null;
}

function countEndpointsByMethod(paths: any): {
  total: number;
  byMethod: Record<string, number>;
} {
  const byMethod: Record<string, number> = {
    GET: 0,
    POST: 0,
    PUT: 0,
    PATCH: 0,
    DELETE: 0,
  };

  let total = 0;

  Object.values(paths).forEach((pathItem: any) => {
    ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
      if (pathItem[method]) {
        byMethod[method.toUpperCase()]++;
        total++;
      }
    });
  });

  return { total, byMethod };
}

function validateSpec(spec: any): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for servers
  if (!spec.servers || spec.servers.length === 0) {
    issues.push({
      severity: 'error',
      field: 'servers',
      message: 'No servers defined - base URL required for testing',
    });
  }

  // Check for endpoints
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    issues.push({
      severity: 'error',
      field: 'paths',
      message: 'No endpoints defined - API cannot be tested',
    });
  }

  // Check for missing summaries
  let missingSummaries = 0;
  Object.values(spec.paths || {}).forEach((pathItem: any) => {
    ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
      if (pathItem[method] && !pathItem[method].summary && !pathItem[method].description) {
        missingSummaries++;
      }
    });
  });

  if (missingSummaries > 0) {
    issues.push({
      severity: 'warning',
      field: 'paths',
      message: `${missingSummaries} endpoint(s) missing summary/description`,
    });
  }

  return issues;
}
```

#### 5.2.2 Enhanced RegisterApiDrawer

**Changes to Step Flow:**

```typescript
// Change step order - spec upload FIRST
const STEPS = [
  { id: 1, title: 'Upload Specification', description: 'Import or paste OpenAPI spec' },
  { id: 2, title: 'Review & Customize', description: 'Confirm auto-filled data' },
  { id: 3, title: 'Authentication', description: 'Configure auth (optional)' },
  { id: 4, title: 'Submit', description: 'Register API' },
];

// Add inferred data state
const [inferredData, setInferredData] = useState<InferredData | null>(null);

// On spec upload/paste
const handleSpecParsed = async (specContent: string) => {
  try {
    // Parse spec
    let parsed;
    try {
      parsed = JSON.parse(specContent);
    } catch {
      const yaml = await import('yaml');
      parsed = yaml.parse(specContent);
    }

    // Validate OpenAPI format
    if (!parsed.openapi && !parsed.swagger) {
      throw new Error('Not a valid OpenAPI specification');
    }

    // Infer all data
    const inferred = inferAllData(parsed);
    setInferredData(inferred);

    // Auto-fill form fields
    if (inferred.name) updateFormData('name', inferred.name);
    if (inferred.version) updateFormData('version', inferred.version);
    if (inferred.description) updateFormData('description', inferred.description);
    if (inferred.primaryServerUrl) updateFormData('endpoint', inferred.primaryServerUrl);
    if (inferred.tags.length > 0) updateFormData('tags', inferred.tags);
    if (inferred.servers.length > 0) updateFormData('servers', inferred.servers);
    if (inferred.auth) updateFormData('auth', inferred.auth);

    // Update spec source tracking
    updateFormData('inferredFields', {
      name: !!inferred.name,
      version: !!inferred.version,
      description: !!inferred.description,
      endpoint: !!inferred.primaryServerUrl,
      tags: inferred.tags.length > 0,
      auth: !!inferred.auth,
    });

    // Show success message
    toast.success(
      `Inferred ${inferred.fieldsPopulated}/${inferred.totalFields} fields from spec (${inferred.confidence} confidence)`
    );

    // Show validation issues if any
    if (inferred.validationIssues.length > 0) {
      const errors = inferred.validationIssues.filter(i => i.severity === 'error');
      if (errors.length > 0) {
        toast.warning(`${errors.length} issue(s) found in spec`);
      }
    }
  } catch (error) {
    toast.error(`Failed to parse spec: ${error.message}`);
  }
};
```

#### 5.2.3 Enhanced Metadata Schema

```typescript
// Update OpenApiDocument metadata
export interface SpecMetadata {
  score: number;
  tags: string[];
  workspaceType: WorkspaceType;
  syncStatus: SyncStatus;
  isDiscoverable: boolean;

  // NEW: Try It Out Support
  servers?: ServerConfig[];          // Multiple server URLs
  defaultAuth?: AuthConfig;          // Default authentication
  inferredFields?: string[];         // Which fields were auto-filled
  specQuality?: {
    confidence: 'high' | 'medium' | 'low';
    endpointCount: number;
    hasAuth: boolean;
    hasMultipleServers: boolean;
    validationIssues: number;
  };
}

export interface ServerConfig {
  url: string;
  description?: string;
  variables?: Record<string, any>;
  isDefault: boolean;
}

export interface AuthConfig {
  type: 'none' | 'api-key' | 'bearer' | 'basic';
  scheme?: string;              // 'bearer', 'basic'
  bearerFormat?: string;        // 'JWT'
  keyLocation?: 'header' | 'query' | 'cookie';
  keyName?: string;             // 'X-API-Key'
  description?: string;
  // Actual credentials stored in secrets table
}
```

#### 5.2.4 Manual Endpoint Creation UI

**For users who don't upload a spec:**

```tsx
// In SpecUploadStepInline
{!formData.openapiSpec.content && (
  <div className="mt-6 p-4 border border-border rounded-lg bg-muted/30">
    <h3 className="text-sm font-semibold mb-2">Manual Endpoint Definition</h3>
    <p className="text-xs text-muted-foreground mb-4">
      Define at least one endpoint to enable API testing. You can add more later in the editor.
    </p>

    {formData.manualEndpoints.map((endpoint, idx) => (
      <div key={idx} className="flex gap-2 mb-2">
        <select
          value={endpoint.method}
          onChange={(e) => updateEndpoint(idx, 'method', e.target.value)}
          className="w-24 px-2 py-1.5 text-sm border border-border rounded"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>

        <input
          type="text"
          value={endpoint.path}
          onChange={(e) => updateEndpoint(idx, 'path', e.target.value)}
          placeholder="/users"
          className="flex-1 px-3 py-1.5 text-sm border border-border rounded"
        />

        <input
          type="text"
          value={endpoint.summary}
          onChange={(e) => updateEndpoint(idx, 'summary', e.target.value)}
          placeholder="List users"
          className="flex-1 px-3 py-1.5 text-sm border border-border rounded"
        />

        {formData.manualEndpoints.length > 1 && (
          <button
            onClick={() => removeEndpoint(idx)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    ))}

    <button
      onClick={addEndpoint}
      className="mt-2 px-3 py-1.5 text-sm text-primary border border-primary rounded hover:bg-primary/10"
    >
      + Add Endpoint
    </button>
  </div>
)}
```

**Spec Generation from Manual Endpoints:**

```typescript
// In handleSubmit
if (!specContent && formData.manualEndpoints.length > 0) {
  const paths: any = {};

  formData.manualEndpoints.forEach((endpoint) => {
    if (!endpoint.path || !endpoint.method) return;

    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {};
    }

    paths[endpoint.path][endpoint.method.toLowerCase()] = {
      summary: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      operationId: `${endpoint.method.toLowerCase()}${endpoint.path.replace(/\//g, '_')}`,
      responses: {
        '200': {
          description: 'Successful response',
        },
      },
    };
  });

  const yaml = await import('yaml');
  specContent = yaml.stringify({
    openapi: '3.1.0',
    info: {
      title: formData.name,
      version: formData.version,
      description: formData.description,
    },
    servers: [
      {
        url: formData.endpoint,
        description: 'Default server',
      },
    ],
    paths,
  });
}
```

---

## 6. Implementation Plan

### 6.1 Phase 1: Auto-Inference & Validation (Week 1)

**Sprint Goals:**
- Parse specs and auto-fill form fields
- Add strict URL validation
- Support manual endpoint creation

**Tasks:**

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 1.1 | Create `spec-inference.ts` utility | 2 days | Backend |
| 1.2 | Update RegisterApiDrawer step order | 1 day | Frontend |
| 1.3 | Add spec analysis card UI | 1 day | Frontend |
| 1.4 | Implement URL validation | 0.5 days | Backend |
| 1.5 | Add manual endpoint creation UI | 1 day | Frontend |
| 1.6 | Generate specs from manual endpoints | 1 day | Backend |
| 1.7 | Unit tests for inference logic | 1 day | QA |
| 1.8 | Integration tests | 1 day | QA |

**Acceptance Criteria:**
- [ ] Uploading spec auto-fills all available fields
- [ ] Fields show "✓ From spec" badges
- [ ] Invalid URLs are rejected with clear error messages
- [ ] Users can define endpoints manually if no spec
- [ ] Generated specs have valid paths with defined endpoints
- [ ] 100% test coverage for `inferAllData()`

**Success Metrics:**
- Spec inference accuracy: >95%
- URL validation error rate: <5%
- User registration time: <60 seconds (from 3-5 minutes)

---

### 6.2 Phase 2: Authentication Support (Week 2)

**Sprint Goals:**
- Detect auth from specs
- Store encrypted credentials
- Pre-populate Try It Out auth

**Tasks:**

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 2.1 | Implement auth inference logic | 1 day | Backend |
| 2.2 | Add Authentication step to wizard | 2 days | Frontend |
| 2.3 | Integrate Web Crypto API for encryption | 2 days | Backend |
| 2.4 | Update secrets storage schema | 0.5 days | Backend |
| 2.5 | Pre-populate auth in Try It Out | 1 day | Frontend |
| 2.6 | Add credential management UI | 1 day | Frontend |
| 2.7 | Security audit | 1 day | Security |
| 2.8 | Testing & documentation | 1 day | QA |

**Acceptance Criteria:**
- [ ] Bearer token auth detected from specs
- [ ] API key auth detected with header name
- [ ] Basic auth detected
- [ ] Credentials encrypted with AES-GCM
- [ ] Try It Out pre-populates saved auth
- [ ] Users can override auth per-request
- [ ] "Clear credentials" functionality works

**Success Metrics:**
- Auth detection accuracy: >90%
- Credential save rate: >40% of registrations
- Try It Out auth setup time: <10 seconds (from manual entry each time)

---

### 6.3 Phase 3: Environment Management (Weeks 3-4)

**Sprint Goals:**
- Support multiple server environments
- Variable substitution
- Environment switching in Try It Out

**Tasks:**

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 3.1 | Design environment schema | 2 days | Backend |
| 3.2 | Build environment CRUD UI | 3 days | Frontend |
| 3.3 | Implement variable substitution | 2 days | Backend |
| 3.4 | Add environment selector to Try It Out | 2 days | Frontend |
| 3.5 | Migration for existing specs | 1 day | Backend |
| 3.6 | Testing & documentation | 2 days | QA |

**Acceptance Criteria:**
- [ ] Users can define environments (Dev, Staging, Prod)
- [ ] Variables work in URLs: `{{baseUrl}}/users`
- [ ] Variables work in headers: `Authorization: {{apiKey}}`
- [ ] Environment switching persists across sessions
- [ ] Existing specs migrated without issues

**Success Metrics:**
- Environment usage rate: >30% of APIs
- Variable substitution error rate: <2%
- User satisfaction with multi-env testing: >4/5

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
describe('Spec Inference', () => {
  describe('inferAllData()', () => {
    it('should infer all fields from complete Stripe spec', () => {
      const spec = parseYAML(STRIPE_SPEC_FIXTURE);
      const inferred = inferAllData(spec);

      expect(inferred.name).toBe('Stripe API');
      expect(inferred.version).toBe('2023-10-16');
      expect(inferred.primaryServerUrl).toBe('https://api.stripe.com');
      expect(inferred.auth?.type).toBe('bearer');
      expect(inferred.auth?.bearerFormat).toBe('JWT');
      expect(inferred.tags).toContain('payment_intents');
      expect(inferred.endpointCount).toBeGreaterThan(400);
      expect(inferred.confidence).toBe('high');
      expect(inferred.fieldsPopulated).toBe(10);
    });

    it('should handle minimal spec with only info', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'Minimal API', version: '1.0.0' },
        paths: {},
      };
      const inferred = inferAllData(spec);

      expect(inferred.name).toBe('Minimal API');
      expect(inferred.version).toBe('1.0.0');
      expect(inferred.endpointCount).toBe(0);
      expect(inferred.confidence).toBe('low');
      expect(inferred.validationIssues).toContainEqual(
        expect.objectContaining({
          severity: 'error',
          message: expect.stringContaining('No servers defined'),
        })
      );
    });

    it('should infer API key auth from GitHub spec', () => {
      const spec = parseYAML(GITHUB_SPEC_FIXTURE);
      const inferred = inferAllData(spec);

      expect(inferred.auth?.type).toBe('api-key');
      expect(inferred.auth?.keyLocation).toBe('header');
      expect(inferred.auth?.keyName).toBe('Authorization');
    });

    it('should prioritize production server over dev', () => {
      const spec = {
        openapi: '3.1.0',
        info: { title: 'Test API' },
        servers: [
          { url: 'https://dev.api.com', description: 'Development' },
          { url: 'https://api.com', description: 'Production' },
        ],
      };
      const inferred = inferAllData(spec);

      expect(inferred.primaryServerUrl).toBe('https://api.com');
    });
  });

  describe('URL Validation', () => {
    it('should reject relative paths', () => {
      expect(validateEndpoint('/api/v1')).toEqual({
        valid: false,
        error: 'Must be a complete URL including protocol and hostname',
      });
    });

    it('should reject partial URLs without protocol', () => {
      expect(validateEndpoint('api.stripe.com')).toEqual({
        valid: false,
        error: 'Must be a complete URL including protocol and hostname',
      });
    });

    it('should reject non-HTTP protocols', () => {
      expect(validateEndpoint('ftp://example.com')).toEqual({
        valid: false,
        error: 'Only HTTP and HTTPS protocols are allowed',
      });
    });

    it('should accept valid HTTPS URLs', () => {
      expect(validateEndpoint('https://api.stripe.com')).toEqual({
        valid: true,
      });
    });

    it('should accept HTTP for localhost', () => {
      expect(validateEndpoint('http://localhost:3000')).toEqual({
        valid: true,
      });
    });
  });
});
```

### 7.2 Integration Tests

```typescript
describe('RegisterApiDrawer with Auto-Inference', () => {
  it('should auto-fill fields when spec uploaded', async () => {
    const { user } = renderWithRouter(<RegisterApiDrawer isOpen={true} />);

    // Upload Stripe spec
    const file = new File([STRIPE_SPEC_YAML], 'stripe.yaml', { type: 'text/yaml' });
    const input = screen.getByLabelText(/upload/i);
    await user.upload(input, file);

    // Wait for parsing
    await waitFor(() => {
      expect(screen.getByText('✓ OpenAPI 3.1.0 Spec Parsed')).toBeInTheDocument();
    });

    // Verify auto-filled fields
    expect(screen.getByDisplayValue('Stripe API')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2023-10-16')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://api.stripe.com')).toBeInTheDocument();

    // Verify badges
    expect(screen.getAllByText('✓ From spec')).toHaveLength(6);

    // Verify summary
    expect(screen.getByText(/47 endpoints/i)).toBeInTheDocument();
    expect(screen.getByText(/Bearer Token/i)).toBeInTheDocument();
    expect(screen.getByText(/High confidence/i)).toBeInTheDocument();
  });

  it('should allow manual endpoint creation when no spec', async () => {
    const { user } = renderWithRouter(<RegisterApiDrawer isOpen={true} />);

    // Fill basic info
    await user.type(screen.getByLabelText(/API Name/i), 'Test API');
    await user.type(screen.getByLabelText(/Version/i), '1.0.0');
    await user.type(screen.getByLabelText(/Base URL/i), 'https://api.test.com');

    // Skip spec upload, go to manual endpoints
    await user.click(screen.getByText(/Next/i));

    // Add manual endpoint
    await user.click(screen.getByText(/Add Endpoint/i));
    await user.selectOptions(screen.getByLabelText(/Method/i), 'GET');
    await user.type(screen.getByPlaceholderText(/\/users/i), '/users');
    await user.type(screen.getByPlaceholderText(/List users/i), 'Get all users');

    // Submit
    await user.click(screen.getByText(/Register API/i));

    // Verify spec was generated
    await waitFor(() => {
      expect(screen.getByText(/API registered successfully/i)).toBeInTheDocument();
    });

    // Verify generated spec has endpoint
    const specs = await idbStorage.getAllSpecs();
    const testSpec = specs.find(s => s.title === 'Test API');
    const parsed = yaml.parse(testSpec.content);

    expect(parsed.paths['/users']).toBeDefined();
    expect(parsed.paths['/users'].get).toBeDefined();
    expect(parsed.paths['/users'].get.summary).toBe('Get all users');
  });
});
```

### 7.3 E2E Tests (Playwright)

```typescript
test('complete registration and test flow', async ({ page }) => {
  await page.goto('/catalog');
  await page.click('text=Register New API');

  // Step 1: Upload spec
  await page.setInputFiles('input[type="file"]', 'fixtures/stripe-api.yaml');
  await expect(page.locator('text=✓ OpenAPI 3.1.0 Spec Parsed')).toBeVisible();
  await expect(page.locator('text=High confidence')).toBeVisible();

  // Verify auto-filled fields
  await expect(page.locator('input[name="name"]')).toHaveValue('Stripe API');
  await expect(page.locator('input[name="endpoint"]')).toHaveValue('https://api.stripe.com');

  // Step 2: Review (all fields pre-filled)
  await page.click('text=Next');
  await expect(page.locator('text=✓ From spec')).toHaveCount(6);

  // Step 3: Auth (pre-filled from spec)
  await page.click('text=Next');
  await expect(page.locator('select[name="authType"]')).toHaveValue('bearer');
  await page.fill('input[name="token"]', 'test_token_123');

  // Step 4: Submit
  await page.click('text=Register API');
  await expect(page.locator('text=API registered successfully')).toBeVisible();

  // Open editor
  await page.click('text=Stripe API');
  await expect(page).toHaveURL(/\/editor\/.+/);

  // Try It Out
  await page.click('text=Try It Out');
  await expect(page.locator('text=API Testing Console')).toBeVisible();

  // Verify pre-populated auth
  await page.click('text=Authorization');
  await expect(page.locator('select[name="authType"]')).toHaveValue('bearer');
  await expect(page.locator('input[type="password"]')).toHaveValue('test_token_123');

  // Send test request
  await page.click('button:has-text("Send")');
  await expect(page.locator('text=Status: 200')).toBeVisible({ timeout: 10000 });
});
```

---

## 8. Success Metrics

### 8.1 User Experience Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Registration completion rate | Unknown | >90% | Analytics |
| Time to register API | 3-5 min | <60 sec | Analytics |
| Fields manually entered | 7 | 1-2 | Code tracking |
| Try It Out usage rate | 0% | >70% | Analytics |
| Registration errors | High | <5% | Error logs |

### 8.2 Data Quality Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Invalid URLs submitted | High | <5% | Validation logs |
| APIs with testable endpoints | 0% | >95% | Database query |
| Auth configuration save rate | 0% | >40% | Database query |
| Spec quality (confidence) | Low | >70% high | Inference logs |

### 8.3 Technical Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Spec inference accuracy | N/A | >95% | Unit tests |
| Auto-fill success rate | N/A | >90% | Analytics |
| Try It Out request success rate | Unknown | >80% | API logs |
| Encryption/decryption errors | N/A | <1% | Error logs |

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Spec parsing failures | High | Medium | Robust error handling, fallback to manual |
| Inference inaccuracy | Medium | Low | Extensive test fixtures, allow manual override |
| Encryption key management | High | Low | Use browser crypto API, document key rotation |
| Performance on large specs | Medium | Medium | Lazy parsing, incremental inference |

### 9.2 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Users confused by auto-fill | Medium | Low | Clear "From spec" badges, allow override |
| Users don't trust auto-inference | Medium | Medium | Show confidence scores, validation summary |
| Breaking changes to existing flow | High | Low | Maintain backward compatibility, gradual rollout |

---

## 10. Rollout Plan

### 10.1 Phased Rollout

**Week 1-2: Internal Testing**
- Deploy to staging environment
- Team uses feature for real API registrations
- Gather feedback, fix critical bugs

**Week 3: Beta Release (10% users)**
- Enable for 10% of users via feature flag
- Monitor metrics, error rates
- Collect user feedback surveys

**Week 4: Gradual Rollout (50% users)**
- Increase to 50% of users
- Compare metrics between old/new flows
- Address any issues

**Week 5: Full Release (100% users)**
- Enable for all users
- Announce new features in changelog
- Deprecate old flow

### 10.2 Rollback Plan

**Criteria for Rollback:**
- Registration completion rate drops >20%
- Critical bugs affecting >5% of users
- Data corruption or security issues

**Rollback Steps:**
1. Disable feature flag
2. Revert to previous step order
3. Investigate root cause
4. Fix issues in staging
5. Re-test before re-enabling

---

## 11. Open Questions

### 11.1 Technical Questions

1. **Q: Should we support Swagger 2.0 specs or only OpenAPI 3.x?**
   - **A:** Support both - use `swagger2openapi` library to convert 2.0 to 3.x

2. **Q: What if spec is too large (>5MB)?**
   - **A:** Implement streaming parser, only extract `info` and `servers` sections initially

3. **Q: How to handle specs with 10+ servers?**
   - **A:** Show first 3 servers + "View all" expandable section

4. **Q: Store inferred vs. manual metadata separately?**
   - **A:** Yes - add `inferredFields` array to track data source per field

### 11.2 UX Questions

1. **Q: If user manually enters data then uploads spec with different values, which wins?**
   - **A:** Show conflict resolution prompt with side-by-side comparison, let user choose

2. **Q: Should inference be mandatory or optional?**
   - **A:** Optional - show "Skip auto-fill" button if users prefer manual entry

3. **Q: How to handle partial specs (missing critical fields)?**
   - **A:** Show low confidence warning, prompt user to fill missing fields manually

---

## 12. Conclusion

### 12.1 Summary

The Try It Out feature is currently **unusable for APIs registered without complete OpenAPI specs** due to three critical gaps:

1. **No auto-inference** - Users manually re-enter data that exists in uploaded specs
2. **No URL validation** - Invalid base URLs break API testing
3. **No endpoint creation** - Generated specs have empty `paths: {}` with nothing to test

### 12.2 Recommended Solution

**Implement auto-inference in 3 phases:**

**Phase 1 (Week 1):** Auto-fill form fields from specs, add URL validation, support manual endpoints
- **Impact:** Makes Try It Out usable for 100% of users
- **Effort:** 8 days
- **ROI:** High - unblocks critical feature

**Phase 2 (Week 2):** Capture and store authentication configuration
- **Impact:** Reduces auth setup time from minutes to seconds
- **Effort:** 8 days
- **ROI:** High - improves testing UX

**Phase 3 (Weeks 3-4):** Add environment management (dev/staging/prod)
- **Impact:** Enables multi-environment testing
- **Effort:** 12 days
- **ROI:** Medium - nice-to-have for power users

### 12.3 Expected Outcomes

**User Experience:**
- ✅ 80% reduction in registration time (5 min → 60 sec)
- ✅ 70-85% fewer fields to fill manually (7 → 1-2)
- ✅ Try It Out usage increases from 0% to >70%

**Data Quality:**
- ✅ 90% reduction in registration errors
- ✅ 100% of registered APIs have valid, testable endpoints
- ✅ Consistent, accurate metadata from authoritative source (spec)

**Developer Productivity:**
- ✅ Faster API onboarding for testing
- ✅ Reduced support tickets ("Why can't I test my API?")
- ✅ Higher feature adoption and user satisfaction

---

## Appendix A: Example Specs

### A.1 Complete Spec (High Confidence)

```yaml
openapi: 3.1.0
info:
  title: Stripe API
  version: 2023-10-16
  description: The Stripe REST API for payments
  contact:
    email: support@stripe.com
servers:
  - url: https://api.stripe.com
    description: Production
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
tags:
  - name: payment_intents
  - name: customers
paths:
  /v1/payment_intents:
    post:
      summary: Create a payment intent
      tags: [payment_intents]
      responses:
        '200':
          description: Success
```

**Inferred Data:**
- Name: "Stripe API" ✓
- Version: "2023-10-16" ✓
- Description: "The Stripe REST API..." ✓
- Base URL: "https://api.stripe.com" ✓
- Auth: Bearer Token (JWT) ✓
- Tags: ["payment_intents", "customers"] ✓
- Endpoints: 1 ✓
- **Confidence: High (7/7 fields)**

---

### A.2 Minimal Spec (Low Confidence)

```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
paths: {}
```

**Inferred Data:**
- Name: "My API" ✓
- Version: "1.0.0" ✓
- Description: ❌ Missing
- Base URL: ❌ Missing (no servers)
- Auth: ❌ Not configured
- Tags: ❌ Empty
- Endpoints: 0 ❌
- **Confidence: Low (2/7 fields)**
- **Validation Issues:**
  - ⚠️ No servers defined
  - ⚠️ No endpoints defined

---

## Appendix B: References

- **OpenAPI 3.1.0 Specification:** https://spec.openapis.org/oas/v3.1.0
- **OWASP Top 10 2025:** https://owasp.org/Top10/
- **Web Crypto API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **SSRF Prevention:** https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

---

**Document Status:** Ready for Review
**Next Steps:** Team review → Approve → Begin Phase 1 implementation
**Questions:** Contact development team
