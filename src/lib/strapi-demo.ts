/**
 * Demo content for builds without a Strapi server (STRAPI_URL not set), e.g. the
 * theme's live demo. It reads the same data the Strapi seed script imports
 * (strapi/data/seed.json) and returns it in the shape of the Strapi REST API.
 * The images are served from /cms-demo/ (see integrations/strapi-media.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';

export const DEMO_MEDIA_PATH = '/cms-demo/';

interface Seed {
  media: Record<string, { file: string; alt: string; width?: number; height?: number }>;
  services: Array<Record<string, any>>;
  projects: Array<Record<string, any>>;
  blogs: Array<Record<string, any>>;
}

let seed: Seed | undefined;
function loadSeed(): Seed {
  seed ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), 'strapi', 'data', 'seed.json'), 'utf8')) as Seed;
  return seed;
}

export function demoCollection(pluralApiId: string): any[] {
  const s = loadSeed();
  const media = (key?: string | null) => {
    if (!key) return null;
    const { file, alt, width = null, height = null } = s.media[key];
    return { id: 0, url: DEMO_MEDIA_PATH + file, alternativeText: alt, width, height, mime: '', formats: null };
  };
  const blocks = (nodes: any[] = []) => nodes.map((n) => (n.type === 'image' ? { ...n, image: media(n.image.$media) } : n));
  // The seed lists entries oldest first, like the order the seed script creates them in Strapi
  const meta = (index: number) => ({ id: index + 1, createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() });

  switch (pluralApiId) {
    case 'services':
      return s.services.map((e, i) => ({
        ...meta(i),
        ...e,
        mainImage: media(e.mainImage),
        promiseImage: media(e.promiseImage),
        overviewImage: media(e.overviewImage),
        overview: blocks(e.overview),
      }));
    case 'projects':
      return s.projects.map((e, i) => ({ ...meta(i), ...e, image: media(e.image), overview: blocks(e.overview) }));
    case 'blogs':
      return s.blogs.map((e, i) => ({ ...meta(i), ...e, image: media(e.image), content: blocks(e.content) }));
    default:
      throw new Error(`No demo content for "${pluralApiId}"`);
  }
}
