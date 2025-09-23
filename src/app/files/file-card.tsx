"use client";

import React, { useState } from "react";
import { File } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import { deleteFile, downloadFile } from "./actions"; // <- must be Server Action

type Document = {
  id: number;
  name: string;
  storage_object_path: string | null;
};

export default function FileCard({ document }: { document: Document }) {
  const [loading, setLoading] = useState<"download" | "delete" | null>(null);

  const handleDownload = async () => {
    setLoading("download");
    try {
      // Call server action
      const url = await downloadFile(document.storage_object_path);
      if (url) window.location.href = url;
    } catch {
      alert("Failed to download file");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading("delete");
    try {
      await deleteFile(document.storage_object_path);
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
        <div className="flex flex-col gap-2 justify-center items-center border rounded-md p-2 sm:p-6 text-center cursor-pointer bg-primary-foreground hover:bg-secondary relative">
          <File size={24} />
          <div className="w-full px-2 text-sm overflow-hidden text-ellipsis">
            {document.name.split(".")[0]}
          </div>
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm">
              {loading === "download" ? "Downloading..." : "Deleting..."}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDownload} disabled={!!loading}>
          Download
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} disabled={!!loading}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
