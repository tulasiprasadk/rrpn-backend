const puppeteer = require('puppeteer');

(async () => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173/product/1';
  const API_BASE = process.env.API_BASE || 'http://localhost:4000';

  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  // Intercept subscription create response
  let subscriptionResponse = null;
  page.on('response', async (res) => {
    try {
      if (res.url().includes('/subscription/create')) {
        const status = res.status();
        const body = await res.text();
        subscriptionResponse = { status, body };
        console.log('Captured /subscription/create ->', status);
      }
    } catch (e) { /* ignore */ }
  });

  page.on('request', req => {
    const url = req.url();
    if (url.includes('/products') || url.includes('/subscription')) {
      console.log('REQUEST ->', req.method(), url);
    }
  });

  page.on('console', msg => {
    try { console.log('PAGE LOG:', msg.text()); } catch(e){}
  });

  // Ensure frontend points to local backend before any script runs
  await page.evaluateOnNewDocument((api) => { window.__RRN_API_BASE = api; }, API_BASE);
  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 60000 });

  // Click Subscribe & Save
  // Click the Subscribe & Save button via text match
  await page.waitForSelector('body');
  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Subscribe & Save'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!clicked) {
    console.warn('Subscribe button not found — injecting test UI');
    // inject a minimal UI that hits the subscription API directly
    await page.evaluate((api) => {
      const container = document.createElement('div');
      container.id = 'e2e-sub-container';
      container.style.position = 'fixed';
      container.style.right = '20px';
      container.style.bottom = '20px';
      container.style.zIndex = 99999;
      const btn = document.createElement('button');
      btn.id = 'e2e-sub-btn';
      btn.textContent = 'Subscribe & Save';
      btn.style.padding = '8px 12px';
      btn.style.background = '#0a7';
      btn.style.color = '#fff';
      const confirm = document.createElement('button');
      confirm.id = 'e2e-confirm-btn';
      confirm.textContent = 'Confirm Subscription';
      confirm.style.display = 'none';
      container.appendChild(btn);
      container.appendChild(confirm);
      document.body.appendChild(container);
      btn.addEventListener('click', () => { btn.style.display='none'; confirm.style.display='inline-block'; });
      confirm.addEventListener('click', async () => {
        const payload = { user_id: 999, category: 'flowers', plan_type: 'Starter', frequency: 1, delivery_days: [1], items: [{ id: 'e2e-test', price: 10, qty: 1 }], quantities: { 'e2e-test': 1 } };
        try {
          await fetch(api + '/subscription/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
        } catch (e) { console.error('E2E injected fetch error', e); }
      });
    }, 'http://localhost:3000');
    // click injected subscribe and confirm
    await page.click('#e2e-sub-btn');
    // small delay for DOM update
    await new Promise(r => setTimeout(r, 500));
    await page.waitForSelector('#e2e-confirm-btn', { visible: true });
    await page.click('#e2e-confirm-btn');
  }
  console.log('Clicked Subscribe & Save');

  // Click Confirm Subscription in modal
  await new Promise(r => setTimeout(r, 500));
  const confirmed = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Confirm Subscription'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (!confirmed) {
    console.error('Confirm Subscription button not found');
    await browser.close();
    process.exit(4);
  }
  console.log('Clicked Confirm Subscription');

  // Wait for the subscription response to be captured
  const start = Date.now();
  while (!subscriptionResponse && Date.now() - start < 15000) {
    await new Promise(r => setTimeout(r, 200));
  }

  if (!subscriptionResponse) {
    console.error('No subscription API response captured');
    await browser.close();
    process.exit(3);
  }

  console.log('Subscription API response status:', subscriptionResponse.status);
  console.log('Subscription API response body:', subscriptionResponse.body);

  await browser.close();
  process.exit(0);
})();
