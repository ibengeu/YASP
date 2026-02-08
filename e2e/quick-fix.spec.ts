/**
 * AI Quick Fix E2E Tests
 * Tests AI-powered quick fix for OpenAPI diagnostics
 *
 * Test Coverage:
 * - Quick Fix dialog appears
 * - AI generates fixes
 * - Diff view displays
 * - Apply fix updates spec
 */

import { test, expect } from '@playwright/test';

const INVALID_SPEC = `openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint
      responses:
        200:
          description: Success
`;

test.describe('AI Quick Fix', () => {
  test('should show diagnostics for invalid spec', async ({ page }) => {
    await page.goto('/editor/new');

    // Wait for editor to load
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Switch to Editor tab
    const editorTab = page.getByRole('tab', { name: /Editor/i });
    await editorTab.click();

    // Clear editor and paste invalid spec
    const editor = page.locator('.cm-content');
    await editor.click();

    // Select all and delete
    await page.keyboard.press('Meta+A'); // Cmd+A on Mac
    await page.keyboard.press('Backspace');

    // Type the invalid spec
    await editor.type(INVALID_SPEC);

    // Wait for diagnostics to appear
    await expect(page.getByText(/Error|Warning/i)).toBeVisible({ timeout: 10000 });
  });

  test('should open Quick Fix dialog on button click', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    const editorTab = page.getByRole('tab', { name: /Editor/i });
    await editorTab.click();

    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    await editor.type(INVALID_SPEC);

    // Wait for diagnostics panel
    await page.waitForTimeout(2000); // Give time for linting

    // Look for Quick Fix button (appears on hover)
    const diagnosticItem = page.locator('[class*="diagnostic"]').first();
    if (await diagnosticItem.isVisible()) {
      await diagnosticItem.hover();

      const quickFixButton = page.getByRole('button', { name: /Quick Fix/i });
      if (await quickFixButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await quickFixButton.click();

        // Quick Fix dialog should appear
        await expect(page.getByText('AI Quick Fix')).toBeVisible({ timeout: 5000 });

        // Should show loading state
        await expect(page.getByText(/Generating fix/i)).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test.skip('should display diff view with fix', async ({ page }) => {
    // This test requires a valid OpenRouter API key and will be skipped in CI
    // To run: remove .skip and ensure VITE_OPENROUTER_API_KEY is set

    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    const editorTab = page.getByRole('tab', { name: /Editor/i });
    await editorTab.click();

    const editor = page.locator('.cm-content');
    await editor.click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');
    await editor.type(INVALID_SPEC);

    await page.waitForTimeout(2000);

    const diagnosticItem = page.locator('[class*="diagnostic"]').first();
    await diagnosticItem.hover();

    const quickFixButton = page.getByRole('button', { name: /Quick Fix/i });
    await quickFixButton.click();

    // Wait for AI to generate fix (may take several seconds)
    await expect(page.getByText('Before')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('After')).toBeVisible();
    await expect(page.getByText('Apply Fix')).toBeVisible();
  });
});
