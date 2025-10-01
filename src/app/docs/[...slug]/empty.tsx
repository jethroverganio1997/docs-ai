import { EmptyState } from "@/components/empty-state";

export default function DocsEmpty() {
  return (
    <EmptyState
      icon="inbox"
      title="No documents uploaded"
      description="You havent added any documents yet. Upload files to start building your collection."
    />
  );
}
