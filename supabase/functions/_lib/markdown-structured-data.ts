
import { marked } from 'https://esm.sh/marked@16.3.0';

/**
 * A slugify function to create URL-friendly IDs from heading text.
 */
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, '')      // Remove HTML tags
    .replace(/[^\w\s-]/g, '')     // Remove all non-word chars except space and dash
    .replace(/[\s_-]+/g, '-')     // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing dashes
};

/**
 * The main processing function.
 */
export function structuredMarkdown(markdownText: string) {
  // 1. Remove frontmatter (we don't need it for the output)
  const contentWithoutFrontmatter = markdownText.replace(/^---\s*[\s\S]*?---\s*/, '');

  // 2. Use marked.lexer to get a tokenized structure of the Markdown
  const tokens = marked.lexer(contentWithoutFrontmatter);

  const headings: { id: string; content: string }[] = [];
  const contents: { heading: string; content: string }[] = [];
  let currentHeadingId = '';

  // 3. Iterate over the tokens to build the desired JSON structure
  for (const token of tokens) {
    if (token.type === 'heading') {
      currentHeadingId = slugify(token.text);
      headings.push({
        id: currentHeadingId,
        content: token.raw.replace(/^[#]+\s/, ''), // Store the raw text without the '#'
      });
    }

    // Process paragraphs that fall under a heading
    if (token.type === 'paragraph' && currentHeadingId) {
      // Clean up text content to match the desired output format
      const cleanedContent = token.text.replace(/\s+/g, ' ').trim();
      if (cleanedContent) {
        contents.push({
          heading: currentHeadingId,
          content: cleanedContent,
        });
      }
    }

    // Process list items, creating a separate entry for each
    if (token.type === 'list' && currentHeadingId) {
      for (const item of token.items) {
        const cleanedContent = item.text.replace(/\s+/g, ' ').trim();
        if (cleanedContent) {
          contents.push({
            heading: currentHeadingId,
            content: cleanedContent,
          });
        }
      }
    }
  }

  return { headings, contents };
}
