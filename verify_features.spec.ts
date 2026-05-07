import { test, expect } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:3001',
});

// Increase timeout for the whole test
test.setTimeout(60000);

test('Verify full user flow', async ({ page }) => {
  // 1. Anonymous Reading & Recommendations
  console.log('Step 1: Anonymous Reading');
  await page.goto('/articles');

  // Wait for articles to load
  await page.waitForSelector('.grid a', { timeout: 15000 });
  const firstArticle = page.locator('.grid a').first();
  const articleTitle = await firstArticle.locator('h3').textContent();
  console.log('Reading article:', articleTitle);

  await firstArticle.click();
  // On article page, h1 should be the title.
  await page.waitForSelector('article h1, h1:not(:has-text("Discover Articles"))', { timeout: 15000 });
  const h1Text = await page.locator('h1').textContent();
  console.log('H1 found:', h1Text);
  expect(h1Text?.trim()).toBe(articleTitle?.trim());

  // Wait for history to be recorded (happens on mount/view)
  await page.waitForTimeout(3000);

  console.log('Step 2: Checking recommendations');
  await page.goto('/');

  // The "For You" section might take a bit to appear because it's fetched on client
  await page.waitForSelector('h2:has-text("For You")', { timeout: 15000 });

  // Wait for article cards within the same container
  const forYouArticles = page.locator('section:has(h2:has-text("For You")) .grid a');
  await forYouArticles.first().waitFor({ state: 'visible', timeout: 15000 });

  const forYouCount = await forYouArticles.count();
  console.log('For You articles count:', forYouCount);
  expect(forYouCount).toBeGreaterThan(0);

  // 3. Auth - Register
  console.log('Step 3: Registration');
  const email = `test_${Date.now()}@example.com`;
  await page.goto('/auth/register');
  await page.fill('#name', 'Test User');
  await page.fill('#email', email);
  await page.fill('#password', 'password123');
  await page.fill('#confirmPassword', 'password123');
  await page.click('button:has-text("Create Account")');

  // Redirects to Home on success
  await page.waitForURL('http://localhost:3001/', { timeout: 15000 });

  // Check if logged in (Header should show Hello, Test User)
  await expect(page.locator('text=Hello, Test User')).toBeVisible({ timeout: 10000 });

  // 4. Upload Article
  console.log('Step 4: Upload Article');
  await page.goto('/upload');
  const newTitle = 'The Future of AI in Mindfulness ' + Date.now();
  await page.fill('#title', newTitle);
  await page.fill('#excerpt', 'Exploring how technology can enhance our presence.');
  await page.fill('#body', 'Content about AI and mindfulness... This is a long enough body for TF-IDF to work properly and extract some meaningful keywords from it.'.repeat(10));
  await page.fill('#author', 'AI Assistant');
  await page.fill('#category', 'Technology');
  await page.click('button:has-text("Publish Article")');

  // Should redirect to the new article
  await page.waitForURL(/\/articles\/.+/, { timeout: 15000 });
  await page.waitForSelector('h1', { timeout: 15000 });
  expect(await page.locator('h1').textContent()).toContain(newTitle);

  // Verify related articles section
  console.log('Step 5: Verify Related Articles');
  await page.waitForSelector('text=Related Articles', { timeout: 15000 });
  const relatedArticles = page.locator('section:has(h2:has-text("Related Articles")) .grid a');
  await relatedArticles.first().waitFor({ state: 'visible', timeout: 10000 });
  const relatedCount = await relatedArticles.count();
  console.log('Related articles count:', relatedCount);
  expect(relatedCount).toBeGreaterThan(0);

  // 6. Bookmarks
  console.log('Step 6: Bookmarks');
  // Wait for the button to be loaded (not showing "Loading...")
  const bookmarkButton = page.locator('button:has-text("Save"), button:has-text("Saved")');
  await bookmarkButton.waitFor({ state: 'visible', timeout: 10000 });

  // Ensure we are logged in by checking the header again
  await expect(page.locator('text=Hello, Test User')).toBeVisible();

  await bookmarkButton.click();

  // Wait for it to transition to "Saved"
  await expect(page.locator('button:has-text("Saved")')).toBeVisible({ timeout: 10000 });

  // Instead of navigating, let's refresh the current page and see if bookmark persists
  await page.reload();
  await page.waitForSelector('button:has-text("Saved")', { timeout: 10000 });
  console.log('Bookmark persisted after reload');

  await page.goto('/bookmarks');
  // Wait for loading to finish
  await page.waitForSelector('h1:has-text("Your Bookmarks")', { timeout: 10000 });

  // Try forcing a click on Bookmarks link in header to ensure fresh navigation
  await page.click('header a:has-text("Bookmarks")');

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'bookmarks_debug.png' });

  const bookmarksList = page.locator('.grid a');
  const count = await bookmarksList.count();
  console.log('Bookmarks count on page:', count);

  if (count === 0) {
      console.log('Retrying bookmarks navigation...');
      await page.goto('/bookmarks');
      await page.waitForTimeout(2000);
  }

  await expect(page.locator('.grid a').first()).toBeVisible({ timeout: 15000 });
  const bookmarkText = await page.locator('.grid a').first().textContent();
  console.log('First bookmark title:', bookmarkText);
  expect(bookmarkText).toContain(newTitle);

  await page.screenshot({ path: 'final_verification.png', fullPage: true });
});
