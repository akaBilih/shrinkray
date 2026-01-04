import { test, expect, mockAPI } from './fixtures';

test.describe('File Browser', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPI(page);
    await page.goto('/');
  });

  test('file list exists', async ({ shrinkray }) => {
    await shrinkray.goto();
    await expect(shrinkray.fileList).toBeVisible();
  });

  test('breadcrumb exists', async ({ shrinkray }) => {
    await shrinkray.goto();
    await expect(shrinkray.breadcrumb).toBeVisible();
  });

  test('start button exists', async ({ shrinkray }) => {
    await shrinkray.goto();
    await expect(shrinkray.startButton).toBeVisible();
  });
});
