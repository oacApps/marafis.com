/**
 * rich-text-to-html.ts
 * Converts Strapi block/markdown content into brand-styled HTML
 * for use with [innerHTML] in article-details.html.
 *
 * Strapi v5 delivers content as an array of blocks (rich text editor).
 * Each block has a `type` and optionally `children` (inline nodes) or
 * a `body` string (legacy markdown field).
 *
 * Output HTML uses Marafis CSS class names from article-details.scss
 * so every element inherits the black/gold brand styling.
 */

// ── Type definitions ──────────────────────────────────────────────────────────

interface InlineNode {
  type:   'text' | 'link';
  text?:  string;
  bold?:  boolean;
  italic?: boolean;
  code?:  boolean;
  url?:   string;
  children?: InlineNode[];
}

interface BlockNode {
  type:     string;           // heading | paragraph | list | code | quote | image | divider
  level?:   number;           // for headings: 1–6
  format?:  'ordered' | 'unordered';
  children?: (InlineNode | BlockNode)[];
  language?: string;          // for code blocks
  image?:   { url: string; alternativeText?: string; caption?: string };
  body?:    string;           // legacy markdown fallback
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Call this with either:
 *  a) an array of Strapi block nodes (v5 rich text)
 *  b) a raw markdown/HTML string (legacy fallback)
 */
export function markdownToHtml(input: BlockNode[] | string | null | undefined): string {
  if (!input) return '';

  // Array of blocks — Strapi v5 rich text format
  if (Array.isArray(input)) {
    return input.map(block => renderBlock(block)).join('\n');
  }

  // String — could be markdown or already HTML
  if (typeof input === 'string') {
    // If it looks like HTML already, just pass through the brand wrapper
    if (input.trim().startsWith('<')) {
      return input;
    }
    // Otherwise treat as markdown
    return parseMarkdown(input);
  }

  return '';
}

// ── Block renderer (Strapi v5) ────────────────────────────────────────────────

function renderBlock(block: BlockNode): string {
  switch (block.type) {

    case 'heading': {
      const level   = block.level ?? 2;
      const text    = renderChildren(block.children ?? []);
      const cls     = level <= 2 ? 'content-heading' : 'content-subheading';
      const id      = slugify(stripTags(text));
      return `<h${level} class="${cls}" id="${id}">${text}</h${level}>`;
    }

    case 'paragraph': {
      const text = renderChildren(block.children ?? []);
      if (!text.trim()) return '';
      return `<p class="content-paragraph">${text}</p>`;
    }

    case 'list': {
      const tag  = block.format === 'ordered' ? 'ol' : 'ul';
      const cls  = 'content-list';
      const items = (block.children ?? [])
        .map(child => `<li>${renderChildren((child as BlockNode).children ?? [])}</li>`)
        .join('\n');
      return `<${tag} class="${cls}">\n${items}\n</${tag}>`;
    }

    case 'code': {
      const lang = block.language ?? '';
      const code = renderChildren(block.children ?? [], true);
      return `
<div class="content-code-block">
  <div class="code-header">
    <span class="code-lang">${lang || 'code'}</span>
    <button class="copy-btn" onclick="
      const pre = this.closest('.content-code-block').querySelector('code');
      navigator.clipboard.writeText(pre.innerText).then(() => {
        this.textContent = 'Copied';
        setTimeout(() => this.textContent = 'Copy', 2000);
      })">Copy</button>
  </div>
  <pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>
</div>`;
    }

    case 'quote': {
      const text = renderChildren(block.children ?? []);
      return `
<blockquote class="content-quote">
  <div class="quote-mark">"</div>
  <p>${text}</p>
</blockquote>`;
    }

    case 'image': {
      if (!block.image?.url) return '';
      const alt = block.image.alternativeText ?? '';
      const cap = block.image.caption ?? '';
      return `
<figure class="content-figure">
  <img src="${block.image.url}" alt="${escapeAttr(alt)}" class="content-image" loading="lazy"/>
  ${cap ? `<figcaption class="content-caption">${escapeHtml(cap)}</figcaption>` : ''}
</figure>`;
    }

    case 'divider':
      return `
<div class="content-divider">
  <div class="divider-line"></div>
  <div class="divider-diamond"></div>
  <div class="divider-line"></div>
</div>`;

    case 'list-item':
      // handled inside 'list' above, but guard against direct call
      return renderChildren(block.children ?? []);

    default:
      // Unknown block — render children as paragraph fallback
      if (block.children?.length) {
        const text = renderChildren(block.children as InlineNode[]);
        return text ? `<p class="content-paragraph">${text}</p>` : '';
      }
      return '';
  }
}

