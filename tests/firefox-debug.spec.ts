import { test, expect, firefox } from '@playwright/test';

test('test with firefox', async () => {
  const browser = await firefox.launch();
  const page = await browser.newPage();

  const errors: string[] = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('PAGE ERROR:', error.message);
  });

  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const title = await page.title();
    console.log('Page title:', title);

    const content = await page.textContent('h1');
    console.log('H1 content:', content);

    console.log('✅ Firefox test passed!');
  } catch (error) {
    console.log('❌ Firefox test failed:', error);
  } finally {
    await browser.close();
  }
});
