"use server";

import matter from "gray-matter";
import { PageTree } from "fumadocs-core/server";
import { notFound } from "next/navigation";
import { queryRows } from "@/server/db";
import { fetchDocumentText } from "@/server/docs/storage";
import { type Frontmatter } from "./types";
import { formatName, getFilePath } from "./utils";

type DocumentPathRecord = {
  storage_key: string;
};

async function listAllFilePaths(): Promise<DocumentPathRecord[]> {
  try {
    return await queryRows<DocumentPathRecord>(
      `
        select storage_key
        from documents
        order by storage_key asc
      `,
    );
  } catch (error) {
    console.error("Error fetching file paths:", error);
    return [];
  }
}

export async function getPage(
  slugs: string[],
): Promise<{
  frontmatter: Frontmatter;
  content: string;
  directPath: string;
  url: string;
}> {
  const url = getFilePath(slugs.join("/"));

  if (slugs.length === 0) {
    return notFound();
  }

  const directPath = `${slugs.join("/")}.mdx`;

  try {
    const rawContent = await fetchDocumentText(directPath);

    if (!rawContent) {
      return notFound();
    }

    const { data: frontmatter, content } = matter(rawContent);
    const fallbackTitle = formatName(slugs.at(-1) ?? directPath);

    return {
      frontmatter: {
        title: frontmatter.title ?? fallbackTitle,
        description: frontmatter.description,
      } as Frontmatter,
      content,
      directPath,
      url,
    };
  } catch (error) {
    console.error("An unexpected error occurred in getPage:", error);
    return notFound();
  }
}

export async function getPageTree(): Promise<PageTree.Root> {
  const allPaths = await listAllFilePaths();

  allPaths.sort((a, b) => a.storage_key.localeCompare(b.storage_key));

  const root: PageTree.Root = {
    name: "Docs",
    children: [],
  };

  for (const fullPath of allPaths) {
    if (!fullPath.storage_key) {
      continue;
    }

    const parts = fullPath.storage_key.split("/");
    const fileName = parts.pop()!;
    const dirParts = parts;

    let currentNode: PageTree.Folder | PageTree.Root = root;

    for (const part of dirParts) {
      const formattedPartName = formatName(part);
      let folderNode: PageTree.Folder | undefined = currentNode.children.find(
        (node): node is PageTree.Folder =>
          node.type === "folder" && node.name === formattedPartName,
      );

      if (!folderNode) {
        folderNode = {
          type: "folder",
          name: formattedPartName,
          defaultOpen: currentNode === root,
          children: [],
        };
        currentNode.children.push(folderNode);
      }

      currentNode = folderNode;
    }

    const pageNode: PageTree.Item = {
      type: "page",
      name: formatName(fileName),
      url: getFilePath(fullPath.storage_key),
    };

    currentNode.children.push(pageNode);
  }

  sortTree(root);

  return root;
}

function sortTree(node: PageTree.Root | PageTree.Folder): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    const aName = String(a.name).toLowerCase();
    const bName = String(b.name).toLowerCase();

    if (aName === "getting-started" && bName !== "getting-started") {
      return -1;
    }
    if (bName === "getting-started" && aName !== "getting-started") {
      return 1;
    }

    if (a.type === "folder" && b.type === "page") return -1;
    if (a.type === "page" && b.type === "folder") return 1;

    return String(a.name).localeCompare(String(b.name));
  });

  for (const child of node.children) {
    if (child.type === "folder") {
      sortTree(child);
    }
  }
}
