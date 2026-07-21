import { NextResponse } from "next/server";
import { fetchDocsApi } from "./docs-api";

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);
const RESPONSE_HEADERS = ["content-type"];

function getUpstreamRequestHeaders(request: Request) {
  const headers = new Headers();
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");

  if (accept) {
    headers.set("Accept", accept);
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

function getSafeResponseHeaders(response: Response) {
  const headers = new Headers({
    "Cache-Control": "no-store",
  });

  for (const name of RESPONSE_HEADERS) {
    const value = response.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
  }

  return headers;
}

export async function proxyDocsApiRequest(request: Request, path: string) {
  const method = request.method.toUpperCase();

  try {
    const response = await fetchDocsApi(path, {
      method,
      headers: getUpstreamRequestHeaders(request),
      body: BODYLESS_METHODS.has(method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    });

    return new Response(response.body, {
      status: response.status,
      headers: getSafeResponseHeaders(response),
    });
  } catch (error) {
    console.error("Documentation API proxy request failed", error);

    return NextResponse.json(
      { error: "Documentation service is unavailable." },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
