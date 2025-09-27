export type HighlightedText = {
  type: "text";
  content: string;
  styles?: {
    highlight?: boolean;
  };
};


// This helper function is the same as your API route version.
export function parseHighlights(highlightedString: string): HighlightedText[] {
  const parts = highlightedString.split(/<mark>|<\/mark>/g);
  const result: HighlightedText[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part) {
      result.push({
        type: "text",
        content: part,
        styles: {
          highlight: i % 2 === 1,
        },
      });
    }
  }
  return result;
}