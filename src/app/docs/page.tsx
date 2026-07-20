"use client";

import { useRouter } from "next/navigation";
import { getPageTree } from "@/features/docs/api";
import DocsEmpty from "@/app/docs/[...slug]/empty";
import { useQuery } from "@tanstack/react-query";
import { PAGE_TREE_TAG } from "@/features/docs/constants";
import { PageTree } from "fumadocs-core/server";
import { useEffect } from "react";
import DocsLoadingPage from "./[...slug]/loading";

// Helper function remains the same
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
    queryKey: [PAGE_TREE_TAG],
    queryFn: getPageTree,
    staleTime: 86_400_000,
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
