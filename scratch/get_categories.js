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
    if (Array.isArray(data)) {
      const mapping = {};
      data.forEach(s => {
        const platform = s.platform || 'Khác';
        const category = s.category;
        if (!category) return;
        if (!mapping[platform]) {
          mapping[platform] = new Set();
        }
        mapping[platform].add(category);
      });
      const result = {};
      for (const [plat, cats] of Object.entries(mapping)) {
        result[plat] = Array.from(cats);
      }
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('API response is not an array:', data);
    }
  } catch (err) {
    console.error('Error fetching SMM services:', err);
  }
}

main();
