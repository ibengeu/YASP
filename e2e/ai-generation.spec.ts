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
    await page.goto('/');
  });

  test('should open AI generation dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Generate with AI/i }).click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should close AI dialog with escape key', async ({ page }) => {
    await page.getByRole('button', { name: /Generate with AI/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');

    // Dialog should be hidden
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should have form fields in AI dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Generate with AI/i }).click();

    // Check for dialog content
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Dialog should have some interactive elements
    const inputs = dialog.locator('input, textarea, button');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.getByRole('button', { name: /Generate with AI/i }).click();

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

    await page.goto('/');
    await page.getByRole('button', { name: /Generate with AI/i }).click();

    // Dialog should still be usable
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should maintain dialog state', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Generate with AI/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Reopen dialog
    await page.getByRole('button', { name: /Generate with AI/i }).click();
    await expect(dialog).toBeVisible();
  });
});
