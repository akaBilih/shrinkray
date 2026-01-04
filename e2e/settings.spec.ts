import { test, expect, mockAPI } from './fixtures';

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPI(page);
  });

  test('settings button exists', async ({ shrinkray }) => {
    await shrinkray.goto();
    await expect(shrinkray.settingsButton).toBeVisible();
  });

  test('settings panel opens', async ({ shrinkray }) => {
    await shrinkray.goto();
    await shrinkray.openSettings();
    await expect(shrinkray.settingsOverlay).toBeVisible();
  });

  test('settings has worker count dropdown', async ({ shrinkray }) => {
    await shrinkray.goto();
    await shrinkray.openSettings();
    await expect(shrinkray.page.locator('#setting-workers')).toBeVisible();
  });

  test('settings closes on escape', async ({ shrinkray }) => {
    await shrinkray.goto();
    await shrinkray.openSettings();
    await shrinkray.closeSettings();
    await expect(shrinkray.settingsOverlay).toBeHidden();
  });
});
