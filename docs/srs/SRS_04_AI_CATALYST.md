# SRS 04: AI Catalyst (The Generator)

## 1. Overview
The AI Catalyst solves the "Blank Page Problem." It allows users to bootstrap entire API specifications or specific components using natural language prompts, leveraging free-tier AI models.

**Feature Module**: `features/ai-catalyst/` (see MVP_ARCHITECTURE.md § 4)

## 2. Functional Requirements

### 2.1 Integration Strategy

#### 2.1.1 Provider Selection (2026 Research-Based)
Based on comprehensive comparison of free-tier AI providers ([Groq Rate Limits](https://console.groq.com/docs/rate-limits), [Gemini API Quotas 2026](https://www.aifreeapi.com/en/posts/gemini-api-pricing-and-quotas), [Free Tier Comparison](https://www.aifreeapi.com/en/posts/best-gemini-api-alternative-free-tier)):

**Primary Provider: Groq (Llama 3.3 70B)**
- **Rate Limits**: 14,400 requests/day, 70K tokens/minute
- **Speed**: 276 tokens/second ([Artificial Analysis Benchmark](https://groq.com/blog/new-ai-inference-speed-benchmark-for-llama-3-3-70b-powered-by-groq))
- **Context**: 128K tokens
- **Cost**: Free tier (no credit card)
- **Rationale**: Highest daily quota + fastest inference speed for responsive UX

**Secondary Provider: Google Gemini 2.5 Flash**
- **Rate Limits**: 5-15 RPM, 100-1,000 requests/day (after Dec 2025 quota reduction)
- **Context**: 1M tokens (huge context window for complex specs)
- **Cost**: Free tier
- **Rationale**: Fallback with superior context window for large spec generation

**Tertiary (Future): OpenRouter**
- **Models**: 30+ free models
- **Rationale**: Aggregator for multi-provider resilience (v2 feature)

#### 2.1.2 Circuit Breaker Pattern
Automatically switch providers on failure to ensure reliability:

**Failure Detection**:
- **429 Too Many Requests**: Rate limit exceeded
- **500/503**: Service unavailable
- **Timeout**: > 30s without response
- **Consecutive Failures**: 3 errors in a row

**Switching Logic**:
1. Start with Groq (primary)
2. If Groq fails 3 times consecutively → Switch to Gemini (secondary)
3. If Gemini fails 3 times → Disable AI Catalyst temporarily
4. Reset counters every 5 minutes (allow retry after cooldown)

**Circuit Breaker States**:
- **Closed**: Normal operation, routing to primary (Groq)
- **Open**: Provider failed, routed to fallback (Gemini)
- **Half-Open**: After cooldown, test primary again with 1 request

#### 2.1.3 Quota Management
Client-side rate limiting to prevent 429 errors:

**Token Bucket Algorithm**:
```
Groq: 14,400 tokens/day (10 requests/minute average)
Gemini: 100 requests/day (4 requests/hour)

Refill Rate: Reset daily at 00:00 Pacific Time
Bucket Size: Daily limit
Current Usage: Stored in localStorage with timestamp
```

**Quota Warning UI**:
- Show banner when 80% quota consumed: "Approaching daily limit (120/150 requests used)"
- Block requests when 100% consumed: "Daily quota reached. Resets in 4h 23m."
- Allow override for paid API keys (user-provided keys bypass quota)

#### 2.1.4 API Key Management
- **Storage**: IndexedDB `secrets` store (encrypted with Web Crypto API)
- **Scope**: Per-provider keys (Groq key, Gemini key)
- **Fallback**: If user provides no key, use free tier with quota limits
- **Override**: User-provided keys bypass quota management (unlimited)
- **Security**: Never send keys to YASP servers (client-direct API calls only)

### 2.2 "Magic" Features

#### 2.2.1 Prompt-to-Spec
**Use Case**: Generate complete OpenAPI spec from natural language.

**Input Example**:
```
"Create a Kanban API with:
- Boards (CRUD)
- Columns within boards
- Cards within columns (with assignee, due date)
- Authentication via Bearer token"
```

**Output**: Full OpenAPI 3.1 spec with:
- `info`, `servers`, `security` schemas
- All CRUD endpoints (`GET /boards`, `POST /boards`, etc.)
- Request/response schemas in `components`
- Example values for all fields

**System Prompt** (optimized for OpenAPI):
```
You are an OpenAPI 3.1 specification generator. Generate valid YAML specs.
Rules:
1. Use OpenAPI 3.1.0 format
2. Include complete schemas in components/schemas
3. Add example values for all fields
4. Use standard HTTP status codes (200, 201, 400, 401, 404, 500)
5. Include security schemes (bearer, apiKey, oauth2)
6. Add descriptions to all endpoints and schemas
7. Output ONLY valid YAML (no markdown, no explanations)
```

#### 2.2.2 Prompt-to-Schema
**Use Case**: Generate schema object for insertion into existing spec.

**Input Example**:
```
"A User profile with email (required), avatar URL, role enum (admin, editor, viewer), and last login timestamp"
```

**Output**: JSON Schema object:
```yaml
User:
  type: object
  required:
    - email
  properties:
    email:
      type: string
      format: email
      example: "user@example.com"
    avatarUrl:
      type: string
      format: uri
      example: "https://example.com/avatar.jpg"
    role:
      type: string
      enum: [admin, editor, viewer]
      example: "editor"
    lastLogin:
      type: string
      format: date-time
      example: "2026-01-24T10:30:00Z"
```

**Insertion**: User places cursor in Visual Editor schema node → AI inserts at cursor position.

#### 2.2.3 Refinement
**Use Case**: Enhance existing spec sections with AI suggestions.

**Input Example**:
```
User selects "POST /users" operation
Prompt: "Add comprehensive error responses (400, 401, 404, 500) with detailed schemas"
```

**Output**: Augmented operation with error responses:
```yaml
responses:
  '201':
    description: User created successfully
    content: { ... }
  '400':
    description: Invalid request body
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
        example:
          message: "Email is required"
          code: "VALIDATION_ERROR"
  '401':
    description: Unauthorized (missing or invalid token)
    ... (etc)
```

### 2.3 Validation Loop

#### 2.3.1 Generation → Validation Pipeline
Ensure AI output is valid OpenAPI before insertion ([Spectral Best Practices](https://blog.axway.com/learning-center/apis/api-design/api-linting-with-spectral)):

**Step 1: Generate** (AI Provider → Raw YAML)
- Call Groq/Gemini with system prompt + user prompt
- Receive streamed response (or single response)
- Parse as YAML/JSON

**Step 2: Validate** (Spectral Linting)
- Run generated content through Spectral worker (background)
- Check for:
  - YAML syntax errors
  - OpenAPI schema violations
  - Missing required fields

**Step 3: Auto-Repair (If Errors Detected)**
- **Attempt 1**: Simple fixes (add missing `openapi: 3.1.0` field)
- **Attempt 2**: Re-prompt AI with error feedback:
  ```
  "Previous output had errors:
  - Line 12: Missing required field 'responses'
  - Line 34: Invalid type for 'parameters' (expected array)

  Please regenerate with these issues fixed."
  ```
- **Max Retries**: 1 auto-repair attempt

**Step 4: Present to User**
- **If Valid**: Show preview modal with "Insert into Editor" button
- **If Invalid After Repair**: Show "Generated with Errors" modal:
  - Display AI output with highlighted errors
  - Options: "Fix Manually" | "Regenerate" | "Cancel"
  - User can edit in modal before inserting

#### 2.3.2 UX Flow Diagram
```
User Prompt
    ↓
[AI Generate] (show loading spinner with streaming tokens)
    ↓
[Spectral Validate] (Show: "Validating against OpenAPI 3.1 rules...")
    ↓
   Valid? ────┬──Yes→ [Preview Modal: "Insert" button]
              │
              └──No→ [Auto-Repair] (Show: "Found 3 errors. Auto-fixing...")
                        ↓
                       Valid? ────┬──Yes→ [Preview Modal: "Fixed 3 issues automatically"]
                                  │
                                  └──No→ [Error Modal: "Generated with errors. Fix manually?"]
```

**Transparency Principle**:
Unlike "magic" tools that hide the cleanup, YASP builds trust by **showing the governance work**.
- **Status Indicators**: "Validating...", "Fixing Schema...", "Linting Passed"
- **Reasoning**: Reinforces that YASP is an *ENGINEER* tool that cares about correctness, not just a text generator.

### 2.4 Security & Privacy

#### 2.4.1 PII Warning
Before first AI generation, show modal:
```
⚠️ Privacy Notice

AI-generated content is processed by third-party APIs:
- Groq (Llama 3.3 70B)
- Google Gemini

Do NOT include sensitive data in prompts:
❌ Real user emails, passwords, API keys
❌ Internal system details, IP addresses
❌ Confidential business logic

✅ Use placeholder/example values
✅ Generic descriptions

[ ] Don't show this again
[Cancel] [I Understand, Continue]
```

**Storage**: Save user acceptance in localStorage (`ai_privacy_accepted: true`).

#### 2.4.2 Output Sanitization
Prevent XSS attacks from AI-generated content:
- **Parse as YAML**: Ensure structured data (no arbitrary HTML/JS)
- **DOMPurify**: Sanitize description fields before rendering in UI
- **Content Security Policy**: Block inline scripts in rendered previews

## 3. Technical Implementation

### 3.1 Plugin Architecture
**Location**: `plugins/generators/` (see MVP_ARCHITECTURE.md § 5)

**Plugins**:
- `groq-generator.plugin.ts` (Llama 3.3 70B)
- `gemini-generator.plugin.ts` (Gemini 2.5 Flash)
- `template-generator.plugin.ts` (Static templates, no AI)

**Interface**:
```typescript
interface GeneratorPlugin {
  id: string;
  name: string;
  provider: 'groq' | 'gemini' | 'template';

  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  estimateTokens(prompt: string): number;
  checkQuota(): Promise<QuotaStatus>;

  onLoad(context: PluginContext): void;
  onUnload(): void;
}
```

### 3.2 State Management
**Store**: `features/ai-catalyst/store/ai.store.ts` (Zustand)

**State Shape**:
```typescript
interface AiState {
  activeProvider: 'groq' | 'gemini';
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  quotaUsage: { groq: number; gemini: number };
  quotaResetAt: Date;
  isGenerating: boolean;
  streamedTokens: string;
  lastError: string | null;

  // Actions
  generate: (prompt: string, type: 'spec' | 'schema' | 'refinement') => Promise<string>;
  switchProvider: (provider: 'groq' | 'gemini') => void;
  resetCircuitBreaker: () => void;
}
```

### 3.3 Streaming UX
Show real-time token generation for responsive UX:
- Display loading modal with typewriter effect
- Stream tokens from Groq (fast: 276 tokens/sec)
- Show progress: "Generating... 234 tokens"
- Cancel button sends abort signal to API

## 4. Performance Constraints

### 4.1 Latency Targets
- **Time to First Token**: < 2s (Groq typically 0.5s)
- **Streaming Speed**: 200+ tokens/second (Groq benchmark)
- **Total Generation**: < 30s for full spec (abort after 60s)

### 4.2 Context Limits
- **Groq**: 128K tokens (sufficient for most specs)
- **Gemini**: 1M tokens (use for very large specs)
- **Prompt Optimization**: Keep system prompts < 500 tokens

## 5. Error Handling

### 5.1 Error Taxonomy
- **Network Errors**: Connection timeout, DNS failure
- **Rate Limit (429)**: Quota exceeded → Trigger circuit breaker
- **Invalid Output**: YAML parse errors → Auto-repair attempt
- **API Quota Exhausted**: Show quota reset countdown

### 5.2 User-Friendly Messages
- `❌ Rate limit reached. Try again in 14 minutes.`
- `⚠️ AI generated invalid spec. Attempting to fix...`
- `✅ Spec generated successfully! Review before inserting.`

## 6. Testing Requirements

### 6.1 Unit Tests
- Circuit breaker state transitions
- Quota calculation (token bucket algorithm)
- Output sanitization (XSS prevention)

### 6.2 Integration Tests
- Mock Groq/Gemini API responses
- Test provider failover (Groq → Gemini)
- Validate Spectral integration (AI output → lint → repair)

### 6.3 E2E Tests
- Full prompt-to-spec flow (with real API)
- Error recovery (invalid YAML → repair → insert)

## 7. References
- [Groq Llama 3.3 Benchmark](https://groq.com/blog/new-ai-inference-speed-benchmark-for-llama-3-3-70b-powered-by-groq)
- [Gemini API Rate Limits 2026](https://www.aifreeapi.com/en/posts/gemini-api-rate-limit-explained)
- [Free Tier AI Comparison](https://www.aifreeapi.com/en/posts/best-gemini-api-alternative-free-tier)
- [Spectral API Linting](https://blog.axway.com/learning-center/apis/api-design/api-linting-with-spectral)
- [Groq Rate Limits](https://console.groq.com/docs/rate-limits)
