# SRS 03: Visual Designer (The Builder)

## 1. Overview
The Visual Designer transforms the "Wall of YAML/JSON" into an interactive, block-based UI. It creates a "WYSIWYG-like" experience for API design while maintaining bidirectional sync with the source code.

**Feature Module**: `features/editor/` (see MVP_ARCHITECTURE.md § 4)

## 2. Functional Requirements

### 2.1 Hybrid Editor Architecture

#### 2.1.1 Single Source of Truth
- **Primary State**: The raw YAML string stored in IndexedDB.
- **Derived State**: Tiptap ProseMirror document generated from YAML on load.
- **Rationale**: YAML is the authoritative format for OpenAPI specs; visual representation is a view layer.

#### 2.1.2 Bidirectional Sync Strategy
Inspired by Builder.io's deterministic code mapping and Cursor's visual editing ([Builder.io Design Mode](https://www.builder.io/blog/cursor-design-mode-visual-editing), [Cursor Visual Editor](https://cursor.com/blog/browser-visual-editor)):

**Code → Visual Sync**:
1. Parse YAML to AST using `js-yaml`
2. Map AST nodes to YAML line/column positions
3. Generate Tiptap document with custom nodes for OpenAPI structures
4. Maintain **position map**: `{ nodeId → yamlPath, line, column }`

**Visual → Code Sync**:
1. On Tiptap node change, extract node data and yamlPath
2. Use yamlPath to locate AST node in parsed YAML
3. Update AST node with new values
4. Serialize AST back to YAML string
5. Preserve comments and formatting where possible

**Last-Writer-Wins Policy**:
- Track last edit timestamp for each mode (visual vs code)
- When switching modes, compare timestamps:
  - If timestamps differ < 100ms: merge changes (rare race condition)
  - Otherwise: overwrite destination with source content
- **Debounce**: 300ms delay before triggering sync to avoid flicker

#### 2.1.3 Cursor Preservation Algorithm
Based on coordinate system mapping ([IntelliJ Coordinates System](https://plugins.jetbrains.com/docs/intellij/coordinates-system.html)):

**Code → Visual**:
```
1. User is editing YAML at line 45, column 12
2. Map line/column to yamlPath using AST: ['paths', '/users', 'post', 'requestBody']
3. Find Tiptap node with matching yamlPath
4. Scroll Tiptap editor to that node and focus it
5. If node deleted: focus nearest parent node
```

**Visual → Code**:
```
1. User is editing Tiptap node with yamlPath: ['paths', '/users', 'get', 'parameters', 0]
2. Lookup yamlPath in position map to get line/column: { line: 78, column: 6 }
3. Scroll Monaco editor to line 78
4. Set cursor position to column 6
5. If yamlPath not found (deleted): focus nearest parent path
```

**Edge Cases**:
- **Node deleted in code**: Focus parent container in visual mode
- **Node added in visual**: Append to end of parent in code, then re-parse to get line number
- **Concurrent edits**: Detect via debounce; show conflict modal with "Keep Visual" / "Keep Code" options

#### 2.1.4 Undo/Redo Strategy
- **Shared History**: Single undo/redo stack managed by Zustand store
- **State Snapshot**: Each undo state stores both YAML string and Tiptap JSON
- **Cross-Mode Undo**: Undo in code reverts visual (and vice versa)
- **Granularity**: Group rapid edits within 1 second as single undo step

### 2.2 Semantic Blocks (Tiptap Custom Nodes)

The editor implements Tiptap custom nodes for OpenAPI 3.1 structures:

1. **Info Object Node**
   - Title: H1 heading (editable)
   - Version: Badge with dropdown (semver validation)
   - Description: Rich text editor (Markdown support)

2. **Server Object Node**
   - Collapsible list of base URLs
   - Each server: URL input + description input
   - Add/remove buttons

3. **Path Item Node**
   - Collapsible container for route (e.g., `/users/{id}`)
   - Path parameters highlighted in blue
   - Contains Operation nodes

4. **Operation Node**
   - Header: HTTP method badge (GET/POST/etc) + OperationId input
   - Summary/Description: Rich text
   - Tags: Multi-select dropdown (creates new tags on-the-fly)
   - Contains Parameters, RequestBody, Responses nodes

5. **Parameters Node**
   - Data grid with columns: Name, In (query/path/header), Required, Type, Description
   - Inline editing with type validation
   - Add/remove rows

6. **Request Body Node**
   - Content-Type dropdown (application/json, multipart/form-data, etc.)
   - Schema selector:
     - Reference existing schema (`$ref`)
     - Define inline schema (opens mini schema editor)

7. **Responses Node**
   - List of status codes (200, 400, 404, 500)
   - Each response: Schema reference + description
   - Add status code button

8. **Components/Schemas Node**
   - Tree view for schema definitions
   - Each schema: Collapsible object with properties
   - Property editor: Name, Type, Required, Description, Format

### 2.3 UX Interactions & Design

#### 2.3.1 Carbon Design Enforcement
All blocks follow strict Carbon Design System guidelines:
- **Borders**: `rounded-none` (sharp corners by default)
- **Containers**: `bg-card`, `border-border`
- **Spacing**: 4px grid (`p-4`, `gap-4`, `mb-4`)
- **Inputs**: `rounded-sm` (4px subtle rounding only for form inputs)
- **Typography**: `text-base` (16px), `text-sm` (14px) for labels

#### 2.3.2 Keyboard Shortcuts
- `Cmd/Ctrl + S`: Save spec to IndexedDB
- `Cmd/Ctrl + Z`: Undo last change
- `Cmd/Ctrl + Shift + Z`: Redo
- `Cmd/Ctrl + K`: Command palette (insert block, search nodes)
- `Tab`: Navigate between inputs in current block
- `Enter`: Add new item in list (parameters, responses)
- `/` (slash command): Insert new block (Path, Operation, Schema)

#### 2.3.3 Drag & Drop
- **Parameters**: Reorder rows in data grid (vertical drag)
- **Responses**: Reorder status codes
- **Paths**: Reorder endpoints in sidebar
- **Drag Handle**: Left-side gripper icon (3-line hamburger) on hover

#### 2.3.4 Slash Commands
Type `/` to open block insertion menu:
- `/path` → Insert new PathItem
- `/operation` → Insert new Operation under current PathItem
- `/schema` → Insert new schema in Components
- `/response` → Add response status code
- `/param` → Add parameter row

## 3. Technical Constraints

### 3.1 Libraries & Dependencies
- **Visual Editor**: [Tiptap v2](https://tiptap.dev/) (ProseMirror wrapper) with React Node Views for semantic block editing
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) for raw YAML/JSON editing with syntax highlighting
- **Parser**: [`js-yaml`](https://github.com/nodeca/js-yaml) for YAML ↔ AST conversion
- **YAML Formatting**: [`yaml`](https://github.com/eemeli/yaml) (eemeli/yaml) for comment-preserving serialization

**Editor Mode Toggle**:
- Users can switch between **Visual Mode** (Tiptap blocks) and **Code Mode** (Monaco YAML editor)
- Both modes sync bidirectionally via the sync strategy described in § 2.1.2

### 3.2 Performance Requirements
- **Spec Size**: Handle specs up to 5MB (approx. 50,000 lines)
- **Virtualization**: Use [react-window](https://github.com/bvaughn/react-window) for PathItem lists > 100 items
- **Sync Latency**: Code ↔ Visual sync must complete < 100ms (imperceptible to user)
- **Parse Time**: Initial YAML → Tiptap conversion < 500ms for 5MB spec
- **Debounce**: 300ms debounce for visual → code sync (balance responsiveness vs performance)

### 3.3 Browser Support
- **Required APIs**: Web Workers (for YAML parsing in background thread)
- **Performance Target**: 60fps scrolling on MacBook Air M1 equivalent

## 4. Integration with Governance (SRS_02)

### 4.1 Diagnostic Injection
- **Data Flow**: Tiptap nodes subscribe to `governanceStore` (Zustand)
- **Mapping**: Diagnostics include `path: ['paths', '/users', 'get']` (yamlPath)
- **Node Props**: Each node receives `diagnostics` prop (array of matching issues)
- **Rendering**:
  - Errors: Red left border (`border-l-4 border-destructive`)
  - Warnings: Yellow left border (`border-l-4 border-warning`)
  - Badge: Show count (e.g., "2 errors") in top-right of node

### 4.2 Jump-to-Issue Flow
1. User clicks diagnostic in Governance panel
2. Governance emits `diagnostic:jump` event with yamlPath
3. Visual Editor scrolls to node with matching yamlPath
4. Highlights node with pulsing animation (2s duration)
5. Opens node if collapsed

## 5. State Management

### 5.1 Zustand Store
**Location**: `features/editor/store/editor.store.ts`

**State Shape**:
```typescript
interface EditorState {
  content: string;              // Current YAML string
  tiptapJSON: TiptapDocument | null;
  mode: 'visual' | 'code';
  lastEditMode: 'visual' | 'code';
  lastEditTimestamp: number;
  positionMap: Map<string, YAMLPosition>;
  isSyncing: boolean;
  undoStack: EditorSnapshot[];
  redoStack: EditorSnapshot[];

  // Actions
  setContent: (content: string, mode: 'visual' | 'code') => void;
  syncVisualToCode: () => Promise<void>;
  syncCodeToVisual: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  preserveCursor: (yamlPath: string[], mode: 'visual' | 'code') => void;
}
```

### 5.2 Event Contracts
**Subscribes to**:
- `governance:lint-complete` → Update node diagnostic props

**Emits**:
- `spec:updated` (on content change) → Triggers Governance lint
- `editor:mode-switch` (visual ↔ code) → Analytics

## 6. Error Handling

### 6.1 YAML Parse Errors
- **Detection**: `js-yaml` throws `YAMLException` on invalid syntax
- **Recovery**:
  - Show banner: "Cannot parse YAML. Visual mode unavailable."
  - Display error message with line/column
  - Fallback to code-only mode until fixed
  - Preserve user's invalid YAML (don't auto-fix)

### 6.2 Sync Conflicts
- **Detection**: lastEditTimestamp differs by < 100ms between modes
- **Resolution**:
  - Show modal: "Conflicting edits detected"
  - Options: "Keep Visual Changes" | "Keep Code Changes" | "Show Diff"
  - Default: Keep most recent edit (by timestamp)

### 6.3 Cursor Position Lost
- **Scenario**: Node deleted, yamlPath no longer exists
- **Recovery**:
  - Focus nearest parent node by truncating yamlPath
  - Example: `['paths', '/users', 'get']` → `['paths', '/users']` → `['paths']`
  - If root deleted: focus Info node (always present)

## 7. Testing Requirements

### 7.1 Unit Tests
- YAML ↔ AST ↔ Tiptap conversion (round-trip equality)
- Cursor preservation algorithm (yamlPath → line/column mapping)
- Sync debounce logic (verify 300ms delay)
- Undo/redo stack management

### 7.2 Integration Tests
- Code edit → Visual update (verify node renders correctly)
- Visual edit → Code update (verify YAML structure preserved)
- Governance diagnostic injection (verify border colors)

### 7.3 Performance Tests
- Benchmark: Load 5MB spec < 500ms
- Benchmark: Sync latency < 100ms for 1000-line spec
- Stress test: 100 PathItems with virtualization enabled

## 8. Accessibility

### 8.1 Keyboard Navigation
- All blocks keyboard-navigable (Tab/Shift+Tab)
- Screen reader announces node type on focus
- ARIA labels for all interactive elements

### 8.2 Focus Management
- Focus trap in modals (schema editor, conflict resolution)
- Focus restoration after mode switch

## 9. Future Enhancements (v2)

### 9.1 Collaborative Editing
- Integrate Yjs CRDT for real-time multi-user editing ([y-tiptap](https://github.com/ueberdosis/y-tiptap))
- Show cursor positions of other users
- Conflict-free merging

### 9.2 AI-Assisted Editing
- AI suggestions inline (e.g., "Generate 404 response")
- Schema inference from examples

### 9.3 Diff View
- Side-by-side diff for code vs visual conflicts
- Syntax-highlighted diff with yamlPath markers

## 10. References
- [Tiptap Documentation](https://tiptap.dev/docs/editor/getting-started/overview)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [Builder.io Visual Editor](https://www.builder.io/blog/cursor-design-mode-visual-editing)
- [Cursor Browser Visual Editing](https://cursor.com/blog/browser-visual-editor)
- [Y-TipTap CRDT Binding](https://github.com/ueberdosis/y-tiptap)
