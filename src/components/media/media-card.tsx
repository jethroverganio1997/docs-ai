"use client";

import React, { useState } from "react";
import { Image, Loader2, PackageOpen, Trash } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { getFileName } from "../../lib/utils";
import { deleteMedia, getPublicUrl } from "../../actions/media-actions";
import { MediaObject } from "../../types/media-object";

export default function MediaCard({ image }: { image: MediaObject }) {
  const [loading, setLoading] = useState<"opening" | "delete" | null>(null);

  const handleOpenImage = async () => {
    setLoading("opening");
    try {
      // Call server action
      const data = await getPublicUrl(image.name);
      window.open(data.publicUrl, "_blank");
    } catch {
      alert("Failed to open");
    } finally {
      setLoading(null);
    }
  };

  const handleCopyUrl = async () => {
    try {
      // Call server action
      const data = await getPublicUrl(image.name);
      navigator.clipboard.writeText(data.publicUrl);
    } catch {
      alert("Failed to copy url");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading("delete");
    try {
      await deleteMedia(image.name);
      // no reload needed; SSR page will update after revalidation
    } catch {
      alert("Failed to delete file");
    } finally {
      setLoading(null);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className="flex flex-col gap-2 justify-center items-center border rounded-md p-2 sm:p-6 text-center cursor-pointer bg-primary-foreground hover:bg-secondary relative"
          onDoubleClick={handleOpenImage} // <-- ADD THIS
        >
          <Image aria-label={image.name} size={24} />
          <div className="w-full px-2 text-sm overflow-hidden text-ellipsis">
            {getFileName(image.name)}
          </div>
          {loading && (
            <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center text-sm">
              {loading === "opening" ? <PackageOpen /> : <Trash />}
              <Loader2 className="h-4 w-4 animate-spin mt-2" />
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleOpenImage} disabled={!!loading}>
          View Image
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyUrl} disabled={!!loading}>
          Copy Url
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} disabled={!!loading}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
