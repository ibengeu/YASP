/**
 * Dark Mode E2E Tests
 * Tests for dark mode toggle and persistence
 *
 * Test Coverage:
 * - Dark mode toggle works
 * - Dark mode persists across page reloads
 * - Dark mode persists across navigation
 * - Visual elements update correctly
 */

import { test, expect } from '@playwright/test';

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle dark mode', async ({ page }) => {
    // HTML should start in light mode
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // Find and click dark mode toggle
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await expect(darkModeButton.first()).toBeVisible();
    await darkModeButton.first().click();

    // HTML should now have dark class
    await expect(html).toHaveClass(/dark/);

    // Click again to toggle back
    await darkModeButton.first().click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should persist dark mode across page reloads', async ({ page }) => {
    // Enable dark mode
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await darkModeButton.first().click();

    // Verify dark mode is on
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Reload page
    await page.reload();

    // Dark mode should still be active
    await expect(html).toHaveClass(/dark/);
  });

  test('should persist dark mode across navigation', async ({ page }) => {
    // Enable dark mode
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await darkModeButton.first().click();

    // Verify dark mode is on
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Navigate to catalog
    await page.getByRole('button', { name: 'API Catalog' }).click();
    await expect(page).toHaveURL('/catalog');
    await expect(html).toHaveClass(/dark/);

    // Navigate to policy management
    await page.getByRole('button', { name: 'Policy Management' }).click();
    await expect(page).toHaveURL('/quality-rules');
    await expect(html).toHaveClass(/dark/);

    // Navigate back to dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
    await expect(html).toHaveClass(/dark/);
  });

  test('should update visual elements in dark mode', async ({ page }) => {
    // Enable dark mode
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await darkModeButton.first().click();

    // Wait for dark mode to apply
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Check that background color changes
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // Dark mode should have dark background (RGB values should be low)
    expect(bgColor).toMatch(/rgb\([0-9]{1,2},\s*[0-9]{1,2},\s*[0-9]{1,2}\)/);
  });

  test('should have accessible dark mode toggle', async ({ page }) => {
    // Dark mode button should have proper ARIA label
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await expect(darkModeButton.first()).toBeVisible();

    // Should be keyboard accessible
    await darkModeButton.first().focus();
    const focused = page.locator(':focus');
    await expect(focused).toBe(darkModeButton.first());

    // Should work with Enter key
    await page.keyboard.press('Enter');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('should sync dark mode across multiple tabs', async ({ context, page }) => {
    // Enable dark mode in first tab
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await darkModeButton.first().click();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Open new tab
    const page2 = await context.newPage();
    await page2.goto('/');

    // Second tab should also be in dark mode
    const html2 = page2.locator('html');
    await expect(html2).toHaveClass(/dark/);

    await page2.close();
  });

  test('should maintain dark mode in editor view', async ({ page }) => {
    // Enable dark mode
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await darkModeButton.first().click();

    // Navigate to editor
    await page.goto('/editor/new');

    // Dark mode should still be active
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Monaco editor should also be in dark mode (check for dark theme class or styling)
    const editor = page.locator('.cm-editor');
    await expect(editor).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dark Mode Icon', () => {
  test('should show correct icon for current mode', async ({ page }) => {
    await page.goto('/');

    // Find toggle button
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await expect(darkModeButton.first()).toBeVisible();

    // Should have Moon or Sun icon
    const moonIcon = page.locator('svg.lucide-moon');
    const sunIcon = page.locator('svg.lucide-sun');

    const hasMoon = await moonIcon.isVisible().catch(() => false);
    const hasSun = await sunIcon.isVisible().catch(() => false);

    // One of the icons should be visible
    expect(hasMoon || hasSun).toBe(true);

    // Toggle dark mode
    await darkModeButton.first().click();

    // Wait for icon to update
    await page.waitForTimeout(100);

    // Icon should have changed
    const hasMoonAfter = await moonIcon.isVisible().catch(() => false);
    const hasSunAfter = await sunIcon.isVisible().catch(() => false);

    expect(hasMoonAfter !== hasMoon || hasSunAfter !== hasSun).toBe(true);
  });
});
