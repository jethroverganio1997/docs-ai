"use client";

import { useRouter } from "next/navigation";
import { getPageTree } from "@/app/docs/_lib/actions";
import DocsEmpty from "@/app/docs/[...slug]/empty";
import { useQuery } from "@tanstack/react-query";
import { PAGE_TREE_TAG } from "./_lib/constants";
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
    isFetching, // <-- Add this
  } = useQuery<PageTree.Root>({
    queryKey: [PAGE_TREE_TAG],
    queryFn: getPageTree,
    // Set staleTime to 24 hours in milliseconds
    staleTime: 86_400_000,
  });

  useEffect(() => {
    // Only run the effect if data is available and not being refetched
    if (pageTree && !isFetching && pageTree.children.length > 0) {
      const firstPage = findFirstPageUrl(pageTree.children);
      if (firstPage) {
        router.replace(firstPage);
      }
    }
  }, [pageTree, isFetching, router]); // <-- Add isFetching to dependency array

  // Show loading state for the initial load OR a background refetch
  if (isLoading || isFetching) {
    return <DocsLoadingPage />;
  }

  // Show an empty state if there's no content
  if (!pageTree || pageTree.children.length === 0) {
    return <DocsEmpty />;
  }

  // Fallback loading state
  return <DocsLoadingPage />;
}
