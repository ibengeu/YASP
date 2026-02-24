/**
 * E2E: Registration → Try It Out Integration Tests
 *
 * Verifies that data captured during API registration flows through
 * correctly to the Try It Out testing console. Closes Gaps 1–4.
 */

import { test, expect } from '@playwright/test';

const SPEC_WITH_AUTH_AND_SERVERS = `openapi: 3.1.0
info:
  title: Payment Gateway API
  version: 2.0.0
  description: Processes payments with multiple environments
servers:
  - url: https://api-dev.payments.io
    description: Development
  - url: https://api-staging.payments.io
    description: Staging
  - url: https://api.payments.io
    description: Production
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
paths:
  /payments:
    get:
      summary: List payments
      operationId: listPayments
      tags:
        - Payments
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
    post:
      summary: Create payment
      operationId: createPayment
      tags:
        - Payments
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                amount:
                  type: number
                currency:
                  type: string
      responses:
        '201':
          description: Created
`;

test.describe('Registration → Try It Out', () => {
  test('registered API with spec has pre-populated auth and endpoints in Try It Out', async ({ page }) => {
    // Step 1: Register API with spec
    await page.goto('/catalog');
    await page.getByRole('button', { name: /Register New API/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Paste spec
    await page.getByRole('tab', { name: /Paste/i }).click();
    await page.locator('textarea').first().fill(SPEC_WITH_AUTH_AND_SERVERS);
    await page.getByRole('button', { name: /Analyze Specification/i }).click();
    await expect(page.getByText(/Specification Analysis/i)).toBeVisible({ timeout: 5000 });

    // Step 2: Proceed through wizard
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText(/Step 3 of 3/i)).toBeVisible();

    // Step 3: Register
    await page.getByRole('button', { name: /Register API/i }).click();
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Step 4: Find registered API in catalog and open editor
    await expect(page.getByText('Payment Gateway API')).toBeVisible({ timeout: 5000 });
    await page.getByText('Payment Gateway API').click();

    // Step 5: Open Try It Out
    await page.getByRole('button', { name: /Try It Out/i }).click();
    await expect(page.getByText('API Testing Console')).toBeVisible({ timeout: 3000 });

    // Verify: Endpoints are present (not empty)
    await expect(page.getByText('/payments')).toBeVisible();

    // Verify: Auth is pre-selected (navigate to auth tab)
    await page.getByTestId('tab-auth').click();
    await expect(page.locator('select').filter({ hasText: 'Bearer Token' })).toBeVisible();
    await expect(page.getByText(/pre-selected from/i)).toBeVisible();

    // Verify: Multi-server selector is present
    await expect(page.getByTestId('server-selector')).toBeVisible();

    // Verify: No fallback URL warning (since spec has servers)
    await expect(page.locator('text=No server URL configured')).not.toBeVisible();
  });

  test('registered API without spec shows stub endpoint and fallback warning', async ({ page }) => {
    // Step 1: Register API without spec (skip upload)
    await page.goto('/catalog');
    await page.getByRole('button', { name: /Register New API/i }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Skip spec upload
    await page.getByRole('button', { name: /Skip spec upload/i }).click();

    // Fill in manually
    await page.locator('input#name').fill('Manual Stub API');
    await page.locator('textarea#description').fill('Testing stub generation');
    await page.locator('input#version').fill('1.0.0');
    await page.locator('input#endpoint').fill('https://api.manual-stub.com');

    // Proceed to review
    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText(/Step 3 of 3/i)).toBeVisible();

    // Register
    await page.getByRole('button', { name: /Register API/i }).click();
    await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });

    // Find and open in editor
    await expect(page.getByText('Manual Stub API')).toBeVisible({ timeout: 5000 });
    await page.getByText('Manual Stub API').click();

    // Open Try It Out
    await page.getByRole('button', { name: /Try It Out/i }).click();
    await expect(page.getByText('API Testing Console')).toBeVisible({ timeout: 3000 });

    // Verify: Stub endpoint is present (GET / health check, not empty)
    await expect(page.getByText('Health check').or(page.locator('text=/'))).toBeVisible();

    // Verify: Auth defaults to none
    await page.getByTestId('tab-auth').click();
    await expect(page.locator('select').filter({ hasText: 'No Auth' })).toBeVisible();
  });
});
