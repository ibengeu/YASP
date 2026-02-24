# Notion Sync Scripts

This directory contains scripts for synchronizing documentation with Notion.

## Scripts

### `sync-notion.ts`

Automatically syncs markdown files from the `docs/` directory to Notion.

**Features:**
- Watches `docs/` folder for file changes
- Auto-creates Notion pages for new markdown files
- Updates existing pages when files change
- Handles change detection via file hashing
- Enforces Notion's 2000 character limit for text blocks
- Intelligently chunks long code blocks
- Gracefully handles archived blocks (reports them but doesn't delete)
- Debounces rapid file changes to avoid excessive API calls

**Usage:**

Initial sync and watch mode (one-time setup):
```bash
bun run sync:notion
```

Or directly with bunx:
```bash
bunx tsx scripts/sync-notion.ts
```

**Configuration:**

Edit the `NOTION_PAGES` map in the script to manually map specific files to Notion pages:
```typescript
const NOTION_PAGES: Record<string, string> = {
  'MVP_PRD.md': 'your-page-id-here',
  'MVP_SRS.md': 'another-page-id',
};
```

New files are automatically created under `PARENT_PAGE_ID` (currently set to "YASP Documentation").

**How It Works:**

1. **Initial Sync**: On startup, syncs all `.md` files in `docs/` folder
2. **Continuous Watching**: Watches for file changes and syncs automatically (debounced)
3. **Change Detection**: Uses MD5 hashing to detect actual changes
4. **Page Creation**: New markdown files automatically create corresponding Notion pages
5. **Block Management**:
   - Clears old blocks before adding new ones
   - Respects Notion's 2000 character limit per text element
   - Chunks large code blocks into multiple blocks
   - Reports (but does not delete) archived blocks

**Markdown Support:**

- Headings (h1-h3): `# Heading`, `## Subheading`, `### Sub-subheading`
- Bold text: `**bold**` or `__bold__`
- Inline code: `` `code` ``
- Code blocks: ` ```code``` ` (auto-split if > 2000 chars)
- Bullet lists: `- item` or `* item`
- Numbered lists: `1. item`
- Tables: `| Column | Data |` (converted to markdown code blocks)
- Dividers: `---`
- Paragraphs: Regular text

**Limits & Handling:**

- **Text Block Limit**: 2000 characters per Notion rich_text element
  - Automatically truncated at word boundaries if exceeded
  - Adds `...` to indicate truncation
- **Code Block Limit**: 2000 characters per code block
  - Long code blocks are automatically split into multiple blocks
  - Each chunk is a separate Notion code block for readability
- **Archived Blocks**: Not deleted during sync
  - Reported in logs for manual cleanup
  - Use `clean-notion-trash.ts` to permanently delete archived blocks

**Environment Variables:**

- `NOTION_API_KEY`: Required. Set to your Notion API token.

---

### `clean-notion-trash.ts`

Permanently deletes archived blocks and pages from your entire Notion workspace.

**Purpose:**

Over time, synced pages may accumulate archived blocks (from deleted or restructured content). This script safely removes them from the Notion database without affecting non-archived content. **No page IDs required** - it automatically discovers and cleans your entire workspace.

**Usage:**

Clean **entire workspace** (no arguments needed - auto-discovers all archived content):
```bash
bun run clean:notion-trash
```

Or with bunx:
```bash
bunx tsx scripts/clean-notion-trash.ts
```

Clean **specific pages** (optional):
```bash
bunx tsx scripts/clean-notion-trash.ts <pageId1> [pageId2] [pageId3]
```

Example:
```bash
bunx tsx scripts/clean-notion-trash.ts 2f2a5d68-fcdd-8192-b757-cd8fcded843f
```

**How It Works:**

1. **Scans entire workspace** for archived pages and pages with archived blocks
2. **Automatically discovers** archived content (no manual ID entry required)
3. **Recursively traverses** page structure (handles nested blocks)
4. **Identifies archived blocks** at each level
5. **Deletes archived blocks and pages** (non-archived content untouched)
6. **Reports detailed progress** with cleanup statistics
7. **Handles errors gracefully** (continues on failure, logs all issues)

**Output Example:**

```
🗑️  Cleaning archived blocks from page: 2f2a5d68-fcdd-8192-b757-cd8fcded843f
Found 3 archived blocks
✓ Deleted archived block: abc123def456
✓ Deleted archived block: xyz789abc123
✓ Deleted archived block: 123456789abc
✅ Cleanup complete! Deleted 3 archived blocks
```

**When to Use:**

- After significant restructuring of synced documents
- Periodically to keep Notion workspace clean
- When `sync-notion.ts` reports archived blocks
- Before archiving or migrating Notion pages

**Environment Variables:**

- `NOTION_API_KEY`: Required. Set to your Notion API token.

---

## Setup

### Prerequisites

1. Create a Notion API token:
   - Go to [Notion Developers](https://www.notion.so/my-integrations)
   - Create a new integration
   - Copy the "Internal Integration Token"

2. Share Notion pages with the integration:
   - Open the page in Notion
   - Click "..." (more options)
   - Select "Connections"
   - Add your integration

3. Create a parent page for auto-created pages:
   - Create a "YASP Documentation" page in Notion
   - Copy its page ID
   - Update `PARENT_PAGE_ID` in `sync-notion.ts`

### Environment Setup

```bash
# Create .env.local or add to your shell profile
export NOTION_API_KEY="your-api-token-here"
```

### Package Scripts

Already configured in `package.json`:
```json
{
  "scripts": {
    "sync:notion": "bunx tsx scripts/sync-notion.ts",
    "clean:notion-trash": "bunx tsx scripts/clean-notion-trash.ts"
  }
}
```

Usage:
```bash
# Sync docs to Notion
bun run sync:notion

# Clean trash from entire workspace (no IDs needed)
bun run clean:notion-trash

# Clean specific pages
bunx tsx scripts/clean-notion-trash.ts <pageId1> <pageId2>
```

---

## Troubleshooting

### Script won't connect to Notion

- Check `NOTION_API_KEY` is set correctly
- Verify the token hasn't expired
- Ensure pages are shared with the integration

### "Validation error: body failed validation"

- Usually means text exceeds 2000 character limit
- The sync script now handles this automatically
- Rebuild and re-run if still issues persist

### "Archived blocks found"

- During sync, archived blocks are reported but NOT deleted
- Use `clean-notion-trash.ts` to remove them
- Example: `npx tsx scripts/clean-notion-trash.ts <pageId>`

### Changes not syncing

- Check the watcher is running: `npm run sync-notion`
- Verify file path is in `docs/` directory
- Check file has `.md` extension
- Review console output for error messages

### Slow initial sync

- Large markdown files are parsed and uploaded in chunks
- This is normal and expected for first-time setup
- Subsequent syncs are faster (only changed files)

---

## Performance Notes

- **Change Detection**: O(1) hash lookup, minimal disk I/O
- **Parsing**: O(n) single-pass markdown parser (efficient)
- **Uploads**: Batched in 100-block chunks (Notion API limit)
- **Cleanup**: O(n) recursive traversal of page blocks
- **Debouncing**: 1 second default (prevents duplicate API calls)

---

## API Rate Limiting

Notion has rate limits. These scripts are designed to respect them:

- Sequential block deletion (not parallel) to avoid rate limit
- Debounced file watching to avoid rapid-fire uploads
- Batched block uploads (100 per request)
- Automatic retry on cursor validation errors

If hitting rate limits, increase debounce delay in `sync-notion.ts`:
```typescript
debouncedSync(filePath, 2000); // Increase to 2 seconds
```

---

## Future Improvements

- [ ] Bidirectional sync (Notion → local files)
- [ ] Selective file/page sync (not all files)
- [ ] Custom metadata sync (tags, properties)
- [ ] Backup before clearing pages
- [ ] Dry-run mode for testing
- [ ] Configuration file support (instead of hardcoding)
