// src/app/docs/page.tsx
import { redirect } from "next/navigation";
import { getPageTree } from "@/lib/remote-source";
import EmptyDocsPage from "@/features/docs/components/empty-docs-state";

export default async function DocsPage() {
  const pageTree = await getPageTree();

  if (!pageTree || pageTree.children.length === 0) {
    return <EmptyDocsPage />;
  }

  const firstChild = pageTree.children[0];
  redirect(`/docs/${firstChild.name}`);
}