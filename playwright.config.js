const path = require('path');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: path.join(__dirname, 'tests'),
  reporter: 'list',
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: true,
        viewport: { width: 1900, height: 1200 }
      }
    }
  ]
};

module.exports = config;
