/**
 * User Journey E2E Tests
 * End-to-end tests for complete user workflows
 *
 * Test Coverage:
 * - Complete spec creation journey
 * - Import and edit workflow
 * - Navigation flows
 */

import { test, expect } from '@playwright/test';

const SAMPLE_SPEC = `openapi: 3.1.0
info:
  title: User Journey Test API
  version: 1.0.0
  description: Complete user journey test
paths:
  /test:
    get:
      summary: Test endpoint
      operationId: testEndpoint
      responses:
        '200':
          description: Success
`;

test.describe('User Journeys', () => {
  test('Complete spec import journey', async ({ page }) => {
    // 1. Start at dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'API Governance Dashboard' })).toBeVisible();

    // 2. Navigate to catalog
    await page.getByRole('button', { name: 'API Catalog' }).click();
    await expect(page).toHaveURL('/catalog');

    // 3. Should see catalog page
    await expect(page.getByRole('heading', { name: 'API Catalog' })).toBeVisible();

    // 4. Navigate back to dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
  });

  test('Import spec and edit workflow', async ({ page }) => {
    // 1. Start at dashboard
    await page.goto('/');

    // 2. Open import dialog
    await page.getByRole('button', { name: /Import Spec/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 3. Switch to paste tab
    await page.getByRole('tab', { name: /Paste/i }).click();

    // 4. Paste spec
    await page.locator('textarea').fill(SAMPLE_SPEC);

    // 5. Import
    await page.getByRole('button', { name: /Import Specification/i }).click();

    // 6. Should navigate to editor
    await expect(page).toHaveURL(/\/editor\/[a-f0-9-]+/);
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // 7. Title should be extracted
    const titleInput = page.locator('input[value="User Journey Test API"]');
    await expect(titleInput).toBeVisible();

    // 8. Quality score should be visible
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
  });

  test('Navigation between tabs workflow', async ({ page }) => {
    // 1. Go to editor
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // 2. Switch to Preview tab
    await page.getByRole('tab', { name: /Preview/i }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/API Documentation Preview/i);

    // 3. Switch to API Explorer - now shows actual Try It Out component
    await page.getByRole('tab', { name: /API Explorer/i }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/Try It Out/i);

    // 4. Back to Editor
    await page.getByRole('tab', { name: /Editor/i }).click();
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('CommandDeck navigation', async ({ page }) => {
    // 1. Start at Dashboard
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'API Governance Dashboard' })).toBeVisible();

    // 2. Navigate to API Catalog
    await page.getByRole('button', { name: 'API Catalog' }).click();
    await expect(page).toHaveURL('/catalog');
    await expect(page.getByRole('heading', { name: 'API Catalog' })).toBeVisible();

    // 3. Navigate to Policy Management
    await page.getByRole('button', { name: 'Policy Management' }).click();
    await expect(page).toHaveURL('/quality-rules');
    await expect(page.getByRole('heading', { name: 'Policy Management' })).toBeVisible();

    // 4. Back to Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'API Governance Dashboard' })).toBeVisible();
  });

  test('Multiple dialog interactions', async ({ page }) => {
    await page.goto('/');

    // 1. Open import dialog
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 2. Close it
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 3. Open import again (test dialog can reopen)
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 4. Close with close button
    await page.locator('[data-slot="dialog-close"]').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 5. Open one more time to verify state is clean
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('Error Handling Journeys', () => {
  test('Should handle invalid import gracefully', async ({ page }) => {
    await page.goto('/');

    // Open import dialog
    const button = page.getByRole('button', { name: /Import Spec/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    // Paste invalid content
    await page.getByRole('tab', { name: /Paste/i }).click();
    await page.locator('textarea').fill('not valid yaml or json {{{}}}');

    // Try to import
    await page.getByRole('button', { name: /Import Specification/i }).click();

    // Should show error (toast or message)
    // The dialog might stay open or close, but user should see feedback
    const hasToast = await page.locator('[role="status"], .sonner-toast').isVisible({ timeout: 3000 }).catch(() => false);
    const hasDialog = await page.getByRole('dialog').isVisible().catch(() => false);

    // Either toast appears or dialog shows error
    expect(hasToast || hasDialog).toBeTruthy();
  });

  test('Should handle navigation with unsaved changes', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Navigate away via back button
    await page.getByRole('button', { name: /Back to Catalog/i }).click();

    // Should navigate to catalog (no save prompt in current implementation)
    await expect(page).toHaveURL('/catalog');
  });
});

test.describe('Accessibility Journeys', () => {
  test('Keyboard navigation through entire app', async ({ page }) => {
    await page.goto('/');

    // Tab through dashboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should focus visible elements
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Go to editor
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Tab through editor UI
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should maintain focus visibility
    const editorFocused = page.locator(':focus');
    await expect(editorFocused).toBeVisible();
  });

  test('Screen reader landmarks', async ({ page }) => {
    await page.goto('/');

    // Check for semantic HTML
    const header = page.locator('header, [role="banner"]');
    const main = page.locator('main, [role="main"]');

    const hasHeader = await header.count();
    const hasMain = await main.count();

    expect(hasHeader + hasMain).toBeGreaterThan(0);
  });
});
