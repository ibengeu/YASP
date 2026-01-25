import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

interface TrashStats {
  totalArchivedBlocks: number;
  totalArchivedPages: number;
  totalDeletedBlocks: number;
  totalDeletedPages: number;
  errors: string[];
}

/**
 * Recursively get all blocks from a page (archived and non-archived)
 * Handles pagination to retrieve all blocks
 */
async function getAllBlocks(blockId: string, archived: boolean | null = null): Promise<any[]> {
  const allBlocks: any[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  while (hasMore) {
    try {
      const response: any = await notion.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: cursor,
      });

      const blocks = response.results;

      // Filter by archived status if specified
      if (archived !== null) {
        const filtered = blocks.filter((b: any) => b.archived === archived);
        allBlocks.push(...filtered);
      } else {
        allBlocks.push(...blocks);
      }

      hasMore = response.has_more;
      cursor = response.next_cursor;
    } catch (error: any) {
      // If cursor becomes invalid, restart without cursor
      if (error.code === 'validation_error' && error.message?.includes('start_cursor')) {
        cursor = undefined;
        hasMore = false;
      } else {
        throw error;
      }
    }
  }

  return allBlocks;
}

/**
 * Recursively find and delete archived blocks in a page
 * Returns count of deleted blocks
 */
async function deleteArchivedBlocks(blockId: string, depth: number = 0): Promise<number> {
  let deletedCount = 0;
  const indent = '  '.repeat(depth);

  try {
    // Get only archived blocks at this level
    const archivedBlocks = await getAllBlocks(blockId, true);

    if (archivedBlocks.length > 0) {
      console.log(`${indent}Found ${archivedBlocks.length} archived blocks`);

      // Delete archived blocks
      for (const block of archivedBlocks) {
        try {
          await notion.blocks.delete({ block_id: block.id });
          deletedCount++;
          console.log(`${indent}✓ Deleted archived block: ${block.id}`);
        } catch (error) {
          console.warn(`${indent}⚠ Failed to delete block ${block.id}:`, error);
        }
      }
    }

    // Recursively process child blocks (get all non-archived ones to traverse)
    const allBlocks = await getAllBlocks(blockId, false);
    for (const block of allBlocks) {
      if (block.has_children) {
        deletedCount += await deleteArchivedBlocks(block.id, depth + 1);
      }
    }
  } catch (error) {
    console.error(`${indent}Error processing block ${blockId}:`, error);
  }

  return deletedCount;
}

/**
 * Search for all pages in workspace (paginated)
 * Optionally filter by archived status
 */
async function getAllPages(archived: boolean | null = null): Promise<any[]> {
  const allPages: any[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  while (hasMore) {
    try {
      const response: any = await notion.search({
        filter: {
          property: 'object',
          value: 'page',
        },
        page_size: 100,
        start_cursor: cursor,
      });

      let pages = response.results.filter((p: any) => p.object === 'page');

      // Filter by archived status if specified
      if (archived !== null) {
        pages = pages.filter((p: any) => p.archived === archived);
      }

      allPages.push(...pages);
      hasMore = response.has_more;
      cursor = response.next_cursor;
    } catch (error: any) {
      if (error.code === 'validation_error' && error.message?.includes('start_cursor')) {
        cursor = undefined;
        hasMore = false;
      } else {
        throw error;
      }
    }
  }

  return allPages;
}

/**
 * Delete a page permanently
 */
async function deletePage(pageId: string): Promise<boolean> {
  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
    return true;
  } catch (error) {
    console.warn(`⚠ Failed to archive page ${pageId}:`, error);
    return false;
  }
}

/**
 * Clean trash: Delete all archived blocks and pages
 * No arguments needed - automatically finds and removes archived content
 */
