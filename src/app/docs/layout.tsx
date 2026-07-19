"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { useQuery } from "@tanstack/react-query";
import { getPageTree } from "@/features/docs/actions";
import { LAYOUT_TREE_TAG } from "@/features/docs/constants";
import { PageTree } from "fumadocs-core/server";
import { baseOptions, linkItems, logo } from "@/config/navigation";
import { AISearchTrigger } from "@/features/search/components/ai-search";
import { placeholderTree } from "@/features/docs/placeholder-tree";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: pageTree } = useQuery<PageTree.Root>({
    queryKey: [LAYOUT_TREE_TAG],
    queryFn: getPageTree,
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
