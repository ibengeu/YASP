# AI Quick Fix - Product Requirements Document

## Executive Summary

The AI Quick Fix feature aims to help users automatically fix OpenAPI specification validation errors using AI. Currently, the implementation has critical issues preventing it from working reliably.

---

## Problem Statement

### Current Issues

1. **String Replacement Fails**: The AI returns code snippets that don't match the actual spec content, causing `string.replace()` to fail silently
2. **Context Extraction Insufficient**: Only sending 3 lines before/after the error doesn't give AI enough context
3. **Format Inconsistency**: AI might return YAML when spec is JSON, or vice versa
4. **Indentation Mismatches**: AI doesn't preserve exact indentation, causing replacement to fail
5. **No Verification**: Applied fixes aren't verified before being shown to user
6. **Diagnostic Path Not Used**: We have the exact path to the error but don't use it for precise fixes

### Root Cause Analysis

**Why String Replacement Fails:**
```typescript
// Current approach (BROKEN):
const newContent = content.replace(
  quickFix.originalCode,  // AI's guess at what the code looks like
  quickFix.fixedCode       // AI's fixed version
);
// Problem: originalCode rarely matches actual content exactly
```

**Example Failure:**
```yaml
# Actual spec:
info:
  title: My API
  version: 1.0.0  # <-- Missing description

# AI returns:
originalCode: "  title: My API\n  version: 1.0.0"
fixedCode: "  title: My API\n  version: 1.0.0\n  description: API description"

# Replace fails because AI added trailing comment, changed whitespace, etc.
```

---

## Proposed Solution

### Approach 1: Path-Based Replacement (RECOMMENDED)

Use the diagnostic's YAML path to precisely locate and fix the error.

**Why This Works:**
- We know the exact path: `['info', 'description']`
- Can parse spec, navigate to path, apply fix
- No string matching needed
- Works for both YAML and JSON

**Implementation:**
```typescript
async function applyPathBasedFix(
  specContent: string,
  diagnostic: ISpectralDiagnostic,
  aiSuggestion: QuickFixResponse
): Promise<string> {
  // 1. Parse spec (YAML or JSON)
  const parsed = parseSpec(specContent);

  // 2. Navigate to error location using diagnostic.path
  let target = parsed;
  for (const segment of diagnostic.path.slice(0, -1)) {
    target = target[segment];
  }

  // 3. Apply AI's fix to the specific field
  const lastKey = diagnostic.path[diagnostic.path.length - 1];

  // 4. Parse AI's fixed value (extract just the value, not the whole section)
  const fixedValue = extractValueFromAIResponse(aiSuggestion.fixedCode);

  // 5. Apply the fix
  if (diagnostic.code.includes('missing-field')) {
    target[lastKey] = fixedValue; // Add missing field
  } else if (diagnostic.code.includes('invalid-type')) {
    target[lastKey] = fixedValue; // Fix type
  } else {
    target[lastKey] = fixedValue; // Generic update
  }

  // 6. Serialize back to original format
  return serializeSpec(parsed, detectedLanguage);
}
```

**Benefits:**
- ✅ No string matching required
- ✅ Preserves formatting/comments (via smart serialization)
- ✅ Works with any indentation
- ✅ Can verify fix before applying
- ✅ Handles nested structures correctly

---

### Approach 2: Enhanced String Replacement with Normalization

Improve string matching by normalizing whitespace.

**Implementation:**
```typescript
function applyNormalizedReplace(
  content: string,
  originalCode: string,
  fixedCode: string
): string {
  // Normalize whitespace for matching
  const normalizedContent = content.replace(/\s+/g, ' ');
  const normalizedOriginal = originalCode.replace(/\s+/g, ' ');

  // Find match
  const index = normalizedContent.indexOf(normalizedOriginal);
  if (index === -1) {
    throw new Error('Could not locate code to fix');
  }

  // Calculate actual positions in original content
  // ... complex logic to map back to original positions ...

  // Apply replacement
  return content.substring(0, start) + fixedCode + content.substring(end);
}
```

**Issues:**
- ⚠️ Complex to implement correctly
- ⚠️ Can still fail with similar code patterns
- ⚠️ Hard to preserve exact formatting

---

## Recommended Implementation Plan

### Phase 1: Path-Based Fix Engine (Week 1)

**1.1 Create Path-Based Fix Applier**
```typescript
// File: app/features/ai-catalyst/services/path-based-fixer.ts

export interface PathBasedFix {
  path: string[];           // ['info', 'description']
  operation: 'add' | 'update' | 'remove';
  value: any;              // The value to set
}

export class PathBasedFixer {
  async applyFix(
    specContent: string,
    format: 'yaml' | 'json',
    fix: PathBasedFix
  ): Promise<string> {
    // Implementation
  }
}
```

**1.2 Update AI Prompt to Return Path + Value**

Change AI response format:
```json
{
  "operation": "add",
  "path": ["info", "description"],
  "value": "API for managing resources",
  "explanation": "Added missing description field",
  "confidence": "high"
}
```