// ── Inline renderer ───────────────────────────────────────────────────────────

function renderChildren(
  nodes: (InlineNode | BlockNode)[],
  plainText = false
): string {
  return nodes.map(node => renderInline(node as InlineNode, plainText)).join('');
}

function renderInline(node: InlineNode, plainText: boolean): string {
  if (node.type === 'link') {
    const inner = renderChildren(node.children ?? [], plainText);
    if (plainText) return inner;
    const href = escapeAttr(node.url ?? '#');
    return `<a href="${href}" class="content-link" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }

  let text = escapeHtml(node.text ?? '');
  if (plainText) return node.text ?? '';

  if (node.code)   text = `<code class="inline-code">${text}</code>`;
  if (node.bold)   text = `<strong>${text}</strong>`;
  if (node.italic) text = `<em>${text}</em>`;

  return text;
}

// ── Markdown fallback parser ──────────────────────────────────────────────────
// Used when Strapi returns a raw string instead of block array

function parseMarkdown(md: string): string {
  const lines   = md.split('\n');
  const output: string[] = [];
  let   inCode  = false;
  let   codeLang = '';
  let   codeLines: string[] = [];
  let   inList  = false;
  let   listItems: string[] = [];
  let   ordered = false;

  const flushList = () => {
    if (!listItems.length) return;
    const tag = ordered ? 'ol' : 'ul';
    output.push(`<${tag} class="content-list">\n${listItems.map(i => `<li>${i}</li>`).join('\n')}\n</${tag}>`);
    listItems = [];
    inList    = false;
    ordered   = false;
  };

  const flushCode = () => {
    if (!codeLines.length) return;
    output.push(`
<div class="content-code-block">
  <div class="code-header">
    <span class="code-lang">${codeLang || 'code'}</span>
    <button class="copy-btn" onclick="
      const pre = this.closest('.content-code-block').querySelector('code');
      navigator.clipboard.writeText(pre.innerText).then(() => {
        this.textContent = 'Copied';
        setTimeout(() => this.textContent = 'Copy', 2000);
      })">Copy</button>
  </div>
  <pre><code class="language-${codeLang}">${escapeHtml(codeLines.join('\n'))}</code></pre>
</div>`);
    codeLines = [];
    codeLang  = '';
    inCode    = false;
  };

  for (const line of lines) {
    // Code fence
    if (line.startsWith('```')) {
      if (!inCode) {
        flushList();
        codeLang = line.slice(3).trim();
        inCode   = true;
      } else {
        flushCode();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // Heading
    const hMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      const text  = inlineMarkdown(hMatch[2]);
      const cls   = level <= 2 ? 'content-heading' : 'content-subheading';
      output.push(`<h${level} class="${cls}">${text}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      const text = inlineMarkdown(line.slice(2));
      output.push(`<blockquote class="content-quote"><div class="quote-mark">"</div><p>${text}</p></blockquote>`);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushList();
      output.push(`<div class="content-divider"><div class="divider-line"></div><div class="divider-diamond"></div><div class="divider-line"></div></div>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[\-\*\+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || ordered) { flushList(); inList = true; ordered = false; }
      listItems.push(inlineMarkdown(ulMatch[1]));
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || !ordered) { flushList(); inList = true; ordered = true; }
      listItems.push(inlineMarkdown(olMatch[1]));
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Paragraph
    flushList();
    output.push(`<p class="content-paragraph">${inlineMarkdown(line)}</p>`);
  }

  flushList();
  if (inCode) flushCode();

  return output.join('\n');
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="content-link" target="_blank" rel="noopener noreferrer">$1</a>');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}
