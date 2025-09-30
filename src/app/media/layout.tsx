import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions, linkItems } from "@/app/layout.config";
import type { ReactNode } from "react";
export default function MediaLayout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions()} links={[...linkItems]}>
      {children}
    </HomeLayout>
  );
}
