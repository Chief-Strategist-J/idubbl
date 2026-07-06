import fetch from 'node-fetch';

async function run() {
  const url = 'http://localhost:5000/api/auth/forget-password';
  console.log(`Hitting: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'dev.jaydeep919@gmail.com',
        redirectTo: 'http://localhost:5173/reset-password'
      })
    });
    console.log('Status:', res.status);
    const body = await res.json().catch(() => null);
    console.log('Body:', body);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
