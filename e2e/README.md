# E2E Tests

End-to-end tests for YASP using Playwright.

## Test Structure

- `dashboard.spec.ts` - Dashboard functionality tests
- `import-spec.spec.ts` - Specification import tests (file, paste, URL)
- `spec-editor.spec.ts` - Spec editor functionality tests
- `ai-generation.spec.ts` - AI-powered spec generation tests
- `user-journey.spec.ts` - Complete user workflow tests

## Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI mode (interactive)
bun run test:e2e:ui

# Run in headed mode (see browser)
bun run test:e2e:headed

# Debug mode (step through tests)
bun run test:e2e:debug

# View test report
bun run test:e2e:report
```

## Test Coverage

### Dashboard Tests
- ✅ Dashboard loads with header and stats
- ✅ Loading skeletons display
- ✅ Spec cards render after loading
- ✅ Navigation buttons work
- ✅ Dialogs open correctly
- ✅ Accessibility checks

### Import Tests
- ✅ Import via paste
- ✅ Import validation
- ✅ File upload interface
- ✅ URL import interface
- ✅ Dialog interactions
- ✅ Error handling

### Editor Tests
- ✅ Editor loads correctly
- ✅ Monaco editor is functional
- ✅ Diagnostics panel works
- ✅ Tab navigation
- ✅ Title updates
- ✅ Quality score displays
- ✅ Keyboard accessibility

### AI Generation Tests
- ✅ Dialog opens and closes
- ✅ Form fields present
- ✅ Keyboard navigation
- ✅ Error handling

### User Journey Tests
- ✅ Complete spec creation workflow
- ✅ Import and edit workflow
- ✅ Navigation flows
- ✅ Error handling journeys
- ✅ Accessibility journeys

## Writing New Tests

Follow these patterns:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.getByRole('button', { name: 'Click Me' }).click();

    // Act & Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Semantic Selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for Elements**: Use `expect(...).toBeVisible()` instead of `waitFor`
3. **Accessibility**: Test keyboard navigation and ARIA labels
4. **Isolated Tests**: Each test should be independent
5. **Clear Names**: Use descriptive test names that explain what's being tested

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main/master/develop branches

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Debugging Failed Tests

1. **View Screenshots**: Check `test-results/` directory
2. **View Videos**: Available in `test-results/` for failed tests
3. **View Trace**: Use `bunx playwright show-trace trace.zip`
4. **Run in Debug Mode**: `bun run test:e2e:debug`

## Configuration

See `playwright.config.ts` for:
- Browser settings
- Timeout configuration
- Reporter settings
- Base URL and dev server configuration
