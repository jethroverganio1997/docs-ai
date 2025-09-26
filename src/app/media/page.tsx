import { getMedia } from "../../actions/media-actions";
import MediaCard from "../../components/media/media-card";
import { MediaUpload } from "../../components/media/media-upload";

export default async function MediaPage() {
  const images = await getMedia();

  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <MediaUpload />
      {images && (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <MediaCard key={image.id} image={image} />
          ))}
        </div>
      )}
    </main>
  );
}
