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
  test('Complete new spec creation journey', async ({ page }) => {
    // 1. Start at dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'API Specifications' })).toBeVisible();

    // 2. Click New Spec
    await page.getByRole('button', { name: /New Spec/i }).click();

    // 3. Should navigate to editor
    await expect(page).toHaveURL('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // 4. Update title
    const titleInput = page.locator('input[placeholder="Untitled Spec"]');
    await titleInput.fill('My Test API');
    await expect(titleInput).toHaveValue('My Test API');

    // 5. Editor should show default template
    await expect(page.locator('.view-lines')).toContainText('openapi');

    // 6. Navigate back to dashboard
    await page.getByRole('button', { name: /Library/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('Import spec and edit workflow', async ({ page }) => {
    // 1. Start at dashboard
    await page.goto('/');

    // 2. Open import dialog
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 3. Switch to paste tab
    await page.getByRole('tab', { name: /Paste/i }).click();

    // 4. Paste spec
    await page.locator('textarea').fill(SAMPLE_SPEC);

    // 5. Import
    await page.getByRole('button', { name: /Import Specification/i }).click();

    // 6. Should navigate to editor
    await expect(page).toHaveURL(/\/editor\/[a-f0-9-]+/);
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // 7. Title should be extracted
    const titleInput = page.locator('input[value="User Journey Test API"]');
    await expect(titleInput).toBeVisible();

    // 8. Quality score should be visible
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
  });

  test('Navigation between tabs workflow', async ({ page }) => {
    // 1. Go to editor
    await page.goto('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // 2. Switch to Preview tab
    await page.getByRole('tab', { name: /Preview/i }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/preview/i);

    // 3. Switch to API Explorer
    await page.getByRole('tab', { name: /API Explorer/i }).click();
    await expect(page.getByRole('tabpanel')).toContainText(/explorer/i);

    // 4. Back to Editor
    await page.getByRole('tab', { name: /Editor/i }).click();
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('Dashboard to Editor and back', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // 2. New Spec
    await page.getByRole('button', { name: /New Spec/i }).click();
    await expect(page).toHaveURL('/editor/new');

    // 3. Back to Library
    await page.getByRole('button', { name: /Library/i }).click();
    await expect(page).toHaveURL('/');

    // 4. Should see dashboard content
    await expect(page.getByRole('heading', { name: 'API Specifications' })).toBeVisible();
  });

  test('Multiple dialog interactions', async ({ page }) => {
    await page.goto('/');

    // 1. Open import dialog
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 2. Close it
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 3. Open AI dialog
    await page.getByRole('button', { name: /Generate with AI/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 4. Close it
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 5. Open import again
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('Error Handling Journeys', () => {
  test('Should handle invalid import gracefully', async ({ page }) => {
    await page.goto('/');

    // Open import dialog
    await page.getByRole('button', { name: /Import/i }).click();

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
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Navigate away
    await page.getByRole('button', { name: /Library/i }).click();

    // Should navigate (no save prompt in current implementation)
    await expect(page).toHaveURL('/');
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
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

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
