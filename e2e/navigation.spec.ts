import { test, expect, mockAPI } from './fixtures';

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPI(page);
  });

  test('page loads with title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Shrinkray/i);
  });

  test('queue panel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#queue-panel')).toBeVisible();
  });

  test('file list area exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#file-list')).toBeVisible();
  });

  test('settings opens and closes', async ({ shrinkray }) => {
    await shrinkray.goto();
    await shrinkray.openSettings();
    await expect(shrinkray.settingsOverlay).toBeVisible();
    await shrinkray.closeSettings();
    await expect(shrinkray.settingsOverlay).toBeHidden();
  });
});
