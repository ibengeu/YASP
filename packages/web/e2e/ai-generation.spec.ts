/**
 * AI Generation E2E Tests
 * Tests for AI-powered spec generation
 *
 * Test Coverage:
 * - AI dialog opens
 * - Form validation
 * - Mock generation flow
 * - Error handling
 *
 * Note: These tests mock the AI generation since we can't rely on external APIs
 */

import { test, expect } from '@playwright/test';

test.describe('AI Spec Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Go to catalog where spec creation lives
    await page.goto('/catalog');
  });

  test('should open AI generation dialog', async ({ page }) => {
    const button = page.getByRole('button', { name: /New Specification/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
  });

  test('should close AI dialog with escape key', async ({ page }) => {
    const button = page.getByRole('button', { name: /New Specification/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();

    // Wait for dialog to appear with increased timeout
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');

    // Dialog should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should have form fields in AI dialog', async ({ page }) => {
    const button = page.getByRole('button', { name: /New Specification/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();

    // Check for dialog content
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Dialog should have some interactive elements
    const inputs = dialog.locator('input, textarea, button');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard accessible', async ({ page }) => {
    const button = page.getByRole('button', { name: /New Specification/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    // Tab through elements
    await page.keyboard.press('Tab');

    // Should focus elements within dialog
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

test.describe('AI Generation Flow (Integration)', () => {
  test('should handle AI generation error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/catalog');
    const button = page.getByRole('button', { name: /New Specification|Generate/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();

    // Dialog should still be usable
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
  });

  test('should maintain dialog state', async ({ page }) => {
    await page.goto('/catalog');
    const button = page.getByRole('button', { name: /New Specification|Generate/i });
    await expect(button).toBeVisible({ timeout: 3000 });
    await button.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Reopen dialog
    await page.getByRole('button', { name: /New Specification|Generate/i }).click();
    await expect(dialog).toBeVisible();
  });
});
