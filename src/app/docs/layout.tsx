"use client";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { useQuery } from "@tanstack/react-query";
import { getPageTree } from "@/app/docs/_lib/actions";
import { LAYOUT_TREE_TAG } from "./_lib/constants";
import { PageTree } from "fumadocs-core/server";
import { baseOptions, linkItems, logo } from "@/app/layout.config";
import { AISearchTrigger } from "../_search/components/ai-search";
import { placeholderTree } from "./layout.config";

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
      links={linkItems.filter((item) => item.type === "icon")}
      nav={{
        ...base.nav,
        title: (
          <>
            {logo}
            <span className="font-medium [.uwu_&]:hidden max-md:hidden">
              FEE Remit
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
