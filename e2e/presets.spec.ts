import { test, expect, mockAPI } from './fixtures';

test.describe('Preset Selection', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPI(page);
    await page.goto('/');
  });

  test('preset dropdown exists', async ({ shrinkray }) => {
    await shrinkray.goto();
    await expect(shrinkray.presetDropdown).toBeVisible();
  });

  test('preset dropdown has options', async ({ shrinkray }) => {
    await shrinkray.goto();
    const options = shrinkray.presetDropdown.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
