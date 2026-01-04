import { test, expect, mockAPI } from './fixtures';

test.describe('SSE Real-time Updates', () => {
  test('page loads with mocked API', async ({ page }) => {
    await mockAPI(page);
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
