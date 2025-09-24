import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { type LinkItemType } from "fumadocs-ui/layouts/docs";
import { BookIcon, File } from "lucide-react";
import { CurrentUserAvatar } from "../components/supabase/current-user-avatar";
import { LogoutButton } from "../components/auth/logout-button";

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
