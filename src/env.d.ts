/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Base URL of the Strapi backend, e.g. http://localhost:1337. Unset = demo content. */
  readonly STRAPI_URL?: string;
  /** Optional read-only Strapi API token (server-side only, never exposed to the browser) */
  readonly STRAPI_TOKEN?: string;
  /** Optional endpoint that receives form submissions (see src/scripts/forms.ts) */
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Webflow runtime queue / API (public/js/webflow.js) */
  Webflow?: Array<() => void>;
}

// Attribute triggers of the template's scroll interactions (see src/styles/webflow-ix.css)
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    parallax?: string;
  }
  interface SVGAttributes {
    parallax?: string;
  }
}
