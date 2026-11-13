# Pipewise — Astro theme with Strapi CMS

Pipewise is a plumbing and home-services theme for [Astro](https://astro.build). Services, project case studies and blog articles are managed in [Strapi](https://strapi.io), which is included in the `strapi/` folder with demo content.

- 15 pages: three home layouts, About, Services, Service Area, Membership, three project layouts, Blog, three contact layouts and 404
- Detail pages generated from Strapi: `/services/[slug]`, `/projects/[slug]` and `/blogs/[slug]`
- Page-load and scroll animations, smooth scrolling, sliders, tabbed and accordion sections, FAQ accordions, a mega menu, background videos, count-up numbers and a mobile menu
- Static output: no server needed in production, the site is rebuilt when content changes

## Requirements

- Node.js 22.23.4 or newer (Strapi supports Node 20 to 26)
- npm (any package manager works; the scripts below use npm)

## Quick start

```bash
# 1. Install the theme and the CMS
npm install
npm run cms:install

# 2. Configure Strapi (replace every "tobemodified" value with a random secret)
cp strapi/.env.example strapi/.env

# 3. Load the demo content into Strapi (services, projects, blogs and their images)
npm run cms:seed

# 4. Start Strapi on http://localhost:1337 (create your admin user at /admin)
npm run cms:dev

# 5. In a second terminal: configure and start Astro on http://localhost:4321
cp .env.example .env
npm run dev
```

`npm run build` writes the static site to `dist/`. The content is fetched from Strapi at build time, so Strapi must be reachable while building.

### Demo mode (no Strapi)

When `STRAPI_URL` is not set, the site is built from the demo content bundled in `strapi/data/seed.json` (the same data `npm run cms:seed` imports), and its images are served from `/cms-demo/`. This lets you preview the theme with just `npm install && npm run build`. Set `STRAPI_URL` to switch to your Strapi content.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `STRAPI_URL` | yes, for your own content | Base URL of the Strapi server, e.g. `http://localhost:1337`. Leave it unset to build with the demo content. |
| `STRAPI_TOKEN` | no | Read-only API token. Leave empty if the Public role can read the content (the seed script allows `find` and `findOne`). |
| `STRAPI_MEDIA` | no | By default the build downloads every Strapi image it uses into `dist/cms/`, so the deployed site does not depend on Strapi. Set it to `remote` to link to the Strapi URLs instead (e.g. when Strapi serves media from a CDN). |
| `PUBLIC_FORM_ENDPOINT` | no | URL that receives the contact, request and newsletter forms (Formspree, Basin, Getform or your own API). Without it, forms show their success message but send nothing. |

The Strapi server has its own `strapi/.env` (secrets, database, `MCP_ENABLED`); see `strapi/.env.example`. Never commit either `.env` file.

## Project structure

```text
├── public/
│   ├── images/            # theme images, icons and favicons
│   ├── videos/            # background videos (mp4 + webm + poster)
│   ├── documents/         # Lottie animation (globe)
│   ├── fonts/             # Switzer (headings)
│   └── js/                # interaction runtime (webflow.js) and jQuery
├── integrations/          # CMS media in the build (demo images, Strapi downloads)
├── src/
│   ├── components/
│   │   ├── cards/         # Strapi entry cards (service, project and blog cards)
│   │   ├── cms/           # DynList: collection list wrapper with the empty state
│   │   ├── layout/        # Header, Footer
│   │   ├── sections/      # page sections, one folder per page (+ shared)
│   │   ├── shared/        # call to action shown on every page
│   │   ├── RichText.astro # Strapi rich text
│   │   └── SeoMeta.astro
│   ├── config/            # config.json (site settings), menu.json (navigation, footer)
│   ├── layouts/           # BaseLayout
│   ├── lib/               # Strapi client, demo content, queries, rich text renderer
│   ├── pages/             # routes, including services/, projects/ and blogs/ [slug] pages
│   ├── scripts/           # animations and forms (client side)
│   ├── styles/            # theme CSS
│   └── content.config.ts  # Strapi-backed content collections
└── strapi/                # Strapi 5 project (content types, seed data and script)
```

## Content model (Strapi)

| Collection | Fields | Used on |
| --- | --- | --- |
| **Service** | name, slug, number, short name, short description, main image, hero heading and summary, promise image, title and text, promise points (up to 3), overview (rich text), overview image and quote, coverage heading, coverage items (up to 8 × title + description), SEO | Home sliders, `/service`, navigation menu, `/services/[slug]` |
| **Project** | name, slug, image, short description, long title, service type, property type, location, duration, project status, overview (rich text), four stats (pipes replaced, project completed, improved water flow, active leaks), SEO | Home sliders, `/project-v1`, `/project-v2`, `/project-v3`, `/projects/[slug]` |
| **Blog** | title, slug, image, date, category, read time, featured, short description, summary, content (rich text), SEO | Home blog sections, `/blog`, `/blogs/[slug]` |

Shared components: `shared.seo`, `service.coverage-item`, `service.promise-point`. Rich text uses Strapi's Blocks editor and is rendered with the template's rich text styles (`src/lib/blocks.ts`). Image alternative text comes from each file's **Alternative text** in the Media Library.

Which entries appear where (like the original template):

- Lists are newest first (the order entries were created in Strapi). Home page sliders take the first entries of that order.
- `/service` follows `collections.services_page_order` in `src/config/config.json` (a list of slugs); services not in the list follow, newest first.
- `/blog`: the featured article (`featured` on), then the other articles by date, latest first. Related articles on an article page: the newest articles except the current one, skipping the very newest.
- Related services on a service page: the three newest other services.
- The footer's "Service/Blog/Project Details" links point to the newest entry of each collection.

The queries live in `src/lib/content.ts`.

### Publishing changes

The site is static, so published changes appear after the next build. In production, add a webhook in Strapi (Settings > Webhooks) that calls your host's deploy hook on entry publish/unpublish.

### Strapi MCP server

The [Strapi MCP server](https://docs.strapi.io/cms/features/strapi-mcp-server) is enabled in `strapi/config/server.ts`, so AI assistants can list, create, update and publish services, projects and blogs and browse the Media Library. Create an admin token in the Strapi admin (Settings > Admin tokens), then connect, for example with Claude Code:

```bash
claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

See `strapi/README.md` for token permissions and caveats. Set `MCP_ENABLED=false` in `strapi/.env` to turn it off.

## Customization

- **Site settings, SEO defaults, announcement bar, contact details, footer texts**: `src/config/config.json`
- **Navigation, the "Pages" mega menu and footer links**: `src/config/menu.json`
- **Page titles and descriptions**: the `BaseLayout` props in each file in `src/pages`
- **Colors, spacing and typography**: the CSS variables at the top of `src/styles/pipewise.css`
- **Fonts**: Geist (body) is self-hosted through `fonts` in `astro.config.mjs`; Switzer (headings) lives in `public/fonts`
- **Forms**: set `PUBLIC_FORM_ENDPOINT`; the handler is `src/scripts/forms.ts`

### Animations

Animations are attached with attributes such as `to-top-0`, `to-top-2` and `parallax`, and played by the interaction runtime in `public/js/webflow.js`, which also runs the sliders, tabs, dropdowns, mobile menu, background videos and the Lottie globe. Each page passes its `wfPage` id to `BaseLayout`; keep it when you edit a page, because the runtime uses it to find that page's animations. Elements with `data-counter` count up when scrolled into view (`src/scripts/animations.ts`).

## Deployment

Build with `npm run build` and deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages...). Set `STRAPI_URL` (and `STRAPI_TOKEN` if used) in the host's build settings, and set `site.base_url` in `src/config/config.json` to your domain.

Deploy Strapi separately (Strapi Cloud, a VPS or a container), with a production database such as PostgreSQL; see `strapi/config/database.ts`.

## Troubleshooting

- **Build fails with "Could not reach Strapi"**: start Strapi (`npm run cms:dev`) or check `STRAPI_URL` in `.env`.
- **Build fails with a 401/403 from Strapi**: run `npm run cms:seed` (it allows public read access) or set `STRAPI_TOKEN`.
- **`An Application Control policy has blocked this file` on Windows**: Windows Smart App Control can block newly published native modules (Astro's compiler, sharp). Install the WebAssembly build of the blocked module without saving it, e.g. `npm install --no-save --force @astrojs/compiler-binding-wasm32-wasi` (repeat after each `npm install`), or run the project in WSL.

## Credits

Designed by [Ink Studio](https://www.inks.studio/). Photos and videos are for demo purposes; replace them with your own.
