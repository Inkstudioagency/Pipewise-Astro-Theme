/**
 * Helpers for the interaction runtime (public/js/webflow.js) and the template markup.
 */

/** Normalises a path for comparisons ("/work/" -> "/work") */
export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0];
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

/**
 * Link attributes for a navigation link. Like Webflow, a link that points to the
 * current page gets `aria-current="page"` and the `w--current` class.
 */
export function currentLink(href: string, pathname: string, className: string) {
  const isCurrent = href.startsWith('/') && normalizePath(href) === normalizePath(pathname);
  return {
    href,
    class: isCurrent ? `${className} w--current` : className,
    'aria-current': isCurrent ? ('page' as const) : undefined,
  };
}

/**
 * `data-wf-target` value of an element inside a page (not inside a component instance).
 * The interactions and the pre-paint CSS (src/styles/webflow-ix.css) look elements up by it.
 */
export function pageTarget(pageId: string, elementId: string): string {
  return JSON.stringify([[[pageId, elementId], []]]);
}
