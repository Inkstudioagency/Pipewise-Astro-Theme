/**
 * Minimal Strapi 5 REST client used by the content collections (src/content.config.ts).
 * Runs at build time (and when the dev server syncs content), never in the browser.
 *
 * Configure with environment variables (see .env.example):
 *   STRAPI_URL    Base URL of the Strapi server, e.g. http://localhost:1337
 *   STRAPI_TOKEN  Optional read-only API token. Without it the Public role must allow find/findOne.
 *
 * Without STRAPI_URL the site is built from the bundled demo content (see ./strapi-demo.ts).
 */
import { DEMO_MEDIA_PATH, demoCollection } from './strapi-demo';

export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  mime: string;
}

type PopulateTree = { [field: string]: true | { populate: PopulateTree } };

// Values from .env arrive through import.meta.env; variables set by the shell or CI through process.env
const env = (key: 'STRAPI_URL' | 'STRAPI_TOKEN'): string | undefined =>
  import.meta.env[key] || (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[key] || undefined;

/** True when no Strapi server is configured: the build then uses the demo content */
export const isDemoMode = (): boolean => !env('STRAPI_URL');

export function strapiUrl(): string {
  const url = env('STRAPI_URL');
  if (!url) {
    throw new Error('STRAPI_URL is not set. Copy .env.example to .env and point it at your Strapi server.');
  }
  return url.replace(/\/+$/, '');
}

/** Turns relative media paths from the local upload provider into absolute URLs */
export function mediaUrl(url: string): string {
  if (url.startsWith(DEMO_MEDIA_PATH)) return url;
  return url.startsWith('/') ? `${strapiUrl()}${url}` : url;
}

/** Serialises a populate tree into Strapi's bracket query syntax */
function populateParams(tree: PopulateTree, prefix = 'populate', params = new URLSearchParams()) {
  for (const [field, value] of Object.entries(tree)) {
    if (value === true) params.append(`${prefix}[${field}]`, 'true');
    else populateParams(value.populate, `${prefix}[${field}][populate]`, params);
  }
  return params;
}

let warnedDemo = false;

/** Fetches every published entry of a collection type, following pagination */
export async function fetchCollection<T>(pluralApiId: string, populate: PopulateTree = {}): Promise<T[]> {
  if (isDemoMode()) {
    if (!warnedDemo) console.warn('[strapi] STRAPI_URL is not set: building with the demo content from strapi/data/seed.json');
    warnedDemo = true;
    return demoCollection(pluralApiId) as T[];
  }
  const base = strapiUrl();
  const token = env('STRAPI_TOKEN');
  const results: T[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const params = populateParams(populate);
    params.set('pagination[page]', String(page));
    params.set('pagination[pageSize]', '100');
    const url = `${base}/api/${pluralApiId}?${params}`;

    let response: Response;
    try {
      response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch (error) {
      throw new Error(`Could not reach Strapi at ${base}. Is it running? (${(error as Error).message})`);
    }
    if (!response.ok) {
      const hint =
        response.status === 401 || response.status === 403
          ? ' Check STRAPI_TOKEN or allow find/findOne for the Public role.'
          : '';
      throw new Error(`Strapi request failed: ${response.status} ${response.statusText} for /api/${pluralApiId}.${hint}`);
    }

    const json = (await response.json()) as { data: T[]; meta: { pagination: { pageCount: number } } };
    results.push(...json.data);
    pageCount = json.meta.pagination.pageCount;
    page += 1;
  } while (page <= pageCount);

  return results;
}
