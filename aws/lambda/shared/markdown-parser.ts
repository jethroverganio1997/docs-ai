import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString } from "mdast-util-to-string";

type RootNode = {
  children: Array<Record<string, unknown>>;
};

type Section = {
  content: string;
  heading?: string;
  part?: number;
  total?: number;
};

type ProcessedMarkdown = {
  sections: Section[];
};

function splitTreeBy(
  tree: RootNode,
  predicate: (node: Record<string, unknown>) => boolean,
) {
  return tree.children.reduce<RootNode[]>((trees, node) => {
    const lastTree = trees.at(-1);

    if (!lastTree || predicate(node)) {
      return trees.concat({
        type: "root",
        children: [node],
      } as RootNode);
    }

    lastTree.children.push(node);
    return trees;
  }, []);
}

export function processMarkdown(
  content: string,
  maxSectionLength = 2500,
): ProcessedMarkdown {
  const tree = fromMarkdown(content) as unknown as RootNode | undefined;

  if (!tree) {
    return { sections: [] };
  }

  const sectionTrees = splitTreeBy(
    tree,
    (node) => node.type === "heading",
  );

  const sections = sectionTrees.flatMap<Section>((sectionTree) => {
    const firstNode = sectionTree.children[0];
    const markdown = toMarkdown(sectionTree as never);
    const heading = firstNode?.type === "heading" ? toString(firstNode) : undefined;

    if (markdown.length > maxSectionLength) {
      const numberOfChunks = Math.ceil(markdown.length / maxSectionLength);
      const chunkSize = Math.ceil(markdown.length / numberOfChunks);
      const chunks: string[] = [];

      for (let index = 0; index < numberOfChunks; index += 1) {
        chunks.push(
          markdown.substring(index * chunkSize, (index + 1) * chunkSize),
        );
      }

      return chunks.map((chunk, index) => ({
        content: chunk,
        heading,
        part: index + 1,
        total: numberOfChunks,
      }));
    }

    return {
      content: markdown,
      heading,
    };
  });

  return { sections };
}
