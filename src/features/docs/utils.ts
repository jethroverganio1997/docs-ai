export function getFileName(path: string) {
  const fileName = path.split("/").at(-1) ?? "";
  return fileName.replace(/\.[^/.]+$/, "");
}

export function getFilePath(path: string) {
  const docsPath = "/docs/";
  const parts = path.split(".");
  return docsPath + parts[0];
}

export function getFileUrl(origin: string, pathname: string): string {
  const path = getFilePath(pathname);
  return `${origin}${path}`;
}

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
