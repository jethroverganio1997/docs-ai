import { NextResponse } from "next/server";
import {
  DocsTreeUpstreamError,
  getDocsTree,
} from "@/lib/docs-tree-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tree = await getDocsTree();

    return new Response(tree.body, {
      headers: {
        "Content-Type": tree.contentType,
        "Cache-Control": "private, max-age=60, stale-while-revalidate=240",
      },
    });
  } catch (error) {
    if (error instanceof DocsTreeUpstreamError) {
      return new Response(error.body, {
        status: error.status,
        headers: {
          "Content-Type": error.contentType,
          "Cache-Control": "no-store",
        },
      });
    }

    console.error("Documentation tree request failed", error);

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
