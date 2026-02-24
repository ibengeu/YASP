/**
 * API Registration E2E Tests
 * Tests for the complete API registration wizard with composable architecture
 *
 * Test Coverage:
 * - Step 1: Spec upload (file, paste, URL) with auto-inference
 * - Step 2: Basic information form with validation
 * - Step 3: Review and submit
 * - Skip spec upload flow (manual entry)
 * - Navigation (back/next)
 * - Persistent analysis summary
 * - Auto-filled field indicators
 * - Form validation errors
 * - Successful registration
 */

import { test, expect } from '@playwright/test';

const SAMPLE_OPENAPI_YAML = `openapi: 3.1.0
info:
  title: Payment API
  version: 2.1.0
  description: A comprehensive payment processing API
servers:
  - url: https://api.payments.example.com/v2
    description: Production server
paths:
  /payments:
    get:
      summary: List payments
      operationId: listPayments
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
      responses:
        '201':
          description: Created
tags:
  - name: payments
  - name: transactions
`;

const MINIMAL_OPENAPI_YAML = `openapi: 3.1.0
info:
  title: Minimal API
  version: 1.0.0
paths: {}
`;

test.describe('API Registration Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');

    // Click "Register New API" button
    await page.getByRole('button', { name: /Register New API/i }).click();

    // Wait for drawer to open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
  });

  test.describe('Step 1: OpenAPI Specification', () => {
    test('should show onboarding helper on step 1', async ({ page }) => {
      // Check for onboarding helper
      await expect(page.getByText(/Pro tip: Upload your OpenAPI spec first/i)).toBeVisible();
      await expect(page.getByText(/automatically extract API name/i)).toBeVisible();
    });

    test('should show step progress indicator', async ({ page }) => {
      // Check for "Step 1 of 3"
      await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
      await expect(page.getByText(/OpenAPI Specification/i)).toBeVisible();
    });

    test('should have three upload options: File, Paste, URL', async ({ page }) => {
      await expect(page.getByRole('tab', { name: /File/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Paste/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /URL/i })).toBeVisible();
    });

    test('should upload spec via paste and show analysis', async ({ page }) => {
      // Switch to paste tab
      await page.getByRole('tab', { name: /Paste/i }).click();

      // Paste YAML content
      const textarea = page.locator('textarea').first();
      await textarea.fill(SAMPLE_OPENAPI_YAML);

      // Click "Analyze Specification" button
      await page.getByRole('button', { name: /Analyze Specification/i }).click();

      // Wait for loading state
      await expect(page.getByText(/Analyzing OpenAPI specification/i)).toBeVisible();

      // Wait for analysis card to appear
      await expect(page.getByText(/Specification Analysis/i)).toBeVisible({ timeout: 5000 });

      // Check analysis details
      await expect(page.getByText(/Auto-filled/i)).toBeVisible();
      await expect(page.getByText(/confidence/i)).toBeVisible();

      // Check metrics
      await expect(page.getByText(/2 endpoint/i)).toBeVisible(); // 2 endpoints
      await expect(page.getByText(/1 server/i)).toBeVisible();
      await expect(page.getByText(/2 tag/i)).toBeVisible();

      // Success toast should appear
      await page.waitForSelector('[data-sonner-toast]', { timeout: 3000 });
      const toastText = await page.locator('[data-sonner-toast]').last().textContent();
      expect(toastText).toMatch(/Auto-filled.*fields/i);

      // Onboarding helper should disappear
      await expect(page.getByText(/Pro tip: Upload your OpenAPI spec first/i)).not.toBeVisible();
    });

    test('should show validation error for invalid spec', async ({ page }) => {
      // Switch to paste tab
      await page.getByRole('tab', { name: /Paste/i }).click();

      // Paste invalid content
      await page.locator('textarea').first().fill('invalid yaml content {{{');

      // Click analyze
      await page.getByRole('button', { name: /Analyze Specification/i }).click();

      // Should show error toast
      await page.waitForSelector('[data-sonner-toast]', { timeout: 3000 });
      const toastText = await page.locator('[data-sonner-toast]').last().textContent();
      expect(toastText).toMatch(/Failed to parse|Not a valid OpenAPI/i);
    });

    test('should disable analyze button when textarea is empty', async ({ page }) => {
      // Switch to paste tab
      await page.getByRole('tab', { name: /Paste/i }).click();

      // Button should be disabled
      await expect(page.getByRole('button', { name: /Analyze Specification/i })).toBeDisabled();

      // Type something
      await page.locator('textarea').first().fill('test content');

      // Button should be enabled
      await expect(page.getByRole('button', { name: /Analyze Specification/i })).toBeEnabled();
    });

    test('should allow skipping spec upload', async ({ page }) => {
      // Check for skip button
      const skipButton = page.getByRole('button', { name: /Skip spec upload and enter details manually/i });
      await expect(skipButton).toBeVisible();

      // Click skip
      await skipButton.click();

      // Should advance to Step 2
      await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();
      await expect(page.getByText(/Basic Information/i)).toBeVisible();
    });

    test('should allow adding tags in step 1', async ({ page }) => {
      // Find tag input
      const tagInput = page.locator('input[placeholder*="Type tag"]').first();
      await tagInput.fill('api');
      await tagInput.press('Enter');

      // Tag should appear as badge
      await expect(page.getByText('api').first()).toBeVisible();

      // Add another tag
      await tagInput.fill('rest');
      await page.getByRole('button', { name: /Add/i }).first().click();

      await expect(page.getByText('rest').first()).toBeVisible();
    });
  });

  test.describe('Step 2: Basic Information', () => {
    test.beforeEach(async ({ page }) => {
      // Upload a spec first to auto-fill fields
      await page.getByRole('tab', { name: /Paste/i }).click();
      await page.locator('textarea').first().fill(SAMPLE_OPENAPI_YAML);
      await page.getByRole('button', { name: /Analyze Specification/i }).click();

      // Wait for analysis
      await expect(page.getByText(/Specification Analysis/i)).toBeVisible({ timeout: 5000 });

      // Go to step 2
      await page.getByRole('button', { name: /Next/i }).click();
    });

    test('should show persistent analysis summary', async ({ page }) => {
      // Summary should be visible in step 2
      await expect(page.getByText(/Spec analyzed:/i)).toBeVisible();
      await expect(page.getByText(/fields auto-filled/i)).toBeVisible();
      await expect(page.getByText(/confidence/i)).toBeVisible();
    });

    test('should show "Auto-filled from spec" badges on fields', async ({ page }) => {
      // Check for green badges
      const badges = page.getByText(/Auto-filled from spec/i);
      const badgeCount = await badges.count();

      // Should have badges for name, description, version, endpoint (4 fields)
      expect(badgeCount).toBeGreaterThanOrEqual(3);
    });

    test('should have green borders on auto-filled fields', async ({ page }) => {
      // Check that name input has green border class
      const nameInput = page.locator('input#name');
      const classes = await nameInput.getAttribute('class');
      expect(classes).toContain('border-green-500');
    });

    test('should show auto-filled values', async ({ page }) => {
      // Check that fields are pre-filled with values from spec
      await expect(page.locator('input#name')).toHaveValue('Payment API');
      await expect(page.locator('input#version')).toHaveValue('2.1.0');
      await expect(page.locator('textarea#description')).toHaveValue('A comprehensive payment processing API');
      await expect(page.locator('input#endpoint')).toHaveValue('https://api.payments.example.com/v2');
    });

    test('should change border color when manually editing field', async ({ page }) => {
      const nameInput = page.locator('input#name');

      // Initially green
      let classes = await nameInput.getAttribute('class');
      expect(classes).toContain('border-green-500');

      // Edit the field
      await nameInput.clear();
      await nameInput.fill('My Custom API Name');

      // Should now have blue border
      classes = await nameInput.getAttribute('class');
      expect(classes).toContain('border-blue-500');

      // Badge should disappear or change
      const badges = page.locator('input#name').locator('..').getByText(/Auto-filled from spec/i);
      await expect(badges).not.toBeVisible();
    });

    test('should show validation errors for required fields', async ({ page }) => {
      // Clear a required field
      await page.locator('input#name').clear();

      // Try to go to next step
      await page.getByRole('button', { name: /Next/i }).click();

      // Should show validation error
      await expect(page.getByText(/String must contain at least 3 character/i)).toBeVisible();

      // Field should have red border
      const nameInput = page.locator('input#name');
      const classes = await nameInput.getAttribute('class');
      expect(classes).toContain('border-red-500');

      // Should still be on step 2
      await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();
    });

    test('should validate endpoint URL format', async ({ page }) => {
      // Enter invalid URL
      const endpointInput = page.locator('input#endpoint');
      await endpointInput.clear();
      await endpointInput.fill('/api/v1'); // Relative path

      // Try to proceed
      await page.getByRole('button', { name: /Next/i }).click();

      // Should show URL validation error
      await expect(page.getByText(/Must be a complete URL/i)).toBeVisible();
    });

    test('should require HTTPS for non-localhost URLs', async ({ page }) => {
      const endpointInput = page.locator('input#endpoint');
      await endpointInput.clear();
      await endpointInput.fill('http://api.example.com'); // HTTP not HTTPS

      await page.getByRole('button', { name: /Next/i }).click();

      // Should show HTTPS requirement error
      await expect(page.getByText(/Must use HTTPS/i)).toBeVisible();
    });

    test('should allow HTTP for localhost', async ({ page }) => {
      const endpointInput = page.locator('input#endpoint');
      await endpointInput.clear();
      await endpointInput.fill('http://localhost:3000');

      await page.getByRole('button', { name: /Next/i }).click();

      // Should proceed to step 3
      await expect(page.getByText(/Step 3 of 3/i)).toBeVisible();
    });

    test('should allow navigation back to step 1', async ({ page }) => {
      await page.getByRole('button', { name: /Back/i }).click();

      // Should be back on step 1
      await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
      await expect(page.getByText(/OpenAPI Specification/i)).toBeVisible();

      // Analysis card should still be there
      await expect(page.getByText(/Specification Analysis/i)).toBeVisible();
    });
  });

  test.describe('Step 3: Review & Submit', () => {
    test.beforeEach(async ({ page }) => {
      // Complete steps 1 and 2
      await page.getByRole('tab', { name: /Paste/i }).click();
      await page.locator('textarea').first().fill(SAMPLE_OPENAPI_YAML);
      await page.getByRole('button', { name: /Analyze Specification/i }).click();
      await expect(page.getByText(/Specification Analysis/i)).toBeVisible({ timeout: 5000 });

      await page.getByRole('button', { name: /Next/i }).click();
      await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();

      await page.getByRole('button', { name: /Next/i }).click();
      await expect(page.getByText(/Step 3 of 3/i)).toBeVisible();
    });

    test('should show review cards with all entered data', async ({ page }) => {
      // Basic Information card
      await expect(page.getByText(/Basic Information/i)).toBeVisible();
      await expect(page.getByText('Payment API')).toBeVisible();
      await expect(page.getByText('A comprehensive payment processing API')).toBeVisible();
      await expect(page.getByText('2.1.0')).toBeVisible();

      // OpenAPI Specification card
      await expect(page.getByText(/OpenAPI Specification/i)).toBeVisible();
      await expect(page.getByText(/paste/i)).toBeVisible(); // Source

      // Tags card (if tags added)
      // Note: Tags are in step 1, so they should be visible if added
    });

    test('should show "Register API" button on final step', async ({ page }) => {
      const registerButton = page.getByRole('button', { name: /Register API/i });
      await expect(registerButton).toBeVisible();
    });

    test('should allow navigation back to step 2', async ({ page }) => {
      await page.getByRole('button', { name: /Back/i }).click();

      await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();
      await expect(page.getByText(/Basic Information/i)).toBeVisible();
    });

    test('should successfully register API', async ({ page }) => {
      // Click Register API
      await page.getByRole('button', { name: /Register API/i }).click();

      // Should show submitting state
      await expect(page.getByText(/Submitting/i)).toBeVisible();

      // Should show success toast
      await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
      const toastText = await page.locator('[data-sonner-toast]').last().textContent();
      expect(toastText).toMatch(/API registered successfully/i);

      // Drawer should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });

      // Should be back on catalog page
      await expect(page).toHaveURL('/catalog');

      // New API should appear in catalog
      await expect(page.getByText('Payment API')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Manual Entry Flow (Skip Spec Upload)', () => {
    test('should complete registration without spec upload', async ({ page }) => {
      // Skip step 1
      await page.getByRole('button', { name: /Skip spec upload/i }).click();

      // Should be on step 2
      await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();

      // Fields should be empty (no auto-fill)
      await expect(page.locator('input#name')).toHaveValue('');

      // No "Auto-filled from spec" badges
      await expect(page.getByText(/Auto-filled from spec/i)).not.toBeVisible();

      // Fill in fields manually
      await page.locator('input#name').fill('Manual Test API');
      await page.locator('textarea#description').fill('This is a manually entered API for testing purposes');
      await page.locator('input#version').fill('1.0.0');
      await page.locator('input#endpoint').fill('https://api.manual-test.com');

      // Proceed to step 3
      await page.getByRole('button', { name: /Next/i }).click();

      // Review
      await expect(page.getByText(/Step 3 of 3/i)).toBeVisible();
      await expect(page.getByText('Manual Test API')).toBeVisible();

      // Register
      await page.getByRole('button', { name: /Register API/i }).click();

      // Success
      await page.waitForSelector('[data-sonner-toast]', { timeout: 5000 });
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
      await expect(page.getByText('Manual Test API')).toBeVisible({ timeout: 5000 });
    });

    test('should not show persistent analysis summary without spec', async ({ page }) => {
      // Skip step 1
      await page.getByRole('button', { name: /Skip spec upload/i }).click();

      // Persistent summary should not be visible
      await expect(page.getByText(/Spec analyzed:/i)).not.toBeVisible();
    });
  });

  test.describe('Collapsible Analysis Summary', () => {
    test.beforeEach(async ({ page }) => {
      // Upload spec and go to step 2
      await page.getByRole('tab', { name: /Paste/i }).click();
      await page.locator('textarea').first().fill(SAMPLE_OPENAPI_YAML);
      await page.getByRole('button', { name: /Analyze Specification/i }).click();
      await expect(page.getByText(/Specification Analysis/i)).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: /Next/i }).click();
    });

    test('should expand/collapse analysis details', async ({ page }) => {
      // Find chevron button
      const chevronButton = page.locator('button').filter({ has: page.locator('[class*="ChevronDown"]') }).first();

      // Initially collapsed - details not visible
      await expect(page.getByText(/2 endpoints/i).first()).not.toBeVisible();

      // Click to expand
      await chevronButton.click();

      // Details should be visible
      await expect(page.getByText(/2 endpoints/i).first()).toBeVisible();
      await expect(page.getByText(/1 server/i).first()).toBeVisible();

      // Click to collapse
      await chevronButton.click();

      // Details should be hidden
      await expect(page.getByText(/2 endpoints/i).first()).not.toBeVisible();
    });
  });

  test.describe('Drawer Behavior', () => {
    test('should close drawer with close button', async ({ page }) => {
      // Find close button (drawer has a close button in header)
      const closeButton = page.locator('button[aria-label*="Close"]').or(
        page.locator('[data-slot="drawer-close"]')
      ).first();

      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Alternative: press Escape
        await page.keyboard.press('Escape');
      }

      // Drawer should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should close drawer on escape key', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should reset form when reopening drawer', async ({ page }) => {
      // Fill some data
      await page.getByRole('tab', { name: /Paste/i }).click();
      await page.locator('textarea').first().fill('test content');

      // Close drawer
      await page.keyboard.press('Escape');

      // Reopen
      await page.getByRole('button', { name: /Register New API/i }).click();

      // Form should be reset
      await expect(page.locator('textarea').first()).toHaveValue('');

      // Should be back on step 1
      await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle spec with minimal information', async ({ page }) => {
      await page.getByRole('tab', { name: /Paste/i }).click();
      await page.locator('textarea').first().fill(MINIMAL_OPENAPI_YAML);
      await page.getByRole('button', { name: /Analyze Specification/i }).click();

      // Should still analyze successfully
      await expect(page.getByText(/Specification Analysis/i)).toBeVisible({ timeout: 5000 });

      // But confidence might be lower
      await expect(page.getByText(/confidence/i)).toBeVisible();
    });

    test('should prevent double submission', async ({ page }) => {
      // Complete steps
      await page.getByRole('tab', { name: /Paste/i }).click();
      await page.locator('textarea').first().fill(SAMPLE_OPENAPI_YAML);
      await page.getByRole('button', { name: /Analyze Specification/i }).click();
      await expect(page.getByText(/Specification Analysis/i)).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();

      // Click register
      await page.getByRole('button', { name: /Register API/i }).click();

      // Button should be disabled during submission
      const registerButton = page.getByRole('button', { name: /Register API|Submitting/i });
      await expect(registerButton).toBeDisabled();
    });
  });
});
