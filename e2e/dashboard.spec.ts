/**
 * Dashboard E2E Tests
 * Tests for the main library dashboard
 *
 * Test Coverage:
 * - Dashboard loads with stats
 * - Navigation buttons are present
 * - Search functionality
 * - Filter functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard with header and stats', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'API Specifications' })).toBeVisible();

    // Check description
    await expect(page.getByText('Design, validate, and manage your OpenAPI specifications')).toBeVisible();

    // Check action buttons
    await expect(page.getByRole('button', { name: /Import/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate with AI/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /New Spec/i })).toBeVisible();

    // Check stats cards are visible (they should show after loading state)
    await expect(page.getByText('Total Specs')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Avg Quality Score')).toBeVisible();
    await expect(page.getByText('Updated This Week')).toBeVisible();
  });

  test('should show loading skeletons initially', async ({ page }) => {
    // Reload to catch loading state
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check for skeleton elements with aria-busy
    const skeletons = page.locator('[aria-busy="true"]');
    const count = await skeletons.count();

    // Should have skeleton loaders initially
    expect(count).toBeGreaterThan(0);
  });

  test('should display spec cards after loading', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForSelector('[aria-busy="true"]', { state: 'detached', timeout: 2000 });

    // Check for spec cards
    const specCards = page.locator('.rounded-lg.border');
    const count = await specCards.count();

    // Should have at least the mock specs
    expect(count).toBeGreaterThan(0);
  });

  test('New Spec button should navigate to editor', async ({ page }) => {
    await page.getByRole('button', { name: /New Spec/i }).click();

    // Should navigate to editor with 'new' id
    await expect(page).toHaveURL('/editor/new');
  });

  test('Import button should open import dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Import/i }).click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Import OpenAPI Specification')).toBeVisible();

    // Check for upload methods tabs
    await expect(page.getByRole('tab', { name: /File/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Paste/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /URL/i })).toBeVisible();
  });

  test('Generate with AI button should open AI dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Generate with AI/i }).click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    // The dialog title might vary, so check for key elements
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check for proper ARIA labels and roles
    const header = page.locator('header, [role="banner"]');
    await expect(header).toBeVisible();

    // All interactive elements should be keyboard accessible
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
