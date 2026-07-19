import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { type LinkItemType } from "fumadocs-ui/layouts/docs";
import { BookIcon } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {logo}
          <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
            Jet Docs
          </span>
        </>
      ),
      transparentMode: "top",
    },
  };
}

export const linkItems: LinkItemType[] = [
  {
    icon: <BookIcon />,
    text: "Docs",
    url: "/docs",
    active: "nested-url",
    secondary: false,
  },
];

export const logo = (
  <div className="flex size-7 items-center justify-center rounded-md border bg-fd-secondary text-fd-secondary-foreground">
    <BookIcon className="size-4" />
  </div>
);
