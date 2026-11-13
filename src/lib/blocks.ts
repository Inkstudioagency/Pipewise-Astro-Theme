/**
 * Renders Strapi "Blocks" rich text to HTML that matches Webflow's rich text output,
 * so the template's `.w-richtext` styles apply unchanged.
 */

type TextNode = { type: 'text'; text: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; code?: boolean };
type LinkNode = { type: 'link'; url: string; children: TextNode[] };
type InlineNode = TextNode | LinkNode;
type ImageData = { url: string; alternativeText?: string | null; width?: number | null; height?: number | null };
type Block =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: Array<{ type: 'list-item'; children: InlineNode[] } | Block> }
  | { type: 'quote'; children: InlineNode[] }
  | { type: 'code'; children: TextNode[] }
  | { type: 'image'; image: ImageData };

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function text(node: TextNode): string {
  // soft line breaks (Shift+Enter in the editor) become <br>, like in Webflow
  let html = escape(node.text).replace(/\n/g, '<br>');
  if (node.code) html = `<code>${html}</code>`;
  if (node.strikethrough) html = `<s>${html}</s>`;
  if (node.underline) html = `<u>${html}</u>`;
  if (node.italic) html = `<em>${html}</em>`;
  if (node.bold) html = `<strong>${html}</strong>`;
  return html;
}

function inline(nodes: InlineNode[]): string {
  return nodes.map((n) => (n.type === 'link' ? `<a href="${escape(n.url)}">${inline(n.children)}</a>` : text(n))).join('');
}

/** Webflow's full-width rich text image (as wide as the text column, up to the image's own width) */
function image(img: ImageData): string {
  const maxWidth = img.width ? ` style="max-width:${img.width}px"` : '';
  return `<figure${maxWidth} class="w-richtext-align-fullwidth w-richtext-figure-type-image"><div><img alt="${escape(img.alternativeText ?? '')}" src="${escape(img.url)}" loading="lazy"></div></figure>`;
}

function block(b: Block): string {
  switch (b.type) {
    case 'paragraph':
      return `<p>${inline(b.children)}</p>`;
    case 'heading':
      return `<h${b.level}>${inline(b.children)}</h${b.level}>`;
    case 'list': {
      const tag = b.format === 'ordered' ? 'ol' : 'ul';
      const items = b.children.map((c) => (c.type === 'list-item' ? `<li>${inline(c.children)}</li>` : block(c))).join('');
      return `<${tag} role="list">${items}</${tag}>`;
    }
    case 'quote':
      return `<blockquote>${inline(b.children)}</blockquote>`;
    case 'code':
      return `<pre><code>${b.children.map((c) => escape(c.text)).join('')}</code></pre>`;
    case 'image':
      return b.image?.url ? image(b.image) : '';
    default:
      return '';
  }
}

export function renderBlocks(blocks: unknown[] | null | undefined): string {
  return ((blocks as Block[] | undefined) ?? []).map((b) => block(b)).join('');
}
