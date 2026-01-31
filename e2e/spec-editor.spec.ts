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
  test('should load new spec editor with score cards', async ({ page }) => {
    await page.goto('/editor/new');

    // Wait for editor to load
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Check for score cards in API details view
    await expect(page.getByText('Compliance Score')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Security Score')).toBeVisible();

    // Check for Test API button (opens drawer)
    await expect(page.getByRole('button', { name: /Test API/i })).toBeVisible();

    // Check title input
    const titleInput = page.locator('input[placeholder="Untitled Spec"]');
    await expect(titleInput).toBeVisible();
  });

  test('should have default template in new spec', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Editor should contain openapi definition (check content container)
    const editorContent = page.locator('.cm-content');
    await expect(editorContent).toContainText('openapi: 3.1.0');
    await expect(editorContent).toContainText('My API');
  });

  test('should show diagnostics panel', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Diagnostics panel should be visible with "No issues found" message
    await expect(page.getByText(/No issues found/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Diagnostics/i).first()).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Check Editor tab is active
    const editorTab = page.getByRole('tab', { name: /Editor/i });
    await expect(editorTab).toBeVisible();

    // Click Preview tab
    const previewTab = page.getByRole('tab', { name: /Preview/i });
    await previewTab.click();

    // Preview content should be visible (check for "API Documentation Preview")
    await expect(page.getByText(/API Documentation Preview/i)).toBeVisible({ timeout: 3000 });

    // Click API Explorer tab
    const explorerTab = page.getByRole('tab', { name: /API Explorer/i });
    await explorerTab.click();

    // Explorer content should be visible - now shows actual Try It Out component with endpoint selector
    await expect(page.getByText(/Select Endpoint/i)).toBeVisible({ timeout: 3000 });
  });

  test('should update title', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    const titleInput = page.locator('input[placeholder="Untitled Spec"]');
    await titleInput.fill('My Custom API');

    // Title should be updated
    await expect(titleInput).toHaveValue('My Custom API');
  });

  test('should have back to catalog button', async ({ page }) => {
    await page.goto('/editor/new');

    const backButton = page.getByRole('button', { name: /Back to Catalog/i });
    await expect(backButton).toBeVisible();

    // Click should navigate back to catalog
    await backButton.click();
    await expect(page).toHaveURL('/catalog');
  });

  test('should show quality score', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

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
    const hasEditor = await page.locator('.cm-editor').isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await page.getByText(/not found/i).isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasEditor || hasError).toBeTruthy();
  });

  test('should display tabs correctly', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

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
