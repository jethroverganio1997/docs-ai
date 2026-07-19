import { PageTree } from "fumadocs-core/server";
import { Skeleton } from "@/components/ui/skeleton";

export const placeholderTree: PageTree.Root = {
  $id: "loading",
  name: "Loading...",
  children: [
    {
      type: "page",
      name: <Skeleton className="h-5 w-32" />,
      url: "#1",
      $id: "loading-page-1",
    },
    {
      type: "folder",
      name: <Skeleton className="h-5 w-40" />,
      $id: "loading-folder-1",
      defaultOpen: true,
      children: [
        {
          type: "page",
          name: <Skeleton className="h-5 w-32" />,
          url: "#2",
          $id: "loading-page-2",
        },
        {
          type: "page",
          name: <Skeleton className="h-5 w-28" />,
          url: "#3",
          $id: "loading-page-3",
        },
      ],
    },
    {
      type: "folder",
      name: <Skeleton className="h-5 w-24" />,
      $id: "loading-folder-2",
      defaultOpen: true,
      children: [
        {
          type: "folder",
          name: <Skeleton className="h-5 w-32" />,
          $id: "loading-folder-3",
          defaultOpen: true,
          children: [
            {
              type: "page",
              name: <Skeleton className="h-5 w-36" />,
              url: "#5",
              $id: "loading-page-4",
            },
          ],
        },
      ],
    },
  ],
};
