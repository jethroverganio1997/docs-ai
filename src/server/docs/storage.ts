const LEGACY_SUPABASE_ASSET_URL =
  /https?:\/\/[^)\s>]+\/storage\/v1\/object\/public\/([^)\s>]+)/g;

function getDocsBaseUrl() {
  const baseUrl = process.env.AWS_DOCS_BASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("AWS_DOCS_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function getPublicAssetsBaseUrl() {
  return process.env.AWS_PUBLIC_ASSETS_BASE_URL?.trim().replace(/\/+$/, "");
}

function encodeStorageKey(storageKey: string) {
  return storageKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function rewriteLegacyAssetUrls(content: string) {
  const assetsBaseUrl = getPublicAssetsBaseUrl();

  if (!assetsBaseUrl) {
    return content;
  }

  return content.replace(LEGACY_SUPABASE_ASSET_URL, (_match, assetPath) => {
    const normalizedPath = String(assetPath).replace(/^\/+/, "");
    return `${assetsBaseUrl}/${normalizedPath}`;
  });
}

export function getDocumentUrl(storageKey: string) {
  return `${getDocsBaseUrl()}/${encodeStorageKey(storageKey)}`;
}

export async function fetchDocumentText(storageKey: string) {
  const response = await fetch(getDocumentUrl(storageKey), {
    next: {
      revalidate: 60 * 60,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch '${storageKey}' from object storage: ${response.status} ${response.statusText}`,
    );
  }

  const content = await response.text();
  return rewriteLegacyAssetUrls(content);
}
