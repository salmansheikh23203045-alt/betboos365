const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // Desktop 1280px
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktop.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });
  await desktop.waitForTimeout(500);
  await desktop.screenshot({ path: 'test-signup-ref-desktop.png' });

  // Tablet 768px
  const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await tablet.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });
  await tablet.waitForTimeout(500);
  await tablet.screenshot({ path: 'test-signup-ref-tablet.png' });

  // Mobile 375px
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mobile.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: 'test-signup-ref-mobile.png' });

  await browser.close();
  console.log('Reference design verification screenshots captured successfully!');
})();