**1.3 Update QuickFixDialog**
- Show path being modified
- Show before/after values (not code snippets)
- Add validation step before applying

### Phase 2: Smart Context Extraction (Week 2)

**2.1 Send Full Context**
Instead of 3 lines before/after, send:
- Full parent object containing the error
- Sibling fields for reference
- Schema definition if available

**2.2 AI Prompt Improvements**
```typescript
buildUserPrompt(request: QuickFixRequest): string {
  const { diagnostic } = request;

  // Extract full parent context
  const parentPath = diagnostic.path.slice(0, -1);
  const parentObject = navigateToPath(spec, parentPath);

  return `Fix this OpenAPI error:

Error: ${diagnostic.message}
Rule: ${diagnostic.code}
Location: ${diagnostic.path.join(' → ')}

Current parent object:
${JSON.stringify(parentObject, null, 2)}

What value should "${diagnostic.path[diagnostic.path.length - 1]}" be?

Response format:
{
  "value": <the correct value>,
  "explanation": "why this fixes it"
}`;
}
```

### Phase 3: Fix Verification (Week 3)

**3.1 Pre-Apply Validation**
```typescript
async function verifyFix(
  originalContent: string,
  fixedContent: string
): Promise<VerificationResult> {
  // 1. Verify spec is still valid YAML/JSON
  try {
    parseSpec(fixedContent);
  } catch (e) {
    return { valid: false, error: 'Invalid format after fix' };
  }

  // 2. Run Spectral on fixed content
  const result = await spectralService.lintSpec(fixedContent);

  // 3. Check if original error is gone
  const originalError = /* ... */;
  const errorStillExists = result.diagnostics.some(
    d => d.code === originalError.code &&
         d.path.join('.') === originalError.path.join('.')
  );

  if (errorStillExists) {
    return { valid: false, error: 'Fix did not resolve the error' };
  }

  // 4. Check if new errors were introduced
  const newErrors = result.diagnostics.filter(
    d => d.severity === 0 // Only errors, not warnings
  ).length;

  const oldErrors = /* count from original */;

  if (newErrors > oldErrors) {
    return { valid: false, error: 'Fix introduced new errors' };
  }

  return { valid: true };
}
```

**3.2 Update UI to Show Verification**
```tsx
<QuickFixDialog>
  {/* Show verification status */}
  {verifying && <Spinner>Verifying fix...</Spinner>}
  {verificationFailed && (
    <Alert variant="error">
      Fix verification failed: {verificationError}
      <Button onClick={retryWithDifferentPrompt}>
        Try Different Fix
      </Button>
    </Alert>
  )}
</QuickFixDialog>
```

---

## Detailed Requirements

### Functional Requirements

**FR1: Fix Application**
- MUST use diagnostic path for precise location
- MUST preserve spec format (YAML/JSON)
- MUST maintain indentation and structure
- MUST handle nested objects/arrays
- SHOULD preserve comments where possible

**FR2: AI Integration**
- MUST send full parent context to AI
- MUST request structured response (path + value)
- MUST handle rate limits gracefully
- SHOULD retry on transient failures
- SHOULD cache similar fixes

**FR3: User Experience**
- MUST show exact field being modified
- MUST show before/after values
- MUST verify fix before showing to user
- SHOULD show confidence score
- SHOULD explain why fix works

**FR4: Error Handling**
- MUST detect when fix fails to apply
- MUST detect when fix introduces new errors
- MUST allow user to reject fix
- SHOULD suggest alternative fixes
- SHOULD allow manual override

### Non-Functional Requirements

**NFR1: Performance**
- Fix generation: < 5 seconds (p95)
- Fix application: < 100ms
- UI should stay responsive during fix generation

**NFR2: Reliability**
- Fix success rate: > 80% for common errors
- Zero data loss (always preserve original on failure)
- Graceful degradation on AI failure

**NFR3: Security**
- Validate all AI responses
- Prevent injection attacks via AI-crafted responses
- Rate limit AI requests per user

---

## Success Metrics

### Primary Metrics
1. **Fix Success Rate**: % of applied fixes that resolve the error
   - Target: > 80%
   - Measure: (fixes that remove diagnostic) / (total fixes applied)

2. **Fix Application Rate**: % of generated fixes that can be applied
   - Target: > 95%
   - Measure: (fixes applied without error) / (fixes generated)

3. **User Acceptance Rate**: % of fixes user accepts
   - Target: > 70%
   - Measure: (fixes accepted) / (fixes shown)

### Secondary Metrics
1. **Time to Fix**: Average time from click to resolution
   - Target: < 10 seconds

2. **Error Reduction**: Net change in diagnostic count after fix
   - Target: -1 (should remove 1 error, add 0)

3. **Retry Rate**: % of fixes that need retry
   - Target: < 20%

---

## Implementation Checklist

### Phase 1: Core Fix Engine
- [ ] Create PathBasedFixer class
- [ ] Implement YAML/JSON parsing
- [ ] Implement path navigation
- [ ] Implement value application
- [ ] Add unit tests for all path types
- [ ] Test with nested objects/arrays
- [ ] Test with both YAML and JSON

