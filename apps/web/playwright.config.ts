import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: externalBaseURL ?? 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'npm run start -- --hostname 127.0.0.1 --port 3100',
        url: 'http://127.0.0.1:3100',
        reuseExistingServer: false,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
  ],
});
