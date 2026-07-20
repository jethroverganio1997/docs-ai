export type PageTreeNode = {
  type: "page" | "folder";
  name: string;
  url?: string;
  defaultOpen?: boolean;
  children?: PageTreeNode[];
};

export type PageTreeRoot = {
  name: string;
  children: PageTreeNode[];
};

export function formatName(name: string): string {
  const spacedName = name.replace(/-/g, " ");
  const withoutExt = spacedName.replace(/\.[^/.]+$/, "");
  const words = withoutExt.split(" ");

  if (words.length === 0) return "";

  const formatted = words[0].charAt(0).toUpperCase() +
    words[0].slice(1).toLowerCase();

  return [formatted, ...words.slice(1).map((word) => word.toLowerCase())].join(
    " ",
  );
}

export function normalizeRouteUrl(url: string) {
  return url.startsWith("/") ? url : `/${url}`;
}

export function getRouteSegments(url: string) {
  return url
    .replace(/^\/+/, "")
    .replace(/^docs\/?/, "")
    .split("/")
    .filter(Boolean);
}

export function sortTree(node: PageTreeRoot | PageTreeNode): void {
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
