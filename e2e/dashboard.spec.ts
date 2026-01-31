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

  test('should display dashboard with header and KPI cards', async ({ page }) => {
    // Check page header
    await expect(page.getByRole('heading', { name: 'API Governance Dashboard' })).toBeVisible();

    // Check description
    await expect(page.getByText('Leading indicators of API quality and compliance')).toBeVisible();

    // Check KPI cards are visible
    await expect(page.getByText('Spec / Lint Pass Rate')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Policy Coverage')).toBeVisible();
    await expect(page.getByText('Breaking Changes Prevented')).toBeVisible();
    await expect(page.getByText('Auth Coverage')).toBeVisible();

    // Check secondary KPIs
    await expect(page.getByText('Mean Time to Remediate')).toBeVisible();
    await expect(page.getByText('Deprecated API Usage')).toBeVisible();
    await expect(page.getByText('API Reuse Ratio')).toBeVisible();
  });

  test('should display KPI cards with sparklines and trends', async ({ page }) => {
    // Wait for KPI cards to load
    await page.waitForSelector('text=Spec / Lint Pass Rate', { timeout: 2000 });

    // Check for sparkline SVG elements
    const sparklines = page.locator('svg polyline');
    const count = await sparklines.count();
    expect(count).toBeGreaterThan(0);

    // Check for trend indicators (TrendingUp or TrendingDown icons)
    const trendIcons = page.locator('svg.lucide-trending-up, svg.lucide-trending-down');
    const trendCount = await trendIcons.count();
    expect(trendCount).toBeGreaterThan(0);
  });

  test('should display charts', async ({ page }) => {
    // Check for chart cards
    await expect(page.getByText('Quality Metrics Trend')).toBeVisible({ timeout: 2000 });
    await expect(page.getByText('Remediation Performance')).toBeVisible();

    // Check for Recharts SVG elements
    const charts = page.locator('svg.recharts-surface');
    const count = await charts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display violations table', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Spec / Lint Pass Rate', { timeout: 2000 });

    // Check for violations table
    await expect(page.getByText('Recent Violations')).toBeVisible();

    // Table should have headers
    const table = page.locator('table');
    const hasTable = await table.isVisible();
    expect(hasTable).toBe(true);
  });

  test('should have CommandDeck navigation', async ({ page }) => {
    // Check for CommandDeck fixed header
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check for navigation modules
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('API Catalog')).toBeVisible();
    await expect(page.getByText('Policy Management')).toBeVisible();

    // Check for dark mode toggle
    const darkModeButton = page.locator('button[aria-label*="dark mode"], button[aria-label*="theme"]');
    await expect(darkModeButton.first()).toBeVisible();
  });
});