async function cleanAllTrash(): Promise<TrashStats> {
  const stats: TrashStats = {
    totalArchivedBlocks: 0,
    totalArchivedPages: 0,
    totalDeletedBlocks: 0,
    totalDeletedPages: 0,
    errors: [],
  };

  console.log('🗑️  Scanning workspace for archived content...\n');

  // Find all archived pages
  try {
    console.log('📄 Finding archived pages...');
    const archivedPages = await getAllPages(true);
    stats.totalArchivedPages = archivedPages.length;

    if (archivedPages.length > 0) {
      console.log(`Found ${archivedPages.length} archived pages\n`);

      for (const page of archivedPages) {
        console.log(`🗑️  Deleting archived page: ${page.id}`);
        const deleted = await deletePage(page.id);
        if (deleted) {
          stats.totalDeletedPages++;
          console.log(`✓ Archived page: ${page.id}\n`);
        } else {
          stats.errors.push(`Failed to delete page ${page.id}`);
        }
      }
    } else {
      console.log('✓ No archived pages found\n');
    }
  } catch (error) {
    const err = `Error scanning for archived pages: ${error}`;
    stats.errors.push(err);
    console.error(`❌ ${err}`);
  }

  // Find all active pages and clean their archived blocks
  try {
    console.log('🔍 Finding active pages to clean archived blocks...');
    const activePages = await getAllPages(false);
    console.log(`Found ${activePages.length} active pages\n`);

    for (const page of activePages) {
      try {
        console.log(`Checking page: ${page.id}`);
        const deletedCount = await deleteArchivedBlocks(page.id);

        if (deletedCount > 0) {
          stats.totalDeletedBlocks += deletedCount;
          stats.totalArchivedBlocks += deletedCount;
          console.log(`✓ Deleted ${deletedCount} archived blocks from this page\n`);
        }
      } catch (error) {
        const err = `Error cleaning page ${page.id}: ${error}`;
        stats.errors.push(err);
        console.error(`❌ ${err}`);
      }
    }
  } catch (error) {
    const err = `Error scanning for active pages: ${error}`;
    stats.errors.push(err);
    console.error(`❌ ${err}`);
  }

  return stats;
}

/**
 * Clean trash for specific pages by ID
 */
async function cleanSpecificPages(pageIds: string[]): Promise<TrashStats> {
  const stats: TrashStats = {
    totalArchivedBlocks: 0,
    totalArchivedPages: 0,
    totalDeletedBlocks: 0,
    totalDeletedPages: 0,
    errors: [],
  };

  console.log(`🗑️  Cleaning ${pageIds.length} page(s)...\n`);

  for (const pageId of pageIds) {
    try {
      console.log(`Cleaning page: ${pageId}`);
      const deletedCount = await deleteArchivedBlocks(pageId);
      stats.totalDeletedBlocks += deletedCount;
      console.log(`✓ Deleted ${deletedCount} archived blocks\n`);
    } catch (error) {
      const err = `Error cleaning page ${pageId}: ${error}`;
      stats.errors.push(err);
      console.error(`❌ ${err}`);
    }
  }

  return stats;
}

/**
 * Print summary statistics
 */
function printSummary(stats: TrashStats): void {
  console.log('\n========== CLEANUP SUMMARY ==========');
  console.log(`Total archived pages deleted: ${stats.totalDeletedPages}`);
  console.log(`Total archived blocks deleted: ${stats.totalDeletedBlocks}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    stats.errors.forEach((err) => console.log(`  - ${err}`));
  }

  if (stats.totalDeletedBlocks === 0 && stats.totalDeletedPages === 0) {
    console.log('\n✅ Workspace is clean! No archived content found.');
  } else {
    console.log('\n✅ Cleanup complete!');
  }
  console.log('====================================\n');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY environment variable is not set');
    console.error('Set it with: export NOTION_API_KEY="your-token-here"');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  try {
    let stats: TrashStats;

    if (args.length === 0) {
      // No arguments: clean entire workspace
      stats = await cleanAllTrash();
    } else {
      // Specific page IDs provided
      stats = await cleanSpecificPages(args);
    }

    printSummary(stats);
    process.exit(stats.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
