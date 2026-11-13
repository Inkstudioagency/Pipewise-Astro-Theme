/**
 * Queries used by the pages. Each helper reproduces the sort, filter and limit of the
 * matching collection list in the original template. By default entries are shown
 * newest first (the order they were created in Strapi).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import config from '@/config/config.json';

export type Service = CollectionEntry<'services'>['data'];
export type Project = CollectionEntry<'projects'>['data'];
export type Blog = CollectionEntry<'blogs'>['data'];

/** Newest first (creation date, then entry id for entries created at the same moment) */
const newestFirst = <T extends { createdAt: Date; order: number }>(a: T, b: T) =>
  b.createdAt.getTime() - a.createdAt.getTime() || b.order - a.order;

// ---------- services

/** Every service, newest first (navigation menu, home page sliders) */
export async function getServices(): Promise<Service[]> {
  return (await getCollection('services')).map((e) => e.data).sort(newestFirst);
}

/**
 * /service list: the order set in `collections.services_page_order` (config.json),
 * followed by any other service, newest first.
 */
export async function getServicesPageOrder(): Promise<Service[]> {
  const all = await getServices();
  const order: string[] = config.collections.services_page_order;
  const listed = order.map((slug) => all.find((s) => s.slug === slug)).filter((s): s is Service => Boolean(s));
  return [...listed, ...all.filter((s) => !order.includes(s.slug))];
}

/** "Related services" on a service page: the newest services except the current one */
export async function getRelatedServices(slug: string, limit = 3) {
  return (await getServices()).filter((s) => s.slug !== slug).slice(0, limit);
}

/** Anchor id of a service on /service, e.g. "Leak Detection & Repair" -> "Leak-Detection-Repair" */
export const serviceAnchor = (service: Service) => service.name.replace(/&/g, ' ').trim().split(/\s+/).join('-');

// ---------- projects

/** Every project, newest first */
export async function getProjects(): Promise<Project[]> {
  return (await getCollection('projects')).map((e) => e.data).sort(newestFirst);
}

// ---------- blogs

/** Every article, newest first */
export async function getBlogs(): Promise<Blog[]> {
  return (await getCollection('blogs')).map((e) => e.data).sort(newestFirst);
}

/** The featured article (the newest one marked "featured"), or the newest article */
export async function getFeaturedBlog(): Promise<Blog | undefined> {
  const blogs = await getBlogs();
  return blogs.find((b) => b.featured) ?? blogs[0];
}

/** Articles that are not featured, latest publication date first (/blog and the home page V2 grid) */
export async function getBlogsByDate(): Promise<Blog[]> {
  return (await getBlogs()).filter((b) => !b.featured).sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * "Related Articles" on an article page: the newest articles except the current one,
 * skipping the very newest (it is promoted on the home page), like the template.
 */
export async function getRelatedBlogs(slug: string, limit = 3) {
  return (await getBlogs()).filter((b) => b.slug !== slug).slice(1, 1 + limit);
}

// ---------- links and formatting

/** Resolves the `$latest-*` placeholders of src/config/menu.json to the newest entry of a collection */
export async function resolveLink(url: string): Promise<string> {
  switch (url) {
    case '$latest-service':
      return `/services/${(await getServices())[0]?.slug ?? ''}`;
    case '$latest-project':
      return `/projects/${(await getProjects())[0]?.slug ?? ''}`;
    case '$latest-blog':
      return `/blogs/${(await getBlogs())[0]?.slug ?? ''}`;
    case '$featured-blog':
      return `/blogs/${(await getFeaturedBlog())?.slug ?? ''}`;
    default:
      return url;
  }
}

/** "September 9, 2025" */
export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
