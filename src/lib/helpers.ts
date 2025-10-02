export function getFileName(path: string) {
  const fileName = path.split("/").at(-1) ?? "";
  return fileName.replace(/\.[^/.]+$/, "");
}

export function getFilePath(path: string) {
  const docsPath = "/docs/";
  const parts = path.split(".");

  // If no folder, return just the file name without extension
  return docsPath + parts[0];
}

export function getFileType(path: string) {
  return path.split(".").at(-1);
}

export function getFileUrl(origin: string, pathname: string): string {
  const path = getFilePath(pathname);
  return `${origin}${path}`;
}

// ex: Dec 5, 2023 12:50
export function formatDateWithTime(
  dateInput: string | Date | undefined | null,
): string {
  if (!dateInput) return "";

  const d = new Date(dateInput);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[d.getMonth()];

  const day = d.getDate();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

// YYYY-MM-DD
export function formatDateToYearMonthDay(dateInput: string | undefined) {
  return dateInput ? new Date(dateInput).toISOString().split("T")[0] : "";
}

export function formatName(name: string): string {
  // Replace dashes with spaces
  const spacedName = name.replace(/-/g, " ");

  // Remove any extension at the end (e.g. .mdx, .ts, .js, .json, etc.)
  const withoutExt = spacedName.replace(/\.[^/.]+$/, "");

  // Split into words
  const words = withoutExt.split(" ");

  if (words.length === 0) return "";

  // Capitalize only the first word, rest lowercase
  const formatted = words[0].charAt(0).toUpperCase() +
    words[0].slice(1).toLowerCase();

  return [formatted, ...words.slice(1).map((w) => w.toLowerCase())].join(" ");
}
