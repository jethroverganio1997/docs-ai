"use client";

import { getMedia } from "@/features/media/actions/media-actions";
import MediaEmpty from "@/features/media/components/media-empty";
import MediaCard from "@/features/media/components/media-card";
import { MediaUpload } from "@/features/media/components/media-upload";
import { MediaObject } from "@/types/media-object";
import { useQuery } from "@tanstack/react-query";
import MediaLoading from "@/features/media/components/media-loading";
import MediaError from "@/features/media/components/media-error";

export default function MediaPage() {
  const {
    data: images,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery<MediaObject[], Error>({
    queryKey: ["media"],
    queryFn: getMedia, // Pass the server function directly
  });

  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <MediaUpload />
      {isPending || isLoading ? (
        <MediaLoading />
      ) : isError ? (
        <MediaError error={error} />
      ) : images && images.length > 0 ? (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image) => (
            <MediaCard key={image.id} image={image} />
          ))}
        </div>
      ) : (
        <MediaEmpty />
      )}
    </main>
  );
}
