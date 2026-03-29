import { marked } from 'marked';

/**
 * Convert a markdown string to HTML for use in LimeSurvey text fields.
 *
 * - Block content (multiple paragraphs, lists, etc.) is returned as full HTML.
 * - Single-paragraph content has its outer <p>…</p> stripped so that short
 *   labels remain inline strings rather than block elements.
 * - Empty / non-string input is returned as-is.
 */
export function markdownToHtml(text: string): string {
  if (!text) return text;

  const html = (marked.parse(text) as string).trim();

  // Strip the wrapping <p>…</p> only when the output is a single paragraph
  // (i.e. exactly one <p> tag). Multi-paragraph output keeps its structure.
  if (html.startsWith('<p>') && html.endsWith('</p>') && (html.match(/<p>/g) || []).length === 1) {
    return html.slice(3, -4);
  }

  return html;
}
