import { EmptyState } from "@/components/empty-state";

export default function MediaEmpty() {
  return (
    <EmptyState
      icon="image"
      title="No images yet"
      description="Get started by uploading your first image. It only takes a few seconds to set up."
    />
  );
}
