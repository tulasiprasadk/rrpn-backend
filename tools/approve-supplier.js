const BASE = process.env.BASE || 'http://localhost:5000';

async function run() {
  try {
    console.log('1) Dev-login as admin@local');
    const loginRes = await fetch(`${BASE}/api/admin/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@local' }),
    });

    const setCookie = loginRes.headers.get('set-cookie');
    const loginBody = await loginRes.text();
    console.log('login status:', loginRes.status);
    console.log('login body:', loginBody);
    if (!setCookie) {
      console.warn('No Set-Cookie received; aborting');
      return;
    }

    const cookie = setCookie.split(';')[0];
    console.log('Using cookie:', cookie);

    console.log('2) Fetch pending suppliers');
    const pendingRes = await fetch(`${BASE}/api/admin/suppliers/pending`, {
      headers: { Cookie: cookie }
    });
    console.log('pending status:', pendingRes.status);
    const pendingJson = await pendingRes.text();
    console.log('pending body:', pendingJson);

    console.log('3) Approve supplier id=2');
    const approveRes = await fetch(`${BASE}/api/admin/suppliers/2/approve`, {
      method: 'POST',
      headers: { Cookie: cookie }
    });
    console.log('approve status:', approveRes.status);
    const approveBody = await approveRes.text();
    console.log('approve body:', approveBody);

  } catch (err) {
    console.error('Error in script:', err);
  }
}

run();
