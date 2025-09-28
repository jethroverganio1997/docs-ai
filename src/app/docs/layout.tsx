import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions, linkItems, logo } from "@/app/layout.config";
import { cache } from "react";
import { getPageTree } from "../../lib/remote-source";
import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";
import { AISearchTrigger } from "../../features/search/components/ai-search";

const getCachedPageTree = cache(async () => {
  return await getPageTree();
});

export default async function Layout({ children }: LayoutProps<"/docs">) {
  const pageTree = await getCachedPageTree();
  const supabase = await createClient();
  // 1. Securely validate the user's session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }
  // 2. Get the session details only if the user is validated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const base = baseOptions();

  return (
    <DocsLayout
      tree={pageTree}
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
    
      <AISearchTrigger session={session} />
    </DocsLayout>
  );
}
