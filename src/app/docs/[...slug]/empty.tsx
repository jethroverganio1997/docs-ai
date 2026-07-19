import { EmptyState } from "@/components/empty-state";

export default function DocsEmpty() {
  return (
    <EmptyState
      icon="inbox"
      title="No public documents available"
      description="No documents were found in the AWS-backed docs collection yet."
    />
  );
}
