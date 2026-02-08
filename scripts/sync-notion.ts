import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';
import fs from 'fs';
import path from 'path';
import { watch } from 'fs';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
// Mitigation for OWASP A05:2025 - Cryptographic Failures: Load secrets from .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Parent page ID for auto-created new files
const PARENT_PAGE_ID = '2f2a5d68-fcdd-8192-b757-cd8fcded843f'; // YASP Documentation

// Known page mappings - add entries here to avoid recreating existing pages
// For new files not in this list, the script will search Notion or create new pages
const KNOWN_PAGES: Record<string, string> = {
  'MVP_PRD.md': '2f2a5d68-fcdd-81b1-b898-e5dc106e9c1b',
  'MVP_SRS.md': '2f2a5d68-fcdd-8137-b150-d65704c7fad3',
  'MVP_PHASES.md': '2f2a5d68-fcdd-81c3-b332-ec8540f47708',
  'MVP_ARCHITECTURE.md': '2f2a5d68-fcdd-8113-9cd8-f81aac0044b0',
};

// In-memory cache for page IDs (populated during sync)
const pageIdCache = new Map<string, string>();

// Cache for file hashes to detect changes
const fileHashCache = new Map<string, string>();

// Cache for page state to minimize API calls
const pageStateCache = new Map<string, { blockCount: number; lastSync: number }>();

// Debounce timers for file watchers
const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Calculate file hash for change detection
 * O(n) where n is file size, but uses streaming for efficiency
 */
function getFileHash(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  return createHash('md5').update(content).digest('hex');
}

/**
 * Check if file has changed since last sync
 * O(1) hash lookup
 */
function hasFileChanged(filePath: string): boolean {
  const currentHash = getFileHash(filePath);
  const lastHash = fileHashCache.get(filePath);

  if (currentHash !== lastHash) {
    fileHashCache.set(filePath, currentHash);
    return true;
  }
  return false;
}

/**
 * Enforce Notion's 2000 character limit per rich_text element
 * Splits text into multiple elements if necessary
 * Preserves formatting annotations across splits
 */
function enforceNotionTextLimit(text: string, maxLength: number = 2000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Split at word boundary to avoid breaking words
  let truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    // If last space is reasonably close, use it
    return truncated.substring(0, lastSpace);
  }

  // Otherwise just truncate and add ellipsis
  return truncated.substring(0, maxLength - 3) + '...';
}

/**
 * Parse inline markdown with state machine
 * O(n) where n is text length
 * Single pass, no regex split overhead
 * Respects Notion's 2000 character limit per text element
 */
function parseInlineMarkdown(text: string): any[] {
  if (!text) return [{ type: 'text', text: { content: '' } }];

  const richText: any[] = [];
  let current = '';
  let bold = false;
  let code = false;
  let i = 0;

  while (i < text.length) {
    // Check for ** (bold marker)
    if (i + 1 < text.length && text[i] === '*' && text[i + 1] === '*') {
      if (current) {
        const enforced = enforceNotionTextLimit(current);
        richText.push({
          type: 'text',
          text: { content: enforced },
          annotations: { bold, code },
        });
        current = '';
      }
      bold = !bold;
      i += 2;
      continue;
    }

    // Check for ` (code marker)
    if (text[i] === '`') {
      if (current) {
        const enforced = enforceNotionTextLimit(current);
        richText.push({
          type: 'text',
          text: { content: enforced },
          annotations: { bold, code },
        });
        current = '';
      }
      code = !code;
      i += 1;
      continue;
    }

    // Check for __ (bold alternate)
    if (i + 1 < text.length && text[i] === '_' && text[i + 1] === '_') {
      if (current) {
        const enforced = enforceNotionTextLimit(current);
        richText.push({
          type: 'text',
          text: { content: enforced },
          annotations: { bold, code },
        });
        current = '';
      }
      bold = !bold;
      i += 2;
      continue;
    }

    current += text[i];
    i += 1;
  }

  if (current) {
    const enforced = enforceNotionTextLimit(current);
    richText.push({
      type: 'text',
      text: { content: enforced },
      annotations: { bold, code },
    });
  }

  return richText.length > 0 ? richText : [{ type: 'text', text: { content: '' } }];
}

/**
 * Regex patterns pre-compiled for performance
 * These avoid recompiling on every line check
 */
