/**
 * Workbench Navigation E2E Tests
 * Verifies navigation between Collections and IDE Workbench,
 * and that the workbench page renders the IDE layout correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Workbench Navigation', () => {
  test('clicking Workbench in header nav navigates to /workbench', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    const workbenchLink = page.locator('header nav a', { hasText: 'Workbench' });
    await expect(workbenchLink).toBeVisible({ timeout: 5000 });

    await workbenchLink.click();
    await page.waitForURL('**/workbench', { timeout: 5000 });

    expect(page.url()).toContain('/workbench');
  });

  test('workbench page renders IDE layout after navigation', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    await page.locator('header nav a', { hasText: 'Workbench' }).click();
    await page.waitForURL('**/workbench', { timeout: 5000 });

    // Status bar footer with git branch
    await expect(page.locator('footer').filter({ hasText: 'main' })).toBeVisible({ timeout: 5000 });

    // Empty state message visible when no spec is loaded
    await expect(page.getByText('Open a spec from Collections to start editing.')).toBeVisible();
  });

  test('workbench page loads directly at /workbench', async ({ page }) => {
    await page.goto('/workbench');
    await page.waitForLoadState('networkidle');

    // Header nav is present
    await expect(page.locator('header')).toBeVisible({ timeout: 5000 });

    // Status bar with git branch visible
    await expect(page.locator('footer').filter({ hasText: 'main' })).toBeVisible({ timeout: 5000 });
  });

  test('navigating back to Collections from Workbench works', async ({ page }) => {
    await page.goto('/workbench');
    await page.waitForLoadState('networkidle');

    const collectionsLink = page.locator('header nav a', { hasText: 'Collections' });
    await expect(collectionsLink).toBeVisible({ timeout: 5000 });

    await collectionsLink.click();
    await page.waitForURL('**/catalog', { timeout: 5000 });

    expect(page.url()).toContain('/catalog');
    await expect(page.getByText('API Collections')).toBeVisible({ timeout: 5000 });
  });

  test('workbench left sidebar has Files and History tabs', async ({ page }) => {
    await page.goto('/workbench');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('aside').first().getByRole('tab', { name: 'Files' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('aside').first().getByRole('tab', { name: 'History' })).toBeVisible();
  });

  test('workbench right sidebar has Preview and Issues tabs', async ({ page }) => {
    await page.goto('/workbench');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('aside').last().getByRole('tab', { name: 'Preview' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('aside').last().getByRole('tab', { name: /Issues/ })).toBeVisible();
  });
});
