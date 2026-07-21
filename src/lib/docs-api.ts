import "server-only";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

function getDocsApiBaseUrl() {
  const value = process.env.DOCS_API_BASE_URL?.trim();

  if (!value) {
    throw new Error("DOCS_API_BASE_URL is not configured.");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("DOCS_API_BASE_URL must be a valid HTTP(S) URL.");
  }

  if (!HTTP_PROTOCOLS.has(url.protocol) || url.search || url.hash) {
    throw new Error(
      "DOCS_API_BASE_URL must be an HTTP(S) URL without query parameters or a fragment.",
    );
  }

  return url.href.endsWith("/") ? url.href : `${url.href}/`;
}

export function getDocsApiUrl(path: string) {
  return new URL(path.replace(/^\/+/, ""), getDocsApiBaseUrl());
}

export async function fetchDocsApi(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const authorization = process.env.DOCS_API_AUTHORIZATION?.trim();
  const apiKey = process.env.DOCS_API_KEY?.trim();

  headers.set("Accept", headers.get("Accept") ?? "application/json");

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  if (apiKey) {
    headers.set("x-api-key", apiKey);
  }

  return fetch(getDocsApiUrl(path), {
    ...init,
    headers,
  });
}
