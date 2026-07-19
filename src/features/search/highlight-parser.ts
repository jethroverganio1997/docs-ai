export type HighlightedText = {
  type: "text";
  content: string;
  styles?: {
    highlight?: boolean;
  };
};

export function parseHighlights(highlightedString: string): HighlightedText[] {
  const parts = highlightedString.split(/<mark>|<\/mark>/g);
  const result: HighlightedText[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (!part) {
      continue;
    }

    result.push({
      type: "text",
      content: part,
      styles: {
        highlight: index % 2 === 1,
      },
    });
  }

  return result;
}
