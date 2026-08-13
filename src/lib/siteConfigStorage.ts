import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import { DEFAULT_FULL_SITE_CONFIG } from '@/app/api/site-config/route';

function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

export function sanitizeConfig(config: any) {
  if (!config || typeof config !== 'object') return config;
  // Defaults fill only fields absent from legacy records. Persisted values are never
  // rewritten or silently substituted at read time.
  return deepMerge(DEFAULT_FULL_SITE_CONFIG, config);
}

export async function fetchSiteConfig() {
  const db = await connectToDatabase();
  if (!db) throw new Error('MongoDB is unavailable. Site configuration could not be read.');
  const configDoc: any = await (SiteConfig as any).findOne().lean();
  // Defaults are bootstrap-only: they are returned only when no SiteConfig document exists.
  if (!configDoc) return DEFAULT_FULL_SITE_CONFIG;
  return sanitizeConfig(configDoc);
}

export async function updateSiteConfigData(body: any) {
  delete body._id;
  delete body.__v;
  delete body.createdAt;
  delete body.updatedAt;

  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection failed. Unable to persist site configuration.');
  }

  const existingDoc: any = await (SiteConfig as any).findOne().lean();
  const payloadToSave = existingDoc ? deepMerge(existingDoc, body) : deepMerge(DEFAULT_FULL_SITE_CONFIG, body);

  delete payloadToSave._id;
  delete payloadToSave.__v;

  const savedDoc: any = await (SiteConfig as any).findOneAndUpdate(
    {},
    { $set: payloadToSave },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  if (!savedDoc) {
    throw new Error('MongoDB update query failed to persist SiteConfig document.');
  }

  // Read-after-write verification from MongoDB
  const verifiedDoc: any = await (SiteConfig as any).findOne().lean();
  if (!verifiedDoc) {
    throw new Error('Read-after-write verification failed: Saved SiteConfig document not found in MongoDB.');
  }

  return sanitizeConfig(verifiedDoc);
}
