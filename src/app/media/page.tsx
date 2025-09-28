import { getMedia } from "@/features/media/actions/media-actions";
import EmptyMediaPage from "@/features/media/components/empty-media-state";
import MediaCard from "@/features/media/components/media-card";
import { MediaUpload } from "@/features/media/components/media-upload";

export default async function MediaPage() {
  const images = await getMedia();

  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <MediaUpload />
      {images && images.length > 0 ? (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <MediaCard key={image.id} image={image} />
          ))}
        </div>
      ) : (
        <EmptyMediaPage />
      )}
    </main>
  );
}
