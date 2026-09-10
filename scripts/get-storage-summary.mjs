import fetch from 'node-fetch';

async function getStats() {
  const loginRes = await fetch("https://www.indirathakur.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@indirathakur.com", password: "Admin@12345678" })
  });
  const { token } = await loginRes.json();

  const postRes = await fetch("https://www.indirathakur.com/api/migrate-r2", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ force: false })
  });
  const data = await postRes.json();
  const keys = data.r2VerifiedObjects || [];
  console.log(`Total verified objects in R2: ${keys.length}`);

  let totalBytes = 0;
  let verifiedCount = 0;

  // Run in concurrent chunks of 15
  const chunkSize = 15;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (key) => {
      try {
        const res = await fetch("https://www.indirathakur.com/api/media/" + key, { method: "HEAD" });
        if (res.ok) {
          const len = parseInt(res.headers.get("content-length") || "0", 10);
          totalBytes += len;
          verifiedCount++;
        }
      } catch (e) {
        console.error("HEAD error for", key, e.message);
      }
    }));
  }

  console.log("\n================ MIGRATION REPORT ================");
  console.log(`R2 Bucket: ${data.r2Bucket}`);
  console.log(`R2 Object Count: ${keys.length}`);
  console.log(`Verified Object Count: ${verifiedCount}`);
  console.log(`Total Storage Size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (${totalBytes.toLocaleString()} bytes)`);
  console.log("==================================================");
}

getStats().catch(console.error);
