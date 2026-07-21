import { NextRequest } from "next/server";
import { proxyDocsApiRequest } from "@/lib/docs-api-proxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return proxyDocsApiRequest(request, "docs/chat");
}
