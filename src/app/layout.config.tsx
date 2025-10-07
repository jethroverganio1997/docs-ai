import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { type LinkItemType } from "fumadocs-ui/layouts/docs";
import { BookIcon, File, Image } from "lucide-react";
import { CurrentUserAvatar } from "./auth/_components/current-user-avatar";
import { LogoutButton } from "./auth/_components/logout-button";

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
  {
    icon: <File />,
    text: "Files",
    url: "/files",
    active: "nested-url",
    secondary: false,
  },
  {
    // eslint-disable-next-line jsx-a11y/alt-text
    icon: <Image />,
    text: "Media",
    url: "/media",
    active: "nested-url",
    secondary: false,
  },
  {
    type: "custom",
    children: <LogoutButton />,
    secondary: true,
  },
];

export const logo = (
  <>
    <CurrentUserAvatar />
  </>
);
