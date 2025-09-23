import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions, linkItems } from "@/components/fuma/layout-shared";
import type { ReactNode } from "react";
export default function FilesLayout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions()} links={[...linkItems]}>
      {children}
    </HomeLayout>
  );
}
