(async () => {
  const fetch = globalThis.fetch;
  try {
    const loginRes = await fetch('https://rrnagar.com/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'deploy-test-automation-1' }),
    });
    console.log('LOGIN STATUS', loginRes.status);
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('SET-COOKIE:', setCookie);

    const adminBody = {
      name: 'Auto Test Admin',
      email: `auto+${Date.now()}@rrnagar.com`,
      phone: null,
      password: 'TempPass123',
      role: 'moderator',
      autoApprove: true
    };

    const headers = { 'Content-Type': 'application/json' };
    if (setCookie) {
      // send only the session cookie pair
      headers['Cookie'] = setCookie.split(';')[0];
    }

    const createRes = await fetch('https://rrnagar.com/api/admin/admins', {
      method: 'POST',
      headers,
      body: JSON.stringify(adminBody),
    });

    console.log('CREATE STATUS', createRes.status);
    const text = await createRes.text();
    console.log('CREATE RESPONSE:', text);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
