import { NextRequest, NextResponse } from "next/server";
import { proxyDocsApiRequest } from "@/lib/docs-api-proxy";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  if (
    slug.length === 0 ||
    slug.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return NextResponse.json({ error: "A document slug is required." }, { status: 400 });
  }

  const encodedSlug = slug.map(encodeURIComponent).join("/");

  return proxyDocsApiRequest(request, `docs/${encodedSlug}`);
}
