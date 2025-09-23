import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { LargeSearchToggle } from "fumadocs-ui/components/layout/search-toggle";
// import { AISearchTrigger } from '@/components/ai';
import { baseOptions, linkItems, logo } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import { AISearchTrigger } from "../../components/fuma";
import { cn } from "fumadocs-ui/utils/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Layout({ children }: LayoutProps<"/docs">) {
  const base = baseOptions();
  return (
    <DocsLayout
      tree={source.pageTree}
      {...base}
      links={linkItems.filter((item) => item.type === "icon")}
      searchToggle={{
        components: {
          lg: (
            <div className="flex gap-1.5 max-md:hidden">
              <LargeSearchToggle className="flex-1" />
              <AISearchTrigger
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
