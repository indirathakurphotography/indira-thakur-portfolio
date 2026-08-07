const BUCKET = 'images';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

function getServiceKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
}

function sanitizeFilename(name: string): string {
  const timestamp = Date.now();
  const ext = name.split('.').pop() || 'jpg';
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
  return `${timestamp}-${base}.${ext}`;
}

async function ensureBucket(baseUrl: string): Promise<void> {
  const serviceKey = getServiceKey();
  if (!serviceKey) return;

  // Check if bucket exists
  const check = await fetch(`${baseUrl}/storage/v1/bucket/images`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (check.ok) return;

  // Try creating bucket via Storage API
  const create = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'images', name: 'images', public: true }),
  });
  if (create.ok) return;

  // Try via Management API if SUPABASE_SERVICE_ROLE_KEY exists
  const mgmtKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const projectRef = baseUrl.match(/https?:\/\/([^.]+)/)?.[1] || '';
  if (mgmtKey && projectRef) {
    await fetch(`https://api.supabase.com/v1/projects/${projectRef}/storage/buckets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mgmtKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'images', name: 'images', public: true }),
    }).catch(() => {});
  }
}

export async function uploadFile(
  file: File,
  folder: string = 'gallery',
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const baseUrl = getBaseUrl();
  const serviceKey = getServiceKey();
  const filename = sanitizeFilename(file.name);
  const path = `${folder}/${filename}`;

  if (!baseUrl || !serviceKey) {
    console.warn('[Supabase Storage] Supabase credentials not set. Falling back to base64 data URL.');
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/png';
    return {
      url: `data:${mimeType};base64,${base64}`,
      publicId: path,
    };
  }

  try {
    // Ensure bucket exists
    await ensureBucket(baseUrl);

    const url = `${baseUrl}/storage/v1/object/${BUCKET}/${path}`;
    const arrayBuffer = await file.arrayBuffer();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: arrayBuffer,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Supabase Storage Upload Error]:', text);
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = file.type || 'image/png';
      return {
        url: `data:${mimeType};base64,${base64}`,
        publicId: path,
      };
    }

    return {
      url: `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`,
      publicId: path,
    };
  } catch (err) {
    console.error('[Supabase Storage] Upload exception:', err);
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/png';
    return {
      url: `data:${mimeType};base64,${base64}`,
      publicId: path,
    };
  }
}

export async function deleteFile(publicId: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const serviceKey = getServiceKey();
  if (!baseUrl || !serviceKey) return;

  const res = await fetch(`${baseUrl}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [publicId] }),
  });
  if (!res.ok) console.error('[deleteFile] FAILED', await res.text());
}

export function getPublicUrl(path: string): string {
  return `${getBaseUrl()}/storage/v1/object/public/${BUCKET}/${path}`;
}
