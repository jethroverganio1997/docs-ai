import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { type LinkItemType } from "fumadocs-ui/layouts/docs";
import { BookIcon, File } from "lucide-react";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {logo}
          <span className="font-medium [.uwu_&]:hidden [header_&]:text-[15px]">
            FEE Remit
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
    // secondary items will be displayed differently on navbar
    secondary: false,
  },
  {
    icon: <File />,
    text: "Files",
    url: "/files",
    active: "nested-url",
    // secondary items will be displayed differently on navbar
    secondary: false,
  },
];

export const logo = (
  <>
    {/* <Image
      alt="Fumadocs"
      src={Logo}
      sizes="100px"
      className="hidden w-20 md:w-24 [.uwu_&]:block"
      aria-label="Fumadocs"
    /> */}
    <svg
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo"
    >
      <circle cx={12} cy={12} r={12} fill="currentColor" />
    </svg>
    {/* <FumadocsIcon className="size-5 [.uwu_&]:hidden" fill="currentColor" /> */}
  </>
);
