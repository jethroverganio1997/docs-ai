import { NextRequest } from "next/server";
import { proxyDocsApiRequest } from "@/lib/docs-api-proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return proxyDocsApiRequest(
    request,
    `docs/search${request.nextUrl.search}`,
  );
}
