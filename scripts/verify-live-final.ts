async function verifyEndpoint(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    });
    const status = res.status;
    const text = await res.text();
    let json: any = null;
    let isValidJson = false;
    let itemsCount = 0;
    try {
      json = JSON.parse(text);
      isValidJson = true;
      const items = json.items || (Array.isArray(json) ? json : []);
      itemsCount = items.length;
    } catch (e) {}

    return {
      url,
      status,
      isValidJson,
      itemsCount,
      total: json?.total,
      hasError: !!json?.error,
      errorMsg: json?.error || null,
    };
  } catch (err: any) {
    return { url, status: 0, isValidJson: false, itemsCount: 0, errorMsg: err?.message };
  }
}

async function verifyAll() {
  console.log('--- Verifying API Endpoints on Live Deployment (https://indirathakur.com) ---');
  const endpoints = [
    'https://indirathakur.com/api/gallery-images',
    'https://indirathakur.com/api/gallery-images?category=newborn',
    'https://indirathakur.com/api/gallery-images?category=maternity',
    'https://indirathakur.com/api/gallery-images?category=portrait',
    'https://indirathakur.com/api/gallery-images?category=family',
    'https://indirathakur.com/api/gallery-images?category=events',
    'https://indirathakur.com/api/gallery-images?category=brand'
  ];

  for (const ep of endpoints) {
    const result = await verifyEndpoint(ep);
    console.log(JSON.stringify(result, null, 2));
  }
}

verifyAll();
