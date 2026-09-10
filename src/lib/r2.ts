import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3Client: S3Client | null = null;

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
  endpoint: string;
}

export function getR2Config(): R2Config {
  const rawAccountId = (
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    process.env.R2_ACCOUNT_ID ||
    ''
  ).trim();

  // Extract 32-character hexadecimal Cloudflare account ID if present, or strip whitespace
  const hexMatch = rawAccountId.match(/[a-f0-9]{32}/i);
  const accountId = hexMatch ? hexMatch[0] : rawAccountId.replace(/[^a-zA-Z0-9_-]/g, '');

  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
  const bucketName = (
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET ||
    ''
  ).trim();
  const publicDomain = (
    process.env.R2_PUBLIC_DOMAIN ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');

  let endpoint = (process.env.R2_ENDPOINT || '').trim();
  if (!endpoint || endpoint.includes(' ') || !endpoint.startsWith('http')) {
    endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '';
  } else {
    endpoint = endpoint.replace(/\s+/g, '');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicDomain,
    endpoint,
  };
}

export function isR2Configured(): boolean {
  const config = getR2Config();
  return Boolean(
    config.accessKeyId &&
      config.secretAccessKey &&
      config.bucketName &&
      (config.endpoint || config.accountId)
  );
}

export function getR2Client(): S3Client {
  if (_s3Client) return _s3Client;

  const config = getR2Config();
  if (!isR2Configured()) {
    throw new Error(
      'Cloudflare R2 is not configured. Please define CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.'
    );
  }

  _s3Client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return _s3Client;
}

/**
 * Ensures the target R2 bucket exists.
 */
export async function ensureR2Bucket(bucketName?: string): Promise<void> {
  const targetBucket = bucketName || getR2Config().bucketName;
  if (!isR2Configured()) return;

  try {
    const client = getR2Client();
    try {
      await client.send(new HeadBucketCommand({ Bucket: targetBucket }));
      return; // Bucket exists and is accessible
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        console.log(`[R2] Bucket "${targetBucket}" not found. Creating...`);
        await client.send(new CreateBucketCommand({ Bucket: targetBucket }));
        console.log(`[R2] Bucket "${targetBucket}" created successfully.`);
      } else {
        throw err;
      }
    }
  } catch (err: any) {
    console.warn('[R2] ensureR2Bucket notice:', err.message || err);
  }
}

/**
 * Returns the public URL for an R2 asset.
 * If R2_PUBLIC_DOMAIN is configured (e.g. pub-xxx.r2.dev or a custom domain),
 * it returns the full public URL.
 * Otherwise, it returns the app's streaming proxy `/api/media/${key}` which handles
 * serving objects directly from R2 with full caching.
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  const { publicDomain } = getR2Config();

  if (publicDomain) {
    return `${publicDomain}/${cleanKey}`;
  }

  return `/api/media/${cleanKey}`;
}

/**
 * Generates a presigned PUT URL for direct browser-to-R2 upload.
 */
export async function createR2SignedUploadUrl(
  key: string,
  contentType: string = 'application/octet-stream',
  expiresInSeconds: number = 3600
): Promise<{ signedUrl: string; key: string; publicUrl: string; bucket: string }> {
  const { bucketName } = getR2Config();
  const cleanKey = key.replace(/^\/+/, '');

  if (!isR2Configured()) {
    // If credentials are not configured, fallback to app proxy upload endpoint
    return {
      signedUrl: `/api/upload`,
      key: cleanKey,
      publicUrl: `/api/media/${cleanKey}`,
      bucket: bucketName,
    };
  }

  await ensureR2Bucket(bucketName);
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    signedUrl,
    key: cleanKey,
    publicUrl: getR2PublicUrl(cleanKey),
    bucket: bucketName,
  };
}

/**
 * Uploads a Buffer, Uint8Array, or string directly to Cloudflare R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = 'application/octet-stream',
  metadata?: Record<string, string>
): Promise<{ url: string; key: string; size: number }> {
  const { bucketName } = getR2Config();
  const cleanKey = key.replace(/^\/+/, '');

  await ensureR2Bucket(bucketName);
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    })
  );

  const size =
    typeof body === 'string'
      ? Buffer.byteLength(body)
      : (body as Buffer).byteLength || 0;

  return {
    url: getR2PublicUrl(cleanKey),
    key: cleanKey,
    size,
  };
}

/**
 * Retrieves an object from Cloudflare R2.
 */
export async function getR2Object(
  key: string,
  range?: string
): Promise<{
  body: any;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  etag?: string;
  lastModified?: Date;
}> {
  const { bucketName } = getR2Config();
  const cleanKey = key.replace(/^\/+/, '');
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Range: range,
  });

  const res = await client.send(command);

  return {
    body: res.Body,
    contentType: res.ContentType || 'application/octet-stream',
    contentLength: res.ContentLength,
    contentRange: res.ContentRange,
    etag: res.ETag,
    lastModified: res.LastModified,
  };
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  if (!isR2Configured()) return true;

  try {
    const { bucketName } = getR2Config();
    const cleanKey = key.replace(/^\/+/, '');
    const client = getR2Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      })
    );
    return true;
  } catch (err: any) {
    console.error('[R2] Delete error:', err.message || err);
    return false;
  }
}

/**
 * Lists objects in the R2 bucket.
 */
export async function listR2Objects(
  prefix: string = '',
  maxKeys: number = 1000
): Promise<
  Array<{
    key: string;
    size: number;
    lastModified?: Date;
    url: string;
  }>
> {
  if (!isR2Configured()) return [];

  try {
    const { bucketName } = getR2Config();
    const client = getR2Client();

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const res = await client.send(command);
    if (!res.Contents) return [];

    return res.Contents.map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified,
      url: getR2PublicUrl(item.Key || ''),
    }));
  } catch (err: any) {
    console.error('[R2] listObjects error:', err.message || err);
    return [];
  }
}
