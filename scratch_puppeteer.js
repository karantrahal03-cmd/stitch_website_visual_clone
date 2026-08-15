const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) console.log('HTTP ERROR:', response.url(), response.status());
  });

  await page.goto('http://localhost:3001/login');
  
  // Login
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'contact@arkbazar.in');
  await page.type('input[type="password"]', 'ankbazar982');
  
  // find login button and click
  const loginBtn = await page.$('button[type="submit"], button.w-full');
  if (loginBtn) {
    await loginBtn.click();
    console.log("Clicked login.");
  }

  // Wait for redirect to admin.html
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log("Navigated to:", page.url());

  // Click add market button
  try {
    await page.waitForSelector('#add-market-btn', { timeout: 5000 });
    console.log("Found add market button. Clicking...");
    await page.click('#add-market-btn');
    
    // Wait a bit for async operations
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if new row appeared
    const html = await page.content();
    if (html.includes('New Market')) {
      console.log("SUCCESS: 'New Market' text found in page.");
    } else {
      console.log("FAILURE: 'New Market' text NOT found in page.");
    }
  } catch (err) {
    console.log("Failed to find/click button:", err.message);
  }

  await browser.close();
})();
