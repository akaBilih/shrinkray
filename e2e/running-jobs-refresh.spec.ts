import { test, expect } from '@playwright/test';

/**
 * Test for bug: Running jobs disappear from "Now Processing" on page refresh
 * 
 * Root cause: updateJobs() only added queueJobs (pending/pending_probe/cancelled)
 * to statusIndex, not running jobs. When updateActivePanel() called 
 * getJobsByStatus('running'), it returned empty.
 * 
 * Fix: Also add running jobs to jobMap and statusIndex in updateJobs()
 */
test.describe('Running Jobs on Page Refresh', () => {
  test('running jobs appear in Now Processing after SSE init', async ({ page }) => {
    // Mock API endpoints
    await page.route('**/api/presets', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'compress-hevc', name: 'Smaller files — HEVC', description: 'Widely compatible' },
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

    // Mock SSE stream to send init event with a running job
    await page.route('**/api/jobs/stream', async route => {
      const runningJob = {
        id: 'test-running-job-1',
        input_path: '/media/test-video.mkv',
        status: 'running',
        progress: 45.5,
        speed: 2.1,
        eta: '00:05:30',
        preset_id: 'compress-hevc',
        started_at: new Date().toISOString(),
      };

      const initEvent = {
        type: 'init',
        jobs: [runningJob],
        stats: { pending: 0, running: 1, complete: 0, failed: 0 },
      };

      // Send SSE response with init event
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: `data: ${JSON.stringify(initEvent)}\n\n`,
      });
    });

    // Navigate to the page
    await page.goto('/');
    
    // Wait for SSE init to be processed
    await page.waitForTimeout(500);

    // Verify the "Now Processing" section shows the running job
    const activePanel = page.locator('#active-panel');
    await expect(activePanel).toBeVisible();

    // Check for the running job in Now Processing content
    const nowProcessingContent = page.locator('#now-processing-content');
    await expect(nowProcessingContent).toContainText('test-video.mkv');

    // Verify job shows running status indicators
    await expect(nowProcessingContent).toContainText(/Running|Initializing/);
  });

  test('multiple running jobs all appear after SSE init', async ({ page }) => {
    // Mock API endpoints
    await page.route('**/api/presets', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'compress-hevc', name: 'Smaller files — HEVC', description: 'Widely compatible' },
      ]),
    }));

    await page.route('**/api/config', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ media_path: '/media', workers: 2, allow_software_fallback: false }),
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

    // Mock SSE stream to send init event with multiple running jobs
    await page.route('**/api/jobs/stream', async route => {
      const runningJobs = [
        {
          id: 'test-running-job-1',
          input_path: '/media/video-one.mkv',
          status: 'running',
          progress: 25.0,
          speed: 1.8,
          eta: '00:10:00',
          preset_id: 'compress-hevc',
          started_at: new Date().toISOString(),
        },
        {
          id: 'test-running-job-2',
          input_path: '/media/video-two.mp4',
          status: 'running',
          progress: 75.0,
          speed: 2.5,
          eta: '00:02:30',
          preset_id: 'compress-hevc',
          started_at: new Date().toISOString(),
        },
      ];

      const pendingJob = {
        id: 'test-pending-job-1',
        input_path: '/media/video-three.avi',
        status: 'pending',
        progress: 0,
        preset_id: 'compress-hevc',
      };

      const initEvent = {
        type: 'init',
        jobs: [...runningJobs, pendingJob],
        stats: { pending: 1, running: 2, complete: 0, failed: 0 },
      };

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: `data: ${JSON.stringify(initEvent)}\n\n`,
      });
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Verify both running jobs appear in Now Processing
    const nowProcessingContent = page.locator('#now-processing-content');
    await expect(nowProcessingContent).toContainText('video-one.mkv');
    await expect(nowProcessingContent).toContainText('video-two.mp4');

    // Verify pending job appears in queue, not in Now Processing
    await expect(nowProcessingContent).not.toContainText('video-three.avi');
    
    // Pending job should be in the queue list or "Up Next"
    const queueArea = page.locator('#queue-panel');
    await expect(queueArea).toContainText('video-three.avi');
  });
});
