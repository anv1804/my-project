const SMM_API_KEY = 'abdfcbbcce545ccd4d8fa1211ac62ca6';
const SMM_API_URL = 'https://trumlike.vip/api/v2';

async function main() {
  const params = new URLSearchParams();
  params.append('key', SMM_API_KEY);
  params.append('action', 'services');

  try {
    const res = await fetch(SMM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    // Print first 5 services
    console.log("First 5 SMM services:");
    console.log(JSON.stringify(data.slice(0, 5), null, 2));

    // Print balance
    const balanceParams = new URLSearchParams();
    balanceParams.append('key', SMM_API_KEY);
    balanceParams.append('action', 'balance');
    const balanceRes = await fetch(SMM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: balanceParams.toString(),
    });
    const balanceData = await balanceRes.json();
    console.log("\nBalance response:");
    console.log(JSON.stringify(balanceData, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
