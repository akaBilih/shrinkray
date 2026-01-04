import { test, expect, mockAPI } from './fixtures';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPI(page);
    await page.goto('/');
  });

  test('page has title', async ({ page }) => {
    await expect(page).toHaveTitle(/Shrinkray/i);
  });

  test('page has lang attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('no auto-playing media', async ({ page }) => {
    const autoplayVideos = await page.locator('video[autoplay]').count();
    const autoplayAudios = await page.locator('audio[autoplay]').count();
    expect(autoplayVideos).toBe(0);
    expect(autoplayAudios).toBe(0);
  });
});
