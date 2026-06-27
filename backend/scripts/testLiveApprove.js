import fetch from 'node-fetch';

const url = 'https://idubbl-backend.onrender.com/api/wallet/admin/withdraw/6a3f74bb868accc11fee79d5/approve';
const adminUserId = '6a381dbc3b2194ca68ba7a36';

async function testApprove() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-user-id': adminUserId,
        'Content-Type': 'application/json'
      }
    });
    console.log('Status Code:', res.status);
    const json = await res.json();
    console.log('Response JSON:', json);
  } catch (error) {
    console.error('Error:', error);
  }
}

testApprove();
