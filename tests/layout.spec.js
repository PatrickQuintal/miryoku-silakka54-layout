const fs = require('fs');
const http = require('http');
const path = require('path');
const { test, expect } = require('@playwright/test');

let server;
let serverUrl;

const caseTopKeysBase = [
  'L01', 'L02', 'L03', 'L04', 'L05', 'L06',
  'L21', 'L31',
  'R06', 'R05', 'R04', 'R03', 'R02', 'R01',
  'R22', 'R21',
  'R34', 'R33', 'R32', 'R31'
];

test.beforeAll(async () => {
  const root = path.join(__dirname, '..');
  server = http.createServer((req, res) => {
    const reqPath = req.url.split('?')[0];
    const filePath = path.join(root, reqPath === '/' ? 'index.html' : reqPath.slice(1));
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        return res.end('Not found');
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html',
        '.json': 'application/json',
        '.js': 'text/javascript',
        '.css': 'text/css'
      };
      res.setHeader('content-type', types[ext] || 'text/plain');
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  serverUrl = `http://localhost:${port}`;
});

test.afterAll(() => {
  server?.close();
});

test.beforeEach(async ({ page }) => {
  await page.goto(serverUrl);
  await page.waitForTimeout(300);
});

test('base layer case-top keys have case/main/mod ordering', async ({ page }) => {
  for (const keyId of caseTopKeysBase) {
    const key = page.locator(`[data-key="${keyId}"]`);
    await expect(key, `${keyId} should exist`).toBeVisible();

    // First .key-label is the visible key; tooltips add a second one
    const face = key.locator('.key-label').first();
    const caseLabel = face.locator('.case-label');
    const mainLabel = face.locator('.main-label');
    await expect(caseLabel, `${keyId} should have a case label`).toHaveCount(1);
    await expect(mainLabel, `${keyId} should have a main label`).toHaveCount(1);

    const [caseBox, mainBox] = await Promise.all([
      caseLabel.boundingBox(),
      mainLabel.boundingBox()
    ]);
    expect(caseBox, `${keyId} case label box`).not.toBeNull();
    expect(mainBox, `${keyId} main label box`).not.toBeNull();
    const caseCenterY = caseBox.y + caseBox.height / 2;
    const mainCenterY = mainBox.y + mainBox.height / 2;
    expect(caseCenterY, `${keyId} case label should sit above main`).toBeLessThan(mainCenterY - 1);

    const modLabel = face.locator('.mod-label');
    if (await modLabel.count()) {
      const modBox = await modLabel.first().boundingBox();
      expect(modBox, `${keyId} mod label box`).not.toBeNull();
      expect(mainBox.y, `${keyId} main label should be above mod`).toBeLessThan(modBox.y);
    }
  }
});

test('base layer letters stay centered (no stray case labels)', async ({ page }) => {
  const plainLetterKeys = ['L12', 'L13', 'L14', 'L15', 'L16', 'R16', 'R15', 'R14', 'R13', 'R12'];
  for (const keyId of plainLetterKeys) {
    const key = page.locator(`[data-key="${keyId}"]`);
    await expect(key, `${keyId} should exist`).toBeVisible();
    await expect(key.locator('.case-label'), `${keyId} should not have a case label`).toHaveCount(0);
  }
});
