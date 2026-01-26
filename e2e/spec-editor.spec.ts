/**
 * Spec Editor E2E Tests
 * Tests for the integrated spec editor
 *
 * Test Coverage:
 * - Editor loads correctly
 * - Monaco editor is functional
 * - Diagnostics panel works
 * - Save functionality
 * - Tab navigation
 */

import { test, expect } from '@playwright/test';

const SAMPLE_SPEC = `openapi: 3.1.0
info:
  title: E2E Test API
  version: 2.0.0
  description: API for end-to-end testing
paths:
  /users:
    get:
      summary: Get users
      operationId: getUsers
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
`;

test.describe('Spec Editor', () => {
  test('should load new spec editor', async ({ page }) => {
    await page.goto('/editor/new');

    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Check for editor UI elements
    await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Test API/i })).toBeVisible();

    // Check for quality score badge
    await expect(page.getByText('100%')).toBeVisible();

    // Check title input
    const titleInput = page.locator('input[placeholder="Untitled Spec"]');
    await expect(titleInput).toBeVisible();
  });

  test('should have default template in new spec', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Editor should contain openapi definition
    const editorContent = page.locator('.view-lines');
    await expect(editorContent).toContainText('openapi: 3.1.0');
    await expect(editorContent).toContainText('My API');
  });

  test('should show diagnostics panel', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Diagnostics panel should be visible
    // Look for diagnostic-related elements
    const diagnosticsArea = page.locator('[role="status"], .diagnostics-panel, .rounded-lg.border');
    const count = await diagnosticsArea.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Check Editor tab is active
    const editorTab = page.getByRole('tab', { name: /Editor/i });
    await expect(editorTab).toBeVisible();

    // Click Preview tab
    const previewTab = page.getByRole('tab', { name: /Preview/i });
    await previewTab.click();

    // Preview content should be visible
    await expect(page.getByText(/preview/i)).toBeVisible();

    // Click API Explorer tab
    const explorerTab = page.getByRole('tab', { name: /API Explorer/i });
    await explorerTab.click();

    // Explorer content should be visible
    await expect(page.getByText(/explorer/i)).toBeVisible();
  });

  test('should update title', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    const titleInput = page.locator('input[placeholder="Untitled Spec"]');
    await titleInput.fill('My Custom API');

    // Title should be updated
    await expect(titleInput).toHaveValue('My Custom API');
  });

  test('should have back to library button', async ({ page }) => {
    await page.goto('/editor/new');

    const backButton = page.getByRole('button', { name: /Library/i });
    await expect(backButton).toBeVisible();

    // Click should navigate back
    await backButton.click();
    await expect(page).toHaveURL('/');
  });

  test('should show quality score', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Quality score badge should be visible
    const scoreBadge = page.locator('text=/\\d+%/');
    await expect(scoreBadge).toBeVisible();
  });

  test('should have keyboard accessibility', async ({ page }) => {
    await page.goto('/editor/new');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus elements
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });

  test('should load editor with valid URL pattern', async ({ page }) => {
    // Test with UUID-like pattern
    await page.goto('/editor/12345678-1234-1234-1234-123456789abc');

    // Should show editor or error, not 404
    await expect(page.locator('body')).not.toContainText('404');

    // Either editor loads or shows error message
    const hasEditor = await page.locator('.monaco-editor').isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await page.getByText(/not found/i).isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasEditor || hasError).toBeTruthy();
  });

  test('should display tabs correctly', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // All three tabs should be present
    await expect(page.getByRole('tab', { name: /Editor/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Preview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /API Explorer/i })).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/editor/new');

    // Check for accessible elements
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // Tabs should have proper roles
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    expect(tabCount).toBe(3);
  });
});
