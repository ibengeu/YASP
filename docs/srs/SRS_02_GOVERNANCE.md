# SRS 02: Governance (The Enforcer)

## 1. Overview
Governance is the "Check Engine Light" of YASP. It runs in the background, constantly validating the API specification against industry standards to prevent "Spec Drift."

**Feature Module**: `features/governance/` (see MVP_ARCHITECTURE.md § 4)

## 2. Functional Requirements

### 2.1 Spectral Integration
- **Engine**: Run Spectral in dedicated Web Worker (`core/workers/spectral.worker.ts`).
- **Ruleset**: Bundle `spectral:oas` (OAS 3.0 & 3.1 best practices) as the default.
- **Execution Strategy**:
    - Debounce validation calls (500ms after last edit).
    - Cancel pending runs if new edits occur using `AbortController`.
    - Worker pool managed by `core/workers/worker-pool.ts`.

### 2.2 The Scoring Algorithm
- **Governance Score**: A bounded 0-100 metric calculated per spec, inspired by industry standards ([SonarQube severity levels](https://docs.sonarsource.com/sonarqube-server/10.8/user-guide/code-metrics/metrics-definition), [Codacy quality metrics](https://blog.codacy.com/code-quality-metrics)).

#### 2.2.1 Formula Design
Following code quality best practices with severity penalty multipliers:
- **Error** (Blocker/Critical): Weight = 25 (immediate fix required)
- **Warning** (Major): Weight = 5 (should be addressed)
- **Info** (Minor): Weight = 1 (nice to fix)

**Normalized Scoring Formula**:
```
totalPenalty = (errors × 25) + (warnings × 5) + (infos × 1)
maxPenalty = totalPenalty  // Current penalty
baselinePenalty = 50       // Threshold for acceptable quality

score = 100 × (1 - (totalPenalty / (totalPenalty + baselinePenalty)))
```

**Characteristics**:
- **No overflow**: Score asymptotically approaches 0 but never goes negative
- **Diminishing returns**: Each additional issue has less impact on score
- **Severity-weighted**: Errors drop score faster than warnings/infos
- **Normalized by baseline**: Penalty is relative to acceptable threshold

#### 2.2.2 Visual Indicators
- 🟢 **Success (80-100)**: Compliant, minimal issues
- 🟡 **Warning (50-79)**: Needs improvement, several issues
- 🔴 **Error (<50)**: Standard violations, immediate action required

#### 2.2.3 Score Examples

| Errors | Warnings | Infos | Total Penalty | Score | Grade |
|--------|----------|-------|---------------|-------|-------|
| 0 | 0 | 0 | 0 | 100 | 🟢 Perfect |
| 0 | 0 | 10 | 10 | 83 | 🟢 Excellent |
| 0 | 10 | 0 | 50 | 50 | 🟡 Acceptable threshold |
| 1 | 0 | 0 | 25 | 67 | 🟡 One critical error |
| 2 | 5 | 10 | 85 | 37 | 🔴 Multiple severe issues |
| 5 | 10 | 20 | 195 | 20 | 🔴 Significant violations |
| 10 | 0 | 0 | 250 | 17 | 🔴 Critical failures |

**Rationale**: This formula aligns with industry practices where:
- 1-2 errors significantly impact score (drop to 50-67)
- Mixed issues compound penalties
- Large issue counts asymptotically approach 0 without overflow

#### 2.2.4 Persistence
- **Storage**: Store calculated score in `specs.metadata.score` (IndexedDB)
- **Usage**: Library view sorts/filters by score
- **Update Trigger**: Recalculate on every lint completion

#### 2.2.5 References
- [SonarQube Code Metrics](https://docs.sonarsource.com/sonarqube-server/10.8/user-guide/code-metrics/metrics-definition)
- [Code Quality Metrics (Cortex)](https://www.cortex.io/post/measuring-and-improving-code-quality)
- [Codacy Quality Scoring](https://blog.codacy.com/code-quality-metrics)
- [Spectral Best Practices 2026](https://blog.axway.com/learning-center/apis/api-design/api-linting-with-spectral)

### 2.3 User Interface

#### 2.3.1 Diagnostics Panel Component
- **Location**: `features/governance/components/DiagnosticsPanel.tsx`
- **Layout**: Collapsible panel (bottom or side docking).
- **Features**:
    - **Group By**:
        - Severity (Error/Warning/Info)
        - Category (OWASP/Structure/Documentation)
    - **Jump-to-Line**: Clicking an issue:
        - If Code Editor: Scrolls Monaco editor to line/column.
        - If Visual Editor (SRS_03): Highlights corresponding Tiptap node.
- **Pagination**: For specs with > 100 diagnostics, paginate results (25 per page).

#### 2.3.2 Inline Decorations
- **Code Editor** (Monaco):
    - Render squiggly underlines using Monaco Markers API.
    - Red for errors, yellow for warnings.
    - Hover shows diagnostic message.
- **Visual Editor** (Tiptap - SRS_03):
    - Tiptap nodes accept `diagnostic` prop from Governance store.
    - Apply border coloring: `border-destructive` (red) for errors, `border-warning` (yellow) for warnings.
    - Node-level indicator badge showing error count.

#### 2.3.3 Score Badge
- **Location**: Spec card in library, top bar in editor.
- **Design**: Circular badge with Carbon color tokens.
    - Green (`bg-success`): 80-100
    - Yellow (`bg-warning`): 50-79
    - Red (`bg-destructive`): 0-49
- **Tooltip**: Shows breakdown (X errors, Y warnings, Z infos).

## 3. Technical Implementation

### 3.1 Worker Architecture
- **Worker File**: `core/workers/spectral.worker.ts`
- **Communication**: Request/Response pattern via `postMessage`.
- **Message Contract**:
    ```typescript
    // Request (Main Thread → Worker)
    interface LintRequest {
      type: 'LINT';
      requestId: string;
      content: string;         // YAML/JSON spec
      ruleset: string;         // 'spectral:oas' or custom
    }

    // Response (Worker → Main Thread)
    interface LintResponse {
      type: 'LINT_RESULT';
      requestId: string;
      diagnostics: ISpectralDiagnostic[];
      score: number;
    }

    interface ISpectralDiagnostic {
      code: string;            // Rule ID
      message: string;
      severity: 0 | 1 | 2 | 3; // Error | Warning | Info | Hint
      range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
      };
      path: string[];          // JSON path to issue
    }
    ```
- **Cancellation**: Main thread can send `{ type: 'CANCEL', requestId }` to abort pending lint.

### 3.2 Debounce & Cancellation Logic
- **Service**: `features/governance/services/spectral.service.ts`
- **Implementation**:
    ```typescript
    class SpectralService {
      private debounceTimer: NodeJS.Timeout | null = null;
      private currentRequestId: string | null = null;

      async lintSpec(content: string): Promise<LintResponse> {
        // Cancel previous request
        if (this.currentRequestId) {
          this.cancelLint(this.currentRequestId);
        }

        // Debounce: wait 500ms before sending
        return new Promise((resolve) => {
          if (this.debounceTimer) clearTimeout(this.debounceTimer);

          this.debounceTimer = setTimeout(async () => {
            this.currentRequestId = crypto.randomUUID();
            const result = await this.workerPool.executeLint({
              type: 'LINT',
              requestId: this.currentRequestId,
              content,
              ruleset: 'spectral:oas'
            });
            resolve(result);
          }, 500);
        });
      }
    }
    ```

### 3.3 State Management
- **Store**: `features/governance/store/governance.store.ts` (Zustand)
- **State Shape**:
    ```typescript
    interface GovernanceState {
      diagnostics: ISpectralDiagnostic[];
      score: number;
      isLinting: boolean;
      lastLintedAt: Date | null;

      // Actions
      setDiagnostics: (diagnostics: ISpectralDiagnostic[], score: number) => void;
      clearDiagnostics: () => void;
      jumpToIssue: (diagnostic: ISpectralDiagnostic) => void;
    }
    ```
- **Subscription**: DiagnosticsPanel subscribes to governance store.

### 3.4 Integration with Visual Editor (SRS_03)
- **Data Flow**:
    1. Editor emits `spec:updated` event via `core/events/event-dispatcher.ts`.
    2. Governance feature listens to event in `features/governance/hooks/useGovernanceListener.ts`.
    3. Triggers `spectralService.lintSpec(content)`.
    4. Worker returns diagnostics → stored in `governanceStore`.
    5. Visual Editor (Tiptap) subscribes to `governanceStore` and maps diagnostics to nodes by YAML path.
- **YAML Path Mapping**:
    - Diagnostics include `path: ['paths', '/users', 'get', 'responses', '200']`.
    - Visual Editor maintains node-to-path mapping.
    - When diagnostic received, find matching Tiptap node and inject `diagnostic` prop.

## 4. Performance Constraints

### 4.1 Linting Performance
- **Target**: < 200ms for 500-line specs (measured in worker).
- **Strategy**:
    - Use Spectral's built-in caching.
    - Parse YAML once, reuse AST for multiple rules.
    - Lazy-load custom rulesets only when needed.

### 4.2 Worker Pool Management
- **Pool Size**: 1 worker for Spectral (single-threaded linting).
- **Timeout**: 5 seconds max per lint request.
- **Error Handling**: If worker crashes, restart worker and retry once.

### 4.3 UI Responsiveness
- **Monaco Markers**: Update max 100 markers at once (batch updates).
- **Tiptap Node Updates**: Use virtual scrolling if > 100 paths affected.
- **Debounce**: 500ms ensures typing doesn't trigger excessive lints.

## 5. Testing & Validation

### 5.1 Unit Tests
- **Scoring Algorithm**:
    ```typescript
    // Test cases
    expect(calculateScore(0, 0, 0)).toBe(100);    // Perfect spec
    expect(calculateScore(20, 0, 0)).toBe(0);     // 20 errors
    expect(calculateScore(0, 50, 0)).toBe(33);    // 50 warnings
    expect(calculateScore(5, 10, 5)).toBe(42);    // Mixed
    ```
- **Worker Communication**: Mock postMessage, verify request/response contract.
- **Debounce Logic**: Verify only last edit triggers lint after 500ms.

### 5.2 Integration Tests
- **Worker Lifecycle**:
    - Test worker termination on error.
    - Test worker restart after crash.
    - Test cancellation of pending requests.
- **Event Flow**: Test `spec:updated` → lint trigger → diagnostics stored.

### 5.3 Performance Tests
- **Benchmark**: Lint OpenAPI Petstore (500 lines) should complete < 200ms.
- **Load Test**: Lint 10 specs sequentially without worker crash.

## 6. Error Handling

### 6.1 Worker Errors
- **Spectral Parse Error**: Show toast notification "Invalid OpenAPI syntax, cannot lint."
- **Worker Timeout**: Show warning "Linting timed out (spec too large)."
- **Worker Crash**: Auto-restart worker, notify user "Linting service restarted."

### 6.2 Graceful Degradation
- If Spectral worker fails to initialize (e.g., unsupported browser):
    - Disable governance feature via `core/config/feature-flags.ts`.
    - Show info banner "Governance unavailable in this browser."

## 7. Cross-Feature Integration

### 7.1 Dependencies
- **Requires**: Editor (SRS_03) for spec content and cursor API.
- **Provides**: Diagnostics and score to Library, Visual Editor, API Explorer.

### 7.2 Event Contracts
- **Subscribes to**:
    - `spec:updated` (payload: `{ specId: string, content: string }`)
    - `spec:loaded` (payload: `{ specId: string, content: string }`)
- **Emits**:
    - `governance:lint-complete` (payload: `{ specId: string, score: number, diagnostics: ISpectralDiagnostic[] }`)
    - `governance:lint-failed` (payload: `{ specId: string, error: string }`)

### 7.3 Store Subscriptions
- **Visual Editor**: Subscribes to `governanceStore.diagnostics` to render inline decorations.
- **Library**: Subscribes to `governanceStore.score` to display badge on spec cards.

## 8. Plugin System Integration

### 8.1 Linter Plugin Interface
- **Location**: `plugins/linters/spectral-linter.plugin.ts`
- **Interface** (see MVP_ARCHITECTURE.md § 5):
    ```typescript
    interface LinterPlugin {
      id: string;
      name: string;
      version: string;

      lint(content: string, options?: LinterOptions): Promise<LintResult>;

      onLoad(context: PluginContext): void;
      onUnload(): void;
    }
    ```
- **Default Plugin**: Spectral linter plugin as default, can be swapped via plugin registry.

### 8.2 Custom Rulesets
- **Location**: `features/governance/rulesets/`
- **Files**:
    - `oas3.ruleset.json` (default Spectral OAS ruleset)
    - `custom.ruleset.json` (user-defined rules for organization standards)
- **Configuration**: Loaded via `core/config/config.ts` and passed to Spectral worker.

## 9. UI/UX Guidelines

### 9.1 Carbon Design Enforcement
- **Panel**: `rounded-none`, `bg-card`, `border-border`
- **Score Badge**: Circular with `bg-success`/`bg-warning`/`bg-destructive`
- **Diagnostics List**: Use `text-sm`, `gap-2` spacing, `p-4` padding
- **Jump Button**: `text-primary`, `hover:underline`

### 9.2 Accessibility
- **Keyboard Navigation**: Arrow keys to navigate diagnostics list, Enter to jump.
- **Screen Readers**: Announce score and diagnostic count on lint complete.
- **Focus Management**: When jumping to issue, set focus to editor line.

## 10. Future Enhancements (v2)

### 10.1 Custom Rules Editor
- UI to create custom Spectral rules without editing JSON.
- Rule templates for common organization standards.

### 10.2 Historical Scores
- Track score over time, show trend graph.
- Store score history in IndexedDB (`governance_history` table).

### 10.3 Team Rule Sharing
- Export/import rulesets.
- Sync custom rules across team members (requires v2 sync layer).
