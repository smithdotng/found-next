import { marked } from "marked";

/**
 * Blog/project bodies are admin-authored. Older posts are plain text with blank-line
 * paragraphs and "- " bullets (the EJS view's formatContent handled that); newer ones may be HTML.
 * HTML passes through; plain text is rendered as Markdown, which covers the same cases.
 */
export function renderRichText(content = ""): string {
  if (/<(p|h[1-6]|ul|ol|div|br|img|blockquote)\b/i.test(content)) return content;
  return marked.parse(content, { async: false, breaks: true, gfm: true }) as string;
}
