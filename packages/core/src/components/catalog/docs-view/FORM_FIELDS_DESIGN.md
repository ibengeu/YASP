# Form Field Rendering System

## Overview

The form field system provides **typed input rendering** for multipart/form-data and application/x-www-form-urlencoded request bodies in the "Try it" panel. It supports multiple input types (text, file, checkbox, email, number, tel, url) with intelligent fallback mechanisms.

## Architecture

### Three-Layer System

```
1. Schema Extraction (extractFormFields)
   ↓
2. Type Inference (inferInputType)
   ↓
3. UI Rendering (renderFieldInput, FormBodyEditor)
```

### Core Functions

#### `extractFormFields(endpoint: any): FormField[]`

Extracts form fields from endpoint OpenAPI/Swagger schema with full type information.

**Input**: Endpoint object with operation definition (requestBody or parameters)

**Output**: Array of FormField objects with:
- `key`: field name
- `value`: pre-filled value from schema example/default
- `type`: inferred input type
- `required?`: boolean indicating if field is required
- `description?`: field description for tooltips

**Handles**:
- OpenAPI 3.x requestBody (multipart/form-data, application/x-www-form-urlencoded)
- Swagger 2.0 body parameters with consumes
- Missing properties (graceful fallback to empty values)
- Type conversion (boolean → "true"/"false", number → string)

#### `inferInputType(key: string, schemaProp: any): FieldInputType`

Infers input type using three-tier priority system:

1. **Schema Format** (highest priority)
   - `format: 'binary'` → `file`
   - `format: 'email'` → `email`
   - `format: 'phone'` → `tel`
   - `format: 'uri'` or `'url'` → `url`

2. **Schema Type**
   - `type: 'boolean'` → `checkbox`
   - `type: 'number'` or `'integer'` → `number`
   - `type: 'string'` → `text` (default)

3. **Field Name Heuristics** (fallback)
   - Contains "file", "upload", "attachment", "image", "document" → `file`
   - Contains "email", "mail" → `email`
   - Contains "phone", "tel" → `tel`
   - Contains "url", "website", "link" → `url`
   - Contains "count", "quantity", "amount" → `number`
   - Starts with "is", "has", "should" or contains "enable", "disable" → `checkbox`
   - Default → `text`

#### `normalizeSchema(schema: any): { properties: Record<string, any> }`

Handles non-standard or incomplete schema structures:

- Null/undefined → returns `{ properties: {} }`
- Already structured (has `properties`) → returns as-is
- Loose object with property hints → treats as properties
- Missing properties but type: 'object' → returns `{ properties: {} }`
- Other cases → wraps schema as properties

**Key Principle**: Never lose field keys due to schema mismatches.

### Rendering Layer

#### `renderFieldInput(field: FormField, onChange): ReactNode`

Renders the appropriate HTML input based on field type:

| Type | HTML Element | Attributes |
|------|--------------|-----------|
| `text` | `<Input type="text">` | placeholder: "Enter value" |
| `file` | `<Input type="file">` | accepts all files |
| `checkbox` | `<Checkbox>` | checked={value === 'true'} |
| `email` | `<Input type="email">` | placeholder: "user@example.com" |
| `number` | `<Input type="number">` | placeholder: "0" |
| `tel` | `<Input type="tel">` | placeholder: "+1 (555) 123-4567" |
| `url` | `<Input type="url">` | placeholder: "https://example.com" |

#### `FormBodyEditor`

Main component for rendering all form fields:

- Displays field name as read-only label
- Shows required indicator (*) if field.required === true
- Renders typed input based on field.type
- Handles value changes via onChange callback
- Styled for consistency with rest of UI

## Data Flow

### Initialization (useEffect)

1. Endpoint changes → call `getBodyFields(endpoint)`
2. Extract all fields with types → `setBodyFields(typedFields)`
3. Render FormBodyEditor with typed fields

### Clear Button

1. User clicks Clear
2. Call `getBodyFields(endpoint)` again
3. Reset fields to spec defaults (not empty)
4. UI re-renders with fresh values

### Form Submission

1. User clicks Execute Request
2. For each field, serialize based on type:
   - `checkbox`: value === 'true' ? 'true' : 'false'
   - Others: String(value)
3. Convert to query string: `key1=value1&key2=value2&...`
4. Send as request body with appropriate Content-Type

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Schema with no properties | Render empty form (no fields) |
| Field with no type/format | Infer from field name, default to text |
| Null/undefined example/default | Use empty string |
| Mixed types in form | Each field gets appropriate input type |
| Boolean value in example | Convert to "true"/"false" string |
| Non-standard schema structure | Gracefully normalize, never skip fields |
| Checkbox value | Store as "true"/"false" string, display as boolean |

## Examples

### Example 1: File Upload Form

```yaml
requestBody:
  content:
    multipart/form-data:
      schema:
        properties:
          fileUpload: { type: string, format: binary }
          description: { type: string, example: "My file" }
          isPublic: { type: boolean }
```

**Rendered UI**:
- fileUpload → `[File Input]`
- description → `[Text Input]` with value "My file"
- isPublic → `[Checkbox]`

### Example 2: Login Form

```yaml
requestBody:
  content:
    application/x-www-form-urlencoded:
      schema:
        properties:
          email: { type: string, format: email }
          password: { type: string }
          rememberMe: { type: boolean }
```

**Rendered UI**:
- email → `[Email Input]` with placeholder "user@example.com"
- password → `[Text Input]`
- rememberMe → `[Checkbox]`

### Example 3: Non-Standard Schema

```yaml
# Loose schema structure without properties wrapper
schema:
  fileUpload: { type: string, format: binary }
  count: { type: number }
  isActive: {} # No type specified
```

**Behavior**:
1. `normalizeSchema()` detects property hints and treats as properties
2. `extractFormFields()` creates fields for all 3 keys
3. `inferInputType()` uses fallback heuristics for `isActive` → checkbox
4. **Result**: All fields rendered, none skipped

## Testing

Comprehensive test suite in `form-field-utils.test.ts`:

- **32 tests** covering all functions
- Type inference with format priority
- Type inference with type-based fallback
- Type inference with name-based heuristics
- Schema normalization edge cases
- Full extraction workflow
- All field types in single form
- Missing/incomplete schema properties

**Coverage**: Every inference path, edge case, and integration scenario tested.

## Integration Points

### DocsRightPanel

- Imports: `extractFormFields`, `FormField` type
- Uses: `getBodyFields(endpoint)` helper
- Stores: `bodyFields: FormField[]` state
- Renders: `<FormBodyEditor fields={bodyFields} onChange={...} />`

### Future Extensions

The system is designed for easy extension:

1. **New input types**: Add case to `inferInputType()`, `renderFieldInput()`
2. **Custom field validation**: Add `validation` property to `FormField`
3. **Conditional fields**: Add `dependsOn` property to show/hide based on other fields
4. **Array fields**: Extend to support repeating field groups
5. **Nested objects**: Add support for nested property structures

## Constraints & Design Decisions

- **No strict JSON Schema validation**: Systems may use loose structures
- **Graceful degradation**: Missing properties → default to text, never error
- **Priority order matters**: Format > type > name heuristics prevents mistakes
- **String-only values**: All form values are strings (matches form submission spec)
- **No file upload handling**: File inputs store filename; actual file handling happens at API request level
