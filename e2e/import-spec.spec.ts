/**
 * Import Specification E2E Tests
 * Tests for importing specs via file, paste, and URL
 *
 * Test Coverage:
 * - File upload
 * - Paste from clipboard
 * - Import from URL
 * - Validation and error handling
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLE_OPENAPI_YAML = `openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
  description: Test API for E2E testing
paths:
  /test:
    get:
      summary: Test endpoint
      operationId: getTest
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
`;

test.describe('Import Specification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Open import dialog
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should import spec via paste', async ({ page }) => {
    // Switch to paste tab
    await page.getByRole('tab', { name: /Paste/i }).click();

    // Paste YAML content
    await page.locator('textarea').fill(SAMPLE_OPENAPI_YAML);

    // Click import button
    await page.getByRole('button', { name: /Import Specification/i }).click();

    // Should navigate to editor
    await expect(page).toHaveURL(/\/editor\/[a-f0-9-]+/);

    // Editor should contain the pasted content
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 5000 });

    // Check title was extracted
    const titleInput = page.locator('input[value="Test API"]');
    await expect(titleInput).toBeVisible();
  });

  test('should validate pasted content', async ({ page }) => {
    // Switch to paste tab
    await page.getByRole('tab', { name: /Paste/i }).click();

    // Paste invalid content
    await page.locator('textarea').fill('invalid yaml content {{{');

    // Click import button
    await page.getByRole('button', { name: /Import Specification/i }).click();

    // Should show error toast
    await expect(page.locator('[role="status"], .sonner-toast')).toContainText(/invalid/i, { timeout: 3000 });
  });

  test('should disable import button when paste area is empty', async ({ page }) => {
    // Switch to paste tab
    await page.getByRole('tab', { name: /Paste/i }).click();

    // Import button should be disabled
    const importButton = page.getByRole('button', { name: /Import Specification/i });
    await expect(importButton).toBeDisabled();

    // Type something
    await page.locator('textarea').fill('test');

    // Button should be enabled
    await expect(importButton).toBeEnabled();
  });

  test('should show file upload interface', async ({ page }) => {
    // File tab should be default
    await expect(page.getByRole('tab', { name: /File/i })).toHaveAttribute('data-state', 'active');

    // Check for upload UI
    await expect(page.getByText(/Click to upload or drag and drop/i)).toBeVisible();
    await expect(page.getByText(/YAML or JSON files/i)).toBeVisible();
  });

  test('should show URL import interface', async ({ page }) => {
    // Switch to URL tab
    await page.getByRole('tab', { name: /URL/i }).click();

    // Check for URL input
    const urlInput = page.locator('input[type="url"]');
    await expect(urlInput).toBeVisible();
    await expect(page.getByText(/Enter the URL/i)).toBeVisible();

    // Import button should be disabled when empty
    const importButton = page.getByRole('button', { name: /Import from URL/i });
    await expect(importButton).toBeDisabled();

    // Type URL
    await urlInput.fill('https://example.com/openapi.yaml');

    // Button should be enabled
    await expect(importButton).toBeEnabled();
  });

  test('should close dialog with close button', async ({ page }) => {
    // Find and click close button
    const closeButton = page.locator('[role="dialog"] button[aria-label="Close"], [role="dialog"] button').first();
    await closeButton.click();

    // Dialog should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close dialog on escape key', async ({ page }) => {
    await page.keyboard.press('Escape');

    // Dialog should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should handle file size validation message', async ({ page }) => {
    // File tab should show size limit
    await expect(page.getByText(/max 5MB/i)).toBeVisible();
  });
});
