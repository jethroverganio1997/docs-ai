import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function getFileUrl(origin: string, pathname: string) {
  const path = getFilePath(pathname);
  return `${origin}${path}`;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
