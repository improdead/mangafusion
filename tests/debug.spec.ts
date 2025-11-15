import { test, expect } from '@playwright/test';

test('capture errors before crash', async ({ page }) => {
  const errors: string[] = [];
  const consoleMessages: Array<{ type: string; text: string }> = [];

  // Capture page errors
  page.on('pageerror', error => {
    const errorMsg = `PAGE ERROR: ${error.message}\n${error.stack}`;
    errors.push(errorMsg);
    console.log(errorMsg);
  });

  // Capture console messages
  page.on('console', msg => {
    const msgText = `CONSOLE [${msg.type()}]: ${msg.text()}`;
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    console.log(msgText);
  });

  // Capture failed requests
  page.on('response', response => {
    if (!response.ok()) {
      const failMsg = `FAILED REQUEST: ${response.url()} - Status: ${response.status()}`;
      console.log(failMsg);
      errors.push(failMsg);
    }
  });

  // Try to navigate without waiting for networkidle
  try {
    await page.goto('http://localhost:3000', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait a bit to see if errors appear
    await page.waitForTimeout(2000);

    // Try to get page content
    const title = await page.title();
    console.log('Page title:', title);

    // Check if React rendered
    const reactRoot = await page.$('#__next');
    console.log('React root found:', reactRoot !== null);

  } catch (error) {
    console.log('Navigation error:', error);
  }

  // Print summary
  console.log('\n=== ERROR SUMMARY ===');
  console.log(`Total errors: ${errors.length}`);
  console.log(`Total console messages: ${consoleMessages.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  if (consoleMessages.length > 0) {
    console.log('\nConsole messages:');
    consoleMessages.forEach((msg, i) => console.log(`${i + 1}. [${msg.type}] ${msg.text}`));
  }
  console.log('====================\n');
});
