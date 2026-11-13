// CMS media in the static build.
//
// - Demo mode (no STRAPI_URL): serves the demo images (strapi/data/uploads) at /cms-demo/
//   in dev and copies them into the build (see src/lib/strapi-demo.ts).
// - Strapi mode: after the build, every Strapi upload referenced by the pages is downloaded
//   into dist/cms/ and the pages are rewritten to use it, so the deployed site never depends
//   on the Strapi server being publicly reachable. Set STRAPI_MEDIA=remote to keep the
//   Strapi URLs instead (e.g. when Strapi serves media from a CDN).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const DEMO_PREFIX = '/cms-demo/';
const LOCAL_PREFIX = '/cms/';
const TYPES = { '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const htmlFiles = (dir) =>
  fs
    .readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(dir, f));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** @returns {import('astro').AstroIntegration} */
export default function strapiMedia() {
  const uploads = path.resolve('strapi/data/uploads');
  let site = '';
  return {
    name: 'strapi-media',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site?.replace(/\/+$/, '') ?? '';
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith(DEMO_PREFIX)) return next();
          const file = path.join(uploads, decodeURIComponent(req.url.slice(DEMO_PREFIX.length).split('?')[0]));
          if (!file.startsWith(uploads) || !fs.existsSync(file)) return next();
          res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream');
          fs.createReadStream(file).pipe(res);
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const files = htmlFiles(out);
        const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };

        // demo content images
        if (files.some((f) => fs.readFileSync(f, 'utf8').includes(DEMO_PREFIX))) {
          fs.cpSync(uploads, path.join(out, DEMO_PREFIX), { recursive: true });
          logger.info('copied the demo content images to /cms-demo/');
        }

        // Strapi uploads
        const base = env.STRAPI_URL?.replace(/\/+$/, '');
        if (!base || env.STRAPI_MEDIA === 'remote') return;
        const re = new RegExp(`(content=")?${escapeRe(base)}(/uploads/[^"'\\s)&]+)`, 'g');
        const pages = files.map((f) => ({ f, html: fs.readFileSync(f, 'utf8') }));
        const urls = new Set(pages.flatMap(({ html }) => [...html.matchAll(re)].map((m) => m[2])));
        if (urls.size === 0) return;
        fs.mkdirSync(path.join(out, 'cms'), { recursive: true });
        for (const url of urls) {
          const response = await fetch(base + url);
          if (!response.ok) throw new Error(`Could not download ${base + url}: ${response.status}`);
          fs.writeFileSync(path.join(out, 'cms', path.basename(url)), Buffer.from(await response.arrayBuffer()));
        }
        for (const { f, html } of pages) {
          // meta tags (og:image) need absolute URLs
          const next = html.replace(re, (_, meta, p) => (meta ? `${meta}${site}` : '') + LOCAL_PREFIX + path.basename(p));
          if (next !== html) fs.writeFileSync(f, next);
        }
        logger.info(`downloaded ${urls.size} Strapi media files to /cms/`);
      },
    },
  };
}
