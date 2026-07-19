import { marked } from "marked";

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function structuredMarkdown(markdownText: string) {
  const contentWithoutFrontmatter = markdownText.replace(
    /^---\s*[\s\S]*?---\s*/,
    "",
  );

  const tokens = marked.lexer(contentWithoutFrontmatter);
  const headings: Array<{ id: string; content: string }> = [];
  const contents: Array<{ heading: string; content: string }> = [];
  let currentHeadingId = "";

  for (const token of tokens) {
    if (token.type === "heading") {
      currentHeadingId = slugify(token.text);
      headings.push({
        id: currentHeadingId,
        content: token.raw.replace(/^[#]+\s/, ""),
      });
    }

    if (token.type === "paragraph" && currentHeadingId) {
      const cleanedContent = token.text.replace(/\s+/g, " ").trim();

      if (cleanedContent) {
        contents.push({
          heading: currentHeadingId,
          content: cleanedContent,
        });
      }
    }

    if (token.type === "list" && currentHeadingId) {
      for (const item of token.items) {
        const cleanedContent = item.text.replace(/\s+/g, " ").trim();

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
