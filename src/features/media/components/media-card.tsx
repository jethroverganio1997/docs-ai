"use client";

import React from "react";
import { Image, Loader2, PackageOpen, Trash } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../../components/ui/context-menu";
import { getFileName } from "../../../lib/utils";
import { deleteMedia, getPublicUrl } from "../actions/media-actions"; // Your server actions
import { MediaObject } from "../../../types/media-object";
import { useMutation, useQueryClient } from "@tanstack/react-query"; // 1. Import hooks

export default function MediaCard({ image }: { image: MediaObject }) {
  // 2. Get the query client to invalidate the cache on success
  const queryClient = useQueryClient();

  // 3. Create a mutation for the delete action
  const { mutate: performDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteMedia(image.name),
    onSuccess: () => {
      // ✅ This is the key part for refreshing your list!
      // Replace ['media'] with the actual queryKey you use to fetch the media list.
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
    onError: (error) => {
      alert(`Failed to delete file: ${error.message}`);
    },
  });

  // 4. (Optional but recommended) Create mutations for other async actions
  const { mutate: performOpen, isPending: isOpening } = useMutation({
    mutationFn: async () => {
      // It still fetches the public URL like before
      const data = await getPublicUrl(image.name);
      return data.publicUrl; // Return the URL
    },
    onSuccess: (publicUrl) => {
      // 3. Instead of window.open, call the prop function
      window.open(publicUrl, "_blank");
    },
    onError: (error) => {
      alert(`Failed to get image URL: ${error.message}`);
    },
  });

  const { mutate: performCopy, isPending: isCopying } = useMutation({
    mutationFn: async () => {
      const data = await getPublicUrl(image.name);
      await navigator.clipboard.writeText(data.publicUrl);
      // It's good practice to notify the user of success
      alert("URL copied to clipboard!");
    },
    onError: (error) => {
      alert(`Failed to copy URL: ${error.message}`);
    },
  });

  // Combine all pending states for easier management
  const isAnyLoading = isDeleting || isOpening || isCopying;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className="flex flex-col gap-2 justify-center items-center border rounded-md p-2 sm:p-6 text-center cursor-pointer bg-primary-foreground hover:bg-secondary relative"
          onClick={() => performOpen()}
        >
          <Image aria-label={image.name} size={24} />
          <div className="w-full px-2 text-sm overflow-hidden text-ellipsis">
            {getFileName(image.name)}
          </div>
          {isAnyLoading && (
            <div className="absolute inset-0 bg-muted/80 flex flex-col items-center justify-center text-sm backdrop-blur-sm">
              {isOpening && <PackageOpen />}
              {isDeleting && <Trash />}
              <Loader2 className="h-4 w-4 animate-spin mt-2" />
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => performOpen()} disabled={isAnyLoading}>
          View Image
        </ContextMenuItem>
        <ContextMenuItem onClick={() => performCopy()} disabled={isAnyLoading}>
          Copy Url
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => performDelete()}
          disabled={isAnyLoading}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