### Phase 2: AI Integration
- [ ] Update OpenRouter prompt to request path+value
- [ ] Parse AI response to extract value
- [ ] Handle AI errors gracefully
- [ ] Add retry logic
- [ ] Test with various diagnostic types
- [ ] Add integration tests

### Phase 3: Verification
- [ ] Implement fix verification
- [ ] Add Spectral re-validation
- [ ] Detect new errors
- [ ] Update UI to show verification
- [ ] Add E2E tests
- [ ] Test failure scenarios

### Phase 4: UX Polish
- [ ] Update QuickFixDialog to show path
- [ ] Show before/after values (not code)
- [ ] Add verification indicator
- [ ] Add retry button
- [ ] Improve error messages
- [ ] Add analytics tracking

---

## Migration Plan

### Step 1: Add New Path-Based Fixer (No Breaking Changes)
```typescript
// Add new implementation alongside old one
if (USE_PATH_BASED_FIX) {
  return pathBasedFixer.applyFix(content, fix);
} else {
  return content.replace(fix.originalCode, fix.fixedCode);
}
```

### Step 2: A/B Test
- Roll out to 10% of users
- Monitor success metrics
- Gather user feedback

### Step 3: Full Rollout
- Enable for 100% after validation
- Remove old string-replacement code
- Update documentation

---

## Alternative Considered: Language Server Protocol (LSP)

**Concept**: Use an OpenAPI LSP server for precise code actions.

**Pros:**
- Industry standard
- Precise locations
- IDE-quality fixes

**Cons:**
- High implementation complexity
- Requires running LSP server
- Overkill for current scope

**Decision**: Not pursuing for MVP, revisit in future.

---

## Open Questions

1. **Q**: Should we support partial fixes (fix only one field in a multi-field error)?
   **A**: Yes, always fix the minimum required to resolve the specific diagnostic.

2. **Q**: How to handle when AI suggests adding multiple fields?
   **A**: Show all changes in diff, let user accept/reject as a unit.

3. **Q**: Should we auto-apply high-confidence fixes?
   **A**: No, always require user confirmation (safety first).

4. **Q**: What if diagnostic.path is wrong/empty?
   **A**: Fall back to showing error message, disable quick fix button.

---

## Appendix A: Example Fix Flows

### Example 1: Missing Required Field

**Input:**
```yaml
openapi: 3.1.0
info:
  title: My API
  # Missing: version
```

**Diagnostic:**
```json
{
  "code": "oas3-schema",
  "message": "info object must have required property 'version'",
  "path": ["info", "version"],
  "severity": 0
}
```

**AI Response:**
```json
{
  "operation": "add",
  "path": ["info", "version"],
  "value": "1.0.0",
  "explanation": "Added required version field with semantic version format",
  "confidence": "high"
}
```

**Application:**
```typescript
// Navigate to info object
const info = parsed.info;
// Add version field
info.version = "1.0.0";
// Serialize back to YAML
```

**Result:**
```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
```

### Example 2: Invalid Type

**Input:**
```yaml
paths:
  /users:
    get:
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: array
                # Missing: items
```

**Diagnostic:**
```json
{
  "code": "oas3-schema",
  "message": "array type must define items",
  "path": ["paths", "/users", "get", "responses", "200", "content", "application/json", "schema", "items"],
  "severity": 0
}
```

**AI Response:**
```json
{
  "operation": "add",
  "path": ["paths", "/users", "get", "responses", "200", "content", "application/json", "schema", "items"],
  "value": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "name": { "type": "string" }
    }
  },
  "explanation": "Added items schema for array type. Used generic object with common user fields.",
  "confidence": "medium"
}
```

---

## Appendix B: Error Handling Matrix

| Scenario | User Experience | System Behavior |
|----------|----------------|-----------------|
| AI request fails | Show error toast: "AI service unavailable. Try again." | Log error, allow retry |
| AI returns invalid JSON | Show error: "AI response invalid. Try again." | Log response, allow retry |
| Fix fails to parse | Show error: "Generated fix invalid. Try again." | Don't apply, allow retry |
| Fix doesn't resolve error | Show warning: "Fix didn't resolve error. Review manually?" | Apply anyway if user confirms |
| Fix introduces new errors | Show error: "Fix created new errors. Reject." | Don't apply, show new errors |
| Network timeout | Show error: "Request timed out. Check connection." | Cancel request, allow retry |

---

## Timeline

- **Week 1**: Path-based fixer implementation + tests
- **Week 2**: AI integration updates + verification
- **Week 3**: UI updates + E2E tests
- **Week 4**: A/B testing + rollout

**Total**: 4 weeks to production-ready fix.

---

## Conclusion

The current string-replacement approach is fundamentally flawed. Moving to a path-based approach that leverages the diagnostic's exact location will dramatically improve reliability and user trust.

**Next Steps:**
1. Review and approve PRD
2. Create detailed technical specs for Phase 1
3. Begin implementation of PathBasedFixer
4. Set up success metrics tracking
