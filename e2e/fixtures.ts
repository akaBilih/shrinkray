import { test as base, expect, Page } from '@playwright/test';

/**
 * Custom test fixtures for Shrinkray E2E tests
 */
export const test = base.extend<{
  shrinkray: ShrinkrayPage;
}>({
  shrinkray: async ({ page }, use) => {
    const shrinkray = new ShrinkrayPage(page);
    await use(shrinkray);
  },
});

export { expect };

/**
 * Page Object Model for Shrinkray UI
 */
export class ShrinkrayPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // Correct selectors from actual HTML
  get presetDropdown() {
    return this.page.locator('#preset-select');
  }

  get startButton() {
    return this.page.locator('#start-btn');
  }

  get settingsOverlay() {
    return this.page.locator('#settings-overlay');
  }

  get settingsButton() {
    return this.page.locator('button[onclick="openSettings()"]');
  }

  get queuePanel() {
    return this.page.locator('#queue-panel');
  }

  get fileList() {
    return this.page.locator('#file-list');
  }

  get breadcrumb() {
    return this.page.locator('#breadcrumb');
  }

  async openSettings() {
    await this.settingsButton.click();
    await expect(this.settingsOverlay).toBeVisible();
  }

  async closeSettings() {
    await this.page.keyboard.press('Escape');
  }
}

/**
 * Mock API responses for isolated testing
 */
export async function mockAPI(page: Page) {
  await page.route('**/api/presets', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'compress-hevc', name: 'Smaller files — HEVC', description: 'Widely compatible' },
      { id: 'compress-av1', name: 'Smaller files — AV1', description: 'Best quality' },
    ]),
  }));

  await page.route('**/api/config', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ media_path: '/media', workers: 1, allow_software_fallback: false }),
  }));

  await page.route('**/api/jobs', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  }));

  await page.route('**/api/browse**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ path: '/media', directories: [], files: [] }),
  }));

  // Mock SSE to prevent hanging
  await page.route('**/api/jobs/stream', route => route.abort());
}
