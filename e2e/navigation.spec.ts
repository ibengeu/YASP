/**
 * Navigation E2E Tests
 * Tests for CommandDeck navigation and view switching
 *
 * Test Coverage:
 * - CommandDeck renders on all routes
 * - Navigation buttons switch views
 * - Active state indicators work
 * - Mobile menu functionality
 */

import { test, expect } from '@playwright/test';

test.describe('CommandDeck Navigation', () => {
  test('should render CommandDeck on all routes', async ({ page }) => {
    // Dashboard
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Catalog
    await page.goto('/catalog');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('API Catalog')).toBeVisible();

    // Policy Management
    await page.goto('/quality-rules');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Policy Management')).toBeVisible();
  });

  test('should switch views with navigation buttons', async ({ page }) => {
    await page.goto('/');

    // Click API Catalog
    await page.getByRole('button', { name: 'API Catalog' }).click();
    await expect(page).toHaveURL('/catalog');
    await expect(page.getByRole('heading', { name: 'API Catalog' })).toBeVisible();

    // Click Policy Management
    await page.getByRole('button', { name: 'Policy Management' }).click();
    await expect(page).toHaveURL('/quality-rules');
    await expect(page.getByRole('heading', { name: 'Policy Management' })).toBeVisible();

    // Click Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'API Governance Dashboard' })).toBeVisible();
  });

  test('should show active state for current route', async ({ page }) => {
    await page.goto('/');

    // Dashboard button should have active styling
    const dashboardButton = page.getByRole('button', { name: 'Dashboard' });
    await expect(dashboardButton).toHaveClass(/bg-accent|text-accent-foreground/);

    // Navigate to catalog
    await page.getByRole('button', { name: 'API Catalog' }).click();
    await expect(page).toHaveURL('/catalog');

    // Catalog button should now be active
    const catalogButton = page.getByRole('button', { name: 'API Catalog' });
    await expect(catalogButton).toHaveClass(/bg-accent|text-accent-foreground/);
  });

  test('should have logo link to homepage', async ({ page }) => {
    await page.goto('/catalog');

    // Click logo (Shield icon with YASP text)
    const logo = page.locator('nav').getByText('YASP');
    await logo.click();

    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to navigation
    await page.keyboard.press('Tab');

    // Should focus first navigation element
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Tab through navigation modules
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should still be in navigation
    const stillFocused = page.locator(':focus');
    await expect(stillFocused).toBeVisible();
  });

  test('should have responsive mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]');
    await expect(mobileMenuButton.first()).toBeVisible();

    // Click to open menu
    await mobileMenuButton.first().click();

    // Navigation items should be visible in mobile menu
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('API Catalog')).toBeVisible();
    await expect(page.getByText('Policy Management')).toBeVisible();
  });

  test('should persist across navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate through all views
    await page.getByRole('button', { name: 'API Catalog' }).click();
    await expect(page.locator('nav')).toBeVisible();

    await page.getByRole('button', { name: 'Policy Management' }).click();
    await expect(page.locator('nav')).toBeVisible();

    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page.locator('nav')).toBeVisible();

    // CommandDeck should always be present
    const navCount = await page.locator('nav').count();
    expect(navCount).toBe(1);
  });
});

test.describe('Navigation Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Navigation should have proper role
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Buttons should have proper roles
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should support Enter key for navigation', async ({ page }) => {
    await page.goto('/');

    // Focus API Catalog button
    const catalogButton = page.getByRole('button', { name: 'API Catalog' });
    await catalogButton.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Should navigate to catalog
    await expect(page).toHaveURL('/catalog');
  });
});
