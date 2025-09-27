"use client";
import { EmptyState } from "@/components/empty-state";
import { Inbox } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmptyDocsPage() {
  const router = useRouter();

  return (
    <EmptyState
      icon={<Inbox className="h-6 w-6" />}
      title="No documents uploaded"
      description="You havent added any documents yet. Upload files to start building your collection."
      action={{
        label: "Upload document",
        onClick: () => router.push("/files"),
      }}
    />
  );
}
