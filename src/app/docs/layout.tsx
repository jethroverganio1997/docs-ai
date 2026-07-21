"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { useQuery } from "@tanstack/react-query";
import { getPageTree } from "@/features/docs/api";
import {
  DOCS_TREE_QUERY_KEY,
  DOCS_TREE_STALE_TIME_MS,
} from "@/features/docs/constants";
import { PageTree } from "fumadocs-core/server";
import { baseOptions, linkItems, logo } from "@/config/navigation";
import { AISearchTrigger } from "@/features/search/components/ai-search";
import { placeholderTree } from "@/features/docs/placeholder-tree";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: pageTree } = useQuery<PageTree.Root>({
    queryKey: DOCS_TREE_QUERY_KEY,
    queryFn: getPageTree,
    staleTime: DOCS_TREE_STALE_TIME_MS,
  });

  const base = baseOptions();

  return (
    <DocsLayout
      // Use the tree from the store, which is updated by the query
      tree={pageTree ?? placeholderTree}
      {...base}
      links={linkItems}
      nav={{
        ...base.nav,
        title: (
          <>
            {logo}
            <span className="font-medium [.uwu_&]:hidden max-md:hidden">
              Jet Docs
            </span>
          </>
        ),
      }}
    >
      {children}
      <AISearchTrigger />
    </DocsLayout>
  );
}
