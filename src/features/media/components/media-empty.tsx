"use client";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";

export default function MediaEmpty() {
  return (
    <EmptyState
      className="min-h-[400px]"
      icon={<Inbox className="h-6 w-6" />}
      title="No images uploaded"
      description="You havent added any images yet. Upload images to start building your collection."
    />
  );
}
