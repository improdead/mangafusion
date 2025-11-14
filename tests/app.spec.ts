import { test, expect } from '@playwright/test';

test.describe('MangaFusion Application', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });

    // Check if page loaded without errors
    const title = await page.title();
    console.log('Page title:', title);

    // Log any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Check for any error messages in the page
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText?.substring(0, 500));
  });

  test('should check for JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('Page error:', error.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Log all errors found
    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log('===================\n');
    } else {
      console.log('No errors found!');
    }
  });

  test('should check network requests', async ({ page }) => {
    const failedRequests: Array<{ url: string, status: number }> = [];

    page.on('response', response => {
      if (!response.ok()) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
        console.log(`Failed request: ${response.url()} - Status: ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (failedRequests.length > 0) {
      console.log('\n=== FAILED REQUESTS ===');
      failedRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.url} - Status: ${req.status}`);
      });
      console.log('======================\n');
    }
  });
});
