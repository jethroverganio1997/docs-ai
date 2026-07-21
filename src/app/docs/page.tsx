"use client";

import { useRouter } from "next/navigation";
import { getPageTree } from "@/features/docs/api";
import DocsEmpty from "@/app/docs/[...slug]/empty";
import { useQuery } from "@tanstack/react-query";
import {
  DOCS_TREE_QUERY_KEY,
  DOCS_TREE_STALE_TIME_MS,
} from "@/features/docs/constants";
import type { PageTree } from "fumadocs-core/server";
import { useEffect } from "react";
import DocsLoadingPage from "./[...slug]/loading";

function findFirstPageUrl(nodes: PageTree.Node[]): string | null {
  for (const node of nodes) {
    if (node.type === "page") return node.url;
    if (node.type === "folder" && node.children) {
      const url = findFirstPageUrl(node.children);
      if (url) return url;
    }
  }
  return null;
}
export default function DocsPage() {
  const router = useRouter();

  const {
    data: pageTree,
    isLoading,
    isFetching,
  } = useQuery<PageTree.Root>({
    queryKey: DOCS_TREE_QUERY_KEY,
    queryFn: getPageTree,
    staleTime: DOCS_TREE_STALE_TIME_MS,
  });

  useEffect(() => {
    if (pageTree && !isFetching && pageTree.children.length > 0) {
      const firstPage = findFirstPageUrl(pageTree.children);
      if (firstPage) {
        router.replace(firstPage);
      }
    }
  }, [pageTree, isFetching, router]);

  if (isLoading || isFetching) {
    return <DocsLoadingPage />;
  }

  if (!pageTree || pageTree.children.length === 0) {
    return <DocsEmpty />;
  }

  return <DocsLoadingPage />;
}
