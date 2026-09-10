import fetch from 'node-fetch';

async function run() {
  const loginRes = await fetch("https://www.indirathakur.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@indirathakur.com", password: "Admin@12345678" })
  });
  const { token } = await loginRes.json();
  console.log("Authenticated with token.");

  const eps = [
    "/api/home",
    "/api/site-config",
    "/api/services",
    "/api/gallery-images",
    "/api/films",
    "/api/about",
    "/api/video-testimonials",
    "/api/brands",
    "/api/footer"
  ];
  
  const allSupabaseUrls = new Set();
  for (const ep of eps) {
    try {
      const res = await fetch("https://www.indirathakur.com" + ep);
      const text = await res.text();
      const matches = text.match(/https:\/\/[^"'\s\\]+supabase[^"'\s\\]+/g) || [];
      for (const m of matches) {
        allSupabaseUrls.add(m);
      }
    } catch (e) {
      console.error(ep, e.message);
    }
  }
  
  console.log(`Discovered ${allSupabaseUrls.size} unique Supabase URLs across live site.`);
  
  const missingKeys = [];
  const existingKeys = [];
  
  for (const url of allSupabaseUrls) {
    const match = url.match(/\/images\/(.+)$/);
    if (match) {
      const key = match[1];
      const checkRes = await fetch("https://www.indirathakur.com/api/media/" + key, { method: "HEAD" });
      if (checkRes.status === 200) {
        existingKeys.push(key);
      } else {
        missingKeys.push({ url, key, status: checkRes.status });
      }
    }
  }

  console.log(`\nExisting in R2: ${existingKeys.length}`);
  console.log(`Missing from R2: ${missingKeys.length}`);
  for (const m of missingKeys) {
    console.log(`  - [${m.status}] ${m.key}`);
  }
}

run().catch(console.error);
