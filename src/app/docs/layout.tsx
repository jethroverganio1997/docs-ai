import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { LargeSearchToggle } from "fumadocs-ui/components/layout/search-toggle";
import { baseOptions, linkItems, logo } from "@/app/layout.config";
import { AISearchTrigger } from "../../components/fuma/ai-search-trigger";
import { cn } from "fumadocs-ui/utils/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { Sparkles } from "lucide-react";
import { cache } from "react";
import { getPageTree } from "../../lib/remote-source";
import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

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
      searchToggle={{
        components: {
          lg: (
            <div className="flex gap-1.5 max-md:hidden">
              <LargeSearchToggle className="flex-1" />
              <AISearchTrigger
                session={session}
                aria-label="Ask AI"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "icon",
                    className: "text-fd-muted-foreground",
                  })
                )}
              >
                <Sparkles className="size-4" />
              </AISearchTrigger>
            </div>
          ),
        },
      }}
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
        children: (
          <AISearchTrigger
            session={session}
            className={cn(
              buttonVariants({
                variant: "secondary",
                size: "sm",
                className:
                  "absolute left-1/2 top-1/2 -translate-1/2 text-fd-muted-foreground rounded-full gap-2 md:hidden",
              })
            )}
          >
            <Sparkles className="size-4.5 fill-current" />
            Ask AI
          </AISearchTrigger>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
