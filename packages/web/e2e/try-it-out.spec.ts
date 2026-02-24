/**
 * Try It Out E2E Tests
 * Tests real API calls in the Try It Out drawer
 *
 * Test Coverage:
 * - Real API calls to public endpoints
 * - SSRF protection blocking private URLs
 * - Response display
 * - Error handling
 */

import { test, expect } from '@playwright/test';

test.describe('Try It Out - Real API Calls', () => {
  test('should make real GET request to public API', async ({ page }) => {
    // Navigate to editor with a spec
    await page.goto('/editor/new');

    // Wait for editor to load
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    // Wait for Docs tab to be available and click it
    const docsTab = page.getByRole('tab', { name: /Docs/i });
    await expect(docsTab).toBeVisible({ timeout: 5000 });
    await docsTab.click();

    // Wait for endpoint to appear and click Try It Out
    const tryButton = page.getByRole('button', { name: /Test API/i }).first();
    await expect(tryButton).toBeVisible({ timeout: 5000 });
    await tryButton.click();

    // Wait for drawer to open
    await expect(page.getByText('Try It Out')).toBeVisible({ timeout: 5000 });

    // Update URL to use a public test API
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.clear();
    await urlInput.fill('https://httpbin.org/get');

    // Click Send button
    const sendButton = page.getByRole('button', { name: /Send/i });
    await sendButton.click();

    // Wait for response (may take a few seconds)
    // Look for 200 status in the response
    await expect(page.getByText('200')).toBeVisible({ timeout: 15000 });
  });

  test('should prevent SSRF attacks with localhost', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    const docsTab = page.getByRole('tab', { name: /Docs/i });
    await expect(docsTab).toBeVisible({ timeout: 5000 });
    await docsTab.click();

    const tryButton = page.getByRole('button', { name: /Test API/i }).first();
    await expect(tryButton).toBeVisible({ timeout: 5000 });
    await tryButton.click();

    await expect(page.getByText('Try It Out')).toBeVisible({ timeout: 5000 });

    // Try to access localhost
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.clear();
    await urlInput.fill('http://localhost:8080/admin');

    const sendButton = page.getByRole('button', { name: /Send/i });
    await sendButton.click();

    // Should show error toast about blocked URL
    await expect(page.getByText(/blocked/i)).toBeVisible({ timeout: 5000 });
  });

  test('should prevent SSRF attacks with private IP', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    const docsTab = page.getByRole('tab', { name: /Docs/i });
    await expect(docsTab).toBeVisible({ timeout: 5000 });
    await docsTab.click();

    const tryButton = page.getByRole('button', { name: /Test API/i }).first();
    await expect(tryButton).toBeVisible({ timeout: 5000 });
    await tryButton.click();

    await expect(page.getByText('Try It Out')).toBeVisible({ timeout: 5000 });

    // Try to access private IP
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.clear();
    await urlInput.fill('http://192.168.1.1/api');

    const sendButton = page.getByRole('button', { name: /Send/i });
    await sendButton.click();

    // Should show error about blocked IP
    await expect(page.getByText(/private.*range/i)).toBeVisible({ timeout: 5000 });
  });

  test('should switch between tabs and configure request', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    const docsTab = page.getByRole('tab', { name: /Docs/i });
    await expect(docsTab).toBeVisible({ timeout: 5000 });
    await docsTab.click();

    const tryButton = page.getByRole('button', { name: /Test API/i }).first();
    await expect(tryButton).toBeVisible({ timeout: 5000 });
    await tryButton.click();

    await expect(page.getByText('API Testing Console')).toBeVisible({ timeout: 5000 });

    // Test Params tab
    const paramsTab = page.getByTestId('tab-params');
    await paramsTab.click();
    await expect(page.getByText(/Query and path parameters/i)).toBeVisible({ timeout: 3000 });

    // Test Auth tab
    const authTab = page.getByTestId('tab-auth');
    await authTab.click();
    await expect(page.getByText('Auth Type')).toBeVisible({ timeout: 3000 });

    // Select Bearer token
    const authSelect = page.locator('select').first();
    await authSelect.selectOption('bearer');
    await expect(page.getByPlaceholder('Enter bearer token')).toBeVisible();

    // Test Headers tab
    const headersTab = page.getByTestId('tab-headers');
    await headersTab.click();
    await expect(page.getByText(/HTTP headers to include/i)).toBeVisible({ timeout: 3000 });

    // Verify default headers exist
    await expect(page.locator('input[value="Content-Type"]')).toBeVisible();
    await expect(page.locator('input[value="Accept"]')).toBeVisible();

    // Test Body tab
    const bodyTab = page.getByTestId('tab-body');
    await bodyTab.click();
    // Check for CodeMirror editor
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 3000 });
  });

  test('should configure auth and make authenticated request', async ({ page }) => {
    await page.goto('/editor/new');
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 });

    const docsTab = page.getByRole('tab', { name: /Docs/i });
    await expect(docsTab).toBeVisible({ timeout: 5000 });
    await docsTab.click();

    const tryButton = page.getByRole('button', { name: /Test API/i }).first();
    await expect(tryButton).toBeVisible({ timeout: 5000 });
    await tryButton.click();

    await expect(page.getByText('API Testing Console')).toBeVisible({ timeout: 5000 });

    // Configure Bearer auth
    const authTab = page.getByTestId('tab-auth');
    await authTab.click();

    const authSelect = page.locator('select').first();
    await authSelect.selectOption('bearer');

    const tokenInput = page.getByPlaceholder('Enter bearer token');
    await tokenInput.fill('test-token-123');

    // Update URL to test endpoint that accepts auth headers
    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.clear();
    await urlInput.fill('https://httpbin.org/bearer');

    // Send request
    const sendButton = page.getByRole('button', { name: /Send/i });
    await sendButton.click();

    // Wait for response - httpbin.org/bearer requires Bearer auth, should get 401 with our test token
    // or 200 if it accepts any token
    await expect(page.locator('text=/Status:|200|401/i')).toBeVisible({ timeout: 15000 });
  });
});
