export function getFileName(path: string) {
  const fileName = path.split("/").at(-1) ?? "";
  return fileName.replace(/\.mdx$/, ""); // remove only ".mdx"
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
