import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions, linkItems } from "@/app/layout.config";

export default function Layout({ children }: LayoutProps<"/">) {
  const base = baseOptions();
  return (
    <HomeLayout {...base} links={[...linkItems]} nav={{ ...base.nav }}>
      {children}
    </HomeLayout>
  );
}