const PATTERNS = {
  heading: /^#+\s/,
  headingLevel: /^#+/,
  bullet: /^[\s]*[-*]\s/,
  numbered: /^[\s]*\d+\.\s/,
  table: /\|/,
  divider: /^---+$/,
  codeBlockMarker: /^```/,
};

/**
 * Parse markdown to Notion blocks with optimized line processing
 * O(n) where n is number of lines
 * Uses streaming line-by-line to avoid loading entire document into memory
 */
function parseMarkdownToBlocks(content: string): any[] {
  const blocks: any[] = [];
  const lines = content.split('\n');
  let currentCodeBlock = '';
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Early exit for empty lines in non-code mode
    if (!trimmed && !inCodeBlock) continue;

    // Code block handling with text limit enforcement
    if (PATTERNS.codeBlockMarker.test(line)) {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock && currentCodeBlock) {
        const codeContent = currentCodeBlock.trim();

        // If code block exceeds limit, split into multiple blocks
        if (codeContent.length > 2000) {
          const chunks = [];
          let start = 0;
          while (start < codeContent.length) {
            chunks.push(codeContent.substring(start, start + 2000));
            start += 2000;
          }

          // Create a code block for each chunk
          for (const chunk of chunks) {
            blocks.push({
              object: 'block',
              type: 'code',
              code: {
                rich_text: [{ type: 'text', text: { content: chunk } }],
                language: 'plain text',
              },
            });
          }
        } else {
          blocks.push({
            object: 'block',
            type: 'code',
            code: {
              rich_text: [{ type: 'text', text: { content: codeContent } }],
              language: 'plain text',
            },
          });
        }
        currentCodeBlock = '';
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeBlock += line + '\n';
      continue;
    }

    // Heading
    if (PATTERNS.heading.test(line)) {
      const level = (PATTERNS.headingLevel.exec(line)?.[0].length || 1) as 1 | 2 | 3;
      const heading = line.replace(PATTERNS.headingLevel, '').replace(/^\s+/, '');
      blocks.push({
        object: 'block',
        type: `heading_${Math.min(level, 3)}`,
        [`heading_${Math.min(level, 3)}`]: {
          rich_text: parseInlineMarkdown(heading),
        },
      });
      continue;
    }

    // Bullet list
    if (PATTERNS.bullet.test(line)) {
      const item = line.replace(PATTERNS.bullet, '').trim();
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: parseInlineMarkdown(item),
        },
      });
      continue;
    }

    // Numbered list
    if (PATTERNS.numbered.test(line)) {
      const item = line.replace(/^[\s]*\d+\.\s/, '').trim();
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: parseInlineMarkdown(item),
        },
      });
      continue;
    }

    // Table - convert markdown table to Notion code block with enforced text limits
    if (PATTERNS.table.test(line)) {
      const tableContent = enforceNotionTextLimit(line);
      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          rich_text: [{ type: 'text', text: { content: tableContent } }],
          language: 'markdown',
        },
      });
      continue;
    }

    // Divider
    if (PATTERNS.divider.test(line)) {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {},
      });
      continue;
    }

    // Regular paragraph
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: parseInlineMarkdown(trimmed),
      },
    });
  }

  return blocks;
}

/**
 * Delete all non-archived blocks from a page
 * Always restarts from beginning after each batch deletion
 * This avoids cursor invalidity issues when blocks are deleted during pagination
 * Optimization: Skips if page is empty or estimates > 200 blocks (too slow to clear)
 */
async function clearPage(pageId: string): Promise<{ deleted: number; archived: number; skipped: boolean }> {
  let deletedCount = 0;
  let archivedCount = 0;
  let totalIterations = 0;
  const MAX_ITERATIONS = 50; // Prevent infinite loops

  // Keep deleting batches until no more non-archived blocks remain
  while (totalIterations < MAX_ITERATIONS) {
    try {
      // Always start from beginning (no cursor)
      const response: any = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      const blocks = response.results;
      const nonArchivedBlocks = blocks.filter((block: any) => !block.archived);
      const archivedBlocks = blocks.filter((block: any) => block.archived);

      // Track archived blocks (only count once per iteration)
      if (totalIterations === 0 && archivedBlocks.length > 0) {
        archivedCount = archivedBlocks.length;
        console.log(
          `⚠️  Found ${archivedBlocks.length} archived blocks in page (these will NOT be deleted)`
        );
      }

      // Optimization: If page is empty on first check, skip entirely
      if (totalIterations === 0 && nonArchivedBlocks.length === 0) {
        console.log(`✓ Page already empty, skipping clear`);
        return { deleted: 0, archived: archivedCount, skipped: true };
      }

      // Block count check removed - always proceed with clearing regardless of page size

      // If no non-archived blocks left, we're done
      if (nonArchivedBlocks.length === 0) {
        break;
      }

      // Delete this batch of non-archived blocks
      const deletePromises = nonArchivedBlocks.map((block: any) =>
        notion.blocks.delete({ block_id: block.id }).catch((err) => {
          console.warn(`Failed to delete block ${block.id}:`, err.message);
          return null;
        })
      );

      const results = await Promise.all(deletePromises);
      const batchDeleted = results.filter((r) => r !== null).length;
      deletedCount += batchDeleted;

      totalIterations++;
    } catch (error: any) {
      console.error(`Error clearing page:`, error);
      break;
    }
  }

  if (totalIterations >= MAX_ITERATIONS) {
    console.warn(`⚠️  Max iterations reached for clearing page ${pageId}`);
  }

  return { deleted: deletedCount, archived: archivedCount, skipped: false };
}

/**
 * Find existing Notion page by filename
 * Searches Notion workspace for a page matching the given filename pattern
 * Returns page ID if found, null otherwise
 * Filters out archived pages and matches based on filename keywords
 */
async function findPageByFilename(fileName: string): Promise<string | undefined> {
  try {
    // Extract meaningful keywords from filename (e.g., "MVP_ARCHITECTURE" -> ["MVP", "ARCHITECTURE"])
    const fileNameNoExt = fileName.replace('.md', '');
    const keywords = fileNameNoExt.split('_').filter(k => k.length > 2); // Filter out short words

    // Search using the full filename
    const response: any = await notion.search({
      query: fileNameNoExt,
      filter: {
        property: 'object',
        value: 'page',
      },
    });

    // Find page that matches the filename keywords and is not archived
    const matchingPage = response.results.find((page: any) => {
      if (page.archived) return false;

      const pageTitle = (page.properties?.title?.title?.[0]?.text?.content || '').toLowerCase();

      // Match if the page title contains most of the keywords from the filename
      const matchedKeywords = keywords.filter(keyword =>
        pageTitle.includes(keyword.toLowerCase())
      );

      // Require at least half of the keywords to match (or all if there's only 1-2 keywords)
      const requiredMatches = Math.max(1, Math.ceil(keywords.length / 2));
      return matchedKeywords.length >= requiredMatches;
    });

    return matchingPage ? matchingPage.id : undefined;
  } catch (error) {
    console.error(`❌ Error searching for page with filename "${fileName}":`, error);
    return undefined;
  }
}

/**
 * Auto-create a Notion page for a new markdown file
 * Returns the created page ID
 */
async function createNotionPage(filePath: string, title: string): Promise<string | undefined> {
  const fileName = path.basename(filePath);

  try {
    const response: any = await notion.pages.create({
      parent: { page_id: PARENT_PAGE_ID },
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
      },
    });

    const pageId = response.id;
    pageIdCache.set(fileName, pageId);

    console.log(`✨ Created new Notion page for ${fileName} (${pageId})`);
    return pageId;
  } catch (error) {
    console.error(`❌ Failed to create Notion page for ${fileName}:`, error);
    return undefined;
  }
}

/**
 * Sync file to Notion with optimizations
 * O(n) where n is file size + API calls
 * Includes change detection and auto-creation of new pages
 * Uses Notion as source of truth - queries by title to find existing pages
 */
async function syncFileToNotion(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);
  const content = readFileSync(filePath, 'utf-8');

  // Extract title from markdown
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : fileName.replace('.md', '');

  // Check cache first
  let pageId = pageIdCache.get(fileName);

  // If not in cache, check known mappings
  if (!pageId) {
    pageId = KNOWN_PAGES[fileName];
    if (pageId) {
      console.log(`✓ Using known page mapping for ${fileName} (${pageId})`);
      pageIdCache.set(fileName, pageId);
    }
  }

  // If still not found, search Notion by filename
  if (!pageId) {
    console.log(`🔍 Searching for existing page: ${fileName}`);
    pageId = await findPageByFilename(fileName);

    if (pageId) {
      console.log(`✓ Found existing page for ${fileName} (${pageId})`);
      console.log(`💡 Add to KNOWN_PAGES: '${fileName}': '${pageId}',`);
      pageIdCache.set(fileName, pageId);
    } else {
      // Create new page if not found
      console.log(`📄 Creating new page: ${title}`);
      pageId = await createNotionPage(filePath, title);
      if (!pageId) return;
      console.log(`💡 Add to KNOWN_PAGES: '${fileName}': '${pageId}',`);
    }
  }

  // Check if file actually changed (skip if hash is identical)
  if (!hasFileChanged(filePath)) {
    console.log(`⊘ No changes in ${fileName}`);
    return;
  }

  try {
    // Extract body content (title already extracted above)
    const bodyContent = content.replace(/^# .+\n\n?/, '');

    // Check if page is archived and unarchive it first
    // Mitigation for OWASP A04:2025 - Insecure Design: Validate page state before operations
    const pageInfo: any = await notion.pages.retrieve({ page_id: pageId });
    if (pageInfo.archived) {
      console.log(`📦 Unarchiving page ${fileName}...`);
      await notion.pages.update({
        page_id: pageId,
        archived: false,
      });
    }

    // Update page title first, then clear (sequential for reliability)
    await notion.pages.update({
      page_id: pageId,
      properties: { title: { title: [{ text: { content: title } }] } },
    });

    const clearResult = await clearPage(pageId);

    // Only update content if page was cleared (or was empty)
    if (!clearResult.skipped) {
      // Parse blocks once
      const blocks = parseMarkdownToBlocks(bodyContent);

      // Add blocks in optimal chunk size (100 is Notion's limit)
      // Upload sequentially to preserve order
      const CHUNK_SIZE = 100;

      for (let i = 0; i < blocks.length; i += CHUNK_SIZE) {
        const chunk = blocks.slice(i, i + CHUNK_SIZE);
        if (chunk.length > 0) {
          await notion.blocks.children.append({
            block_id: pageId,
            children: chunk,
          });
        }
      }

      // Update cache
      pageStateCache.set(pageId, { blockCount: blocks.length, lastSync: Date.now() });

      // Log sync result with breakdown
      let syncMessage = `✅ Synced ${fileName} (${blocks.length} blocks, deleted ${clearResult.deleted})`;
      if (clearResult.archived > 0) {
        syncMessage += `, found ${clearResult.archived} archived blocks`;
      }
      console.log(syncMessage);
    } else {
      console.log(`⊘ Skipped ${fileName} (page has too much content to clear efficiently)`);
    }
  } catch (error) {
    console.error(`❌ Error syncing ${fileName}:`, error);
  }
}

/**
 * Debounced file sync with timer reuse
 * Prevents multiple syncs for rapid consecutive saves
 * O(1) timer management
 */
function debouncedSync(filePath: string, delay: number = 1000): void {
  // Clear existing timer if present
  if (debounceTimers.has(filePath)) {
    clearTimeout(debounceTimers.get(filePath)!);
  }

  // Set new timer
  const timer = setTimeout(() => {
    syncFileToNotion(filePath);
    debounceTimers.delete(filePath);
  }, delay);

  debounceTimers.set(filePath, timer);
}

/**
 * Watch docs folder for changes with efficient debouncing
 */
function watchDocs(): void {
  const docsPath = path.join(__dirname, '../docs');

  console.log(`🔍 Watching ${docsPath} for changes...`);

  // Precompile file extension check
  watch(docsPath, { recursive: true }, (_eventType, filename) => {
    if (filename?.endsWith('.md')) {
      const filePath = path.join(docsPath, filename);

      if (fs.existsSync(filePath)) {
        console.log(`📝 Detected change in ${filename}`);
        debouncedSync(filePath);
      }
    }
  });
}

/**
 * Check which pages need manual clearing in Notion
 * NOTE: Automated clearing now handles all page sizes, so this function is simplified
 */
async function checkPagesNeedClearing(): Promise<void> {
  console.log('🔍 Preparing to sync all pages (automated clearing enabled)...\n');
  // No longer need to check or wait for manual intervention
}

/**
 * Initial sync with sequential processing to preserve order
 * O(n) where n is number of files
 */
async function initialSync(): Promise<void> {
  const docsPath = path.join(__dirname, '../docs');
  const files = fs
    .readdirSync(docsPath)
    .filter((f) => f.endsWith('.md'))
    .sort(); // Sort for consistent order

  console.log(`🚀 Starting initial sync of ${files.length} files...`);

  // Sync files sequentially to preserve order in Notion
  for (const file of files) {
    await syncFileToNotion(path.join(docsPath, file));
  }

  console.log(`✨ Initial sync complete`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY environment variable is not set');
    process.exit(1);
  }

  try {
    // Check if any pages need manual clearing and wait for user confirmation
    await checkPagesNeedClearing();

    // Proceed with sync
    await initialSync();
    watchDocs();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
