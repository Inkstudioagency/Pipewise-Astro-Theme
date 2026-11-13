/**
 * Content collections backed by Strapi (see ./strapi).
 *
 * Each loader fetches the published entries at build time (or when the dev server
 * syncs content), normalises Strapi's response and validates it with a schema.
 * Entry ids are the slugs, so pages can use getEntry('services', slug).
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { fetchCollection, mediaUrl, type StrapiMedia } from './lib/strapi';

// ---------- shared shapes

const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  /** Responsive sources from Strapi's image formats (empty for demo content) */
  srcset: z.string().nullable(),
});

// Strapi "Blocks" rich text, rendered by src/components/RichText.astro
const blocksSchema = z.array(z.any()).default([]);

const seoSchema = z.object({
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
});

type Formats = Record<string, { url: string; width: number }> | null | undefined;

function image(media: (StrapiMedia & { formats?: Formats }) | null | undefined, fallbackAlt = '') {
  if (!media) return null;
  const sources = Object.values(media.formats ?? {})
    .filter((f) => f.width >= 500)
    .sort((a, b) => a.width - b.width)
    .map((f) => `${mediaUrl(f.url)} ${f.width}w`);
  if (sources.length && media.width) sources.push(`${mediaUrl(media.url)} ${media.width}w`);
  return {
    url: mediaUrl(media.url),
    alt: media.alternativeText || fallbackAlt,
    width: media.width ?? null,
    height: media.height ?? null,
    srcset: sources.length ? sources.join(', ') : null,
  };
}

function blocks(nodes: any[] | null | undefined) {
  return (nodes ?? []).map((node) =>
    node.type === 'image' && node.image ? { ...node, image: { ...node.image, url: mediaUrl(node.image.url) } } : node,
  );
}

function seo(value: any) {
  return { metaTitle: value?.metaTitle || null, metaDescription: value?.metaDescription || null };
}

const entryMeta = (e: any) => ({ id: e.slug, slug: e.slug, createdAt: e.createdAt, order: e.id });
const entryMetaSchema = { slug: z.string(), createdAt: z.coerce.date(), order: z.number() };

// ---------- collections

const services = defineCollection({
  loader: async () => {
    const entries = await fetchCollection<any>('services', {
      mainImage: true,
      promiseImage: true,
      overviewImage: true,
      promisePoints: true,
      coverage: true,
      seo: true,
    });
    return entries.map((s) => ({
      ...entryMeta(s),
      name: s.name,
      number: s.number ?? '',
      shortName: s.shortName ?? s.name,
      shortDescription: s.shortDescription ?? '',
      heroHeading: s.heroHeading ?? '',
      heroSummary: s.heroSummary ?? '',
      mainImage: image(s.mainImage, s.name),
      promiseImage: image(s.promiseImage, s.name),
      promiseTitle: s.promiseTitle ?? '',
      promiseText: s.promiseText ?? '',
      promisePoints: (s.promisePoints ?? []).map((p: any) => p.text),
      overview: blocks(s.overview),
      overviewImage: image(s.overviewImage, s.name),
      overviewQuote: s.overviewQuote ?? '',
      coverageHeading: s.coverageHeading ?? '',
      coverage: (s.coverage ?? []).map((c: any) => ({ title: c.title, description: c.description })),
      seo: seo(s.seo),
    }));
  },
  schema: z.object({
    ...entryMetaSchema,
    name: z.string(),
    number: z.string(),
    shortName: z.string(),
    shortDescription: z.string(),
    heroHeading: z.string(),
    heroSummary: z.string(),
    mainImage: imageSchema,
    promiseImage: imageSchema,
    promiseTitle: z.string(),
    promiseText: z.string(),
    promisePoints: z.array(z.string()),
    overview: blocksSchema,
    overviewImage: imageSchema,
    overviewQuote: z.string(),
    coverageHeading: z.string(),
    coverage: z.array(z.object({ title: z.string(), description: z.string() })),
    seo: seoSchema,
  }),
});

const projects = defineCollection({
  loader: async () => {
    const entries = await fetchCollection<any>('projects', { image: true, seo: true });
    return entries.map((p) => ({
      ...entryMeta(p),
      name: p.name,
      image: image(p.image, p.name),
      shortDescription: p.shortDescription ?? '',
      longTitle: p.longTitle ?? '',
      serviceType: p.serviceType ?? '',
      propertyType: p.propertyType ?? '',
      location: p.location ?? '',
      duration: p.duration ?? '',
      status: p.projectStatus ?? '',
      overview: blocks(p.overview),
      stats: {
        pipesReplaced: p.pipesReplaced ?? '',
        projectCompleted: p.projectCompleted ?? '',
        improvedWaterFlow: p.improvedWaterFlow ?? '',
        activeLeaks: p.activeLeaks ?? '',
      },
      seo: seo(p.seo),
    }));
  },
  schema: z.object({
    ...entryMetaSchema,
    name: z.string(),
    image: imageSchema,
    shortDescription: z.string(),
    longTitle: z.string(),
    serviceType: z.string(),
    propertyType: z.string(),
    location: z.string(),
    duration: z.string(),
    status: z.string(),
    overview: blocksSchema,
    stats: z.object({
      pipesReplaced: z.string(),
      projectCompleted: z.string(),
      improvedWaterFlow: z.string(),
      activeLeaks: z.string(),
    }),
    seo: seoSchema,
  }),
});

const blogs = defineCollection({
  loader: async () => {
    const entries = await fetchCollection<any>('blogs', { image: true, seo: true });
    return entries.map((b) => ({
      ...entryMeta(b),
      title: b.title,
      image: image(b.image, b.title),
      date: b.date,
      category: b.category ?? '',
      readTime: b.readTime ?? '',
      featured: Boolean(b.featured),
      shortDescription: b.shortDescription ?? '',
      summary: b.summary ?? '',
      content: blocks(b.content),
      seo: seo(b.seo),
    }));
  },
  schema: z.object({
    ...entryMetaSchema,
    title: z.string(),
    image: imageSchema,
    date: z.coerce.date(),
    category: z.string(),
    readTime: z.string(),
    featured: z.boolean(),
    shortDescription: z.string(),
    summary: z.string(),
    content: blocksSchema,
    seo: seoSchema,
  }),
});

export const collections = { services, projects, blogs };
