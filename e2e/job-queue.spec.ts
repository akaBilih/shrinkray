import { test, expect, mockAPI } from './fixtures';

test.describe('Job Queue', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPI(page);
    await page.goto('/');
  });

  test('queue panel is visible', async ({ shrinkray }) => {
    await shrinkray.goto();
    await expect(shrinkray.queuePanel).toBeVisible();
  });

  test('queue list exists', async ({ page }) => {
    await expect(page.locator('#queue-list')).toBeVisible();
  });
});
