# Pipewise CMS (Strapi 5)

The content backend of the Pipewise Astro theme. It stores the plumbing services, project case studies and blog articles; the Astro site reads them through the REST API at build time.

## Setup

```bash
npm install
cp .env.example .env   # then replace every "tobemodified" value with a random secret
npm run seed           # demo content + public read access
npm run develop        # http://localhost:1337/admin
```

`npm run seed` only runs on an empty database. Use `npm run seed -- --force` to delete the three collections and import the demo content again.

## Content types

| Type | API | Notes |
| --- | --- | --- |
| Service | `/api/services` | `promisePoints` (max 3) and `coverage` (max 8) are repeatable components; `overview` uses the Blocks editor |
| Project | `/api/projects` | `overview` uses the Blocks editor; the four stats are plain text so values such as `100%`, `12 ft` or `2 Days` work (numbers count up on the site). The status field is called `projectStatus` because `status` is reserved by Strapi for draft/published |
| Blog | `/api/blogs` | `featured` marks the article shown first on `/blog`; `content` uses the Blocks editor |

All three types have an optional `seo` component (`shared.seo`: meta title and description) and use Draft & Publish; the site only shows published entries, newest first. Schemas live in `src/api/*/content-types/*/schema.json` and `src/components`.

## Demo data

`data/seed.json` and `data/uploads/` hold the demo content. Each image is uploaded with its own alternative text, which the theme uses as the `alt` attribute. The Astro site also reads `data/seed.json` directly when it is built without a Strapi server (demo mode).

## MCP server

The Strapi MCP server is enabled (`config/server.ts`, `MCP_ENABLED` in `.env`). It listens on `POST /mcp` (Streamable HTTP) and authenticates with an **admin token** (Settings > Admin tokens), not an API token.

```bash
claude mcp add strapi-mcp --transport http http://localhost:1337/mcp -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

The tools a client sees follow the token's permissions. A token with read, create, update and publish on Service, Project and Blog plus Media Library read exposes `list_service`, `get_service`, `create_service`, `update_service`, `publish_service`, `unpublish_service`, `discard_service_draft`, the same for `project` and `blog`, and `media_list_assets`, `media_get_asset`, `media_list_folders`. Grant delete only if the assistant should be able to delete entries.

Good to know:

- `update_*` validates the whole entry, so an update must include the type's required fields, not only the field being changed. Fields you leave out keep their values.
- Media fields take the numeric id of an existing asset (find it with `media_list_assets`). The MCP server cannot upload files: upload images in the Media Library first.
- Created and updated entries are drafts until `publish_*` is called. The site shows them after the next build.
- Content types themselves are edited in the Content-Type Builder or in the schema files, not through MCP.

## Troubleshooting

- **`Could not load the "sharp" module` / `An Application Control policy has blocked this file` on Windows**: Windows Smart App Control is blocking the native image library that Strapi's Media Library uses. Run Strapi in Docker or WSL, or install sharp's WebAssembly build (`npm install --no-save @img/sharp-wasm32`, repeat after each `npm install`).
- **`Too many requests` on admin login**: Strapi rate-limits admin logins; wait a few minutes or restart the server.

## Production

- Use PostgreSQL or MySQL instead of SQLite (`config/database.ts`, `DATABASE_*` variables).
- Run `npm run build` then `npm run start`.
- Add a webhook (Settings > Webhooks) that triggers a rebuild of the Astro site when entries are published or unpublished.
- If you prefer not to expose the API publicly, remove the Public role's `find`/`findOne` permissions and give the site a read-only API token (`STRAPI_TOKEN`).
