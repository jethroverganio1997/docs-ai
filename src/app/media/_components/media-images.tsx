import { getMedia } from "../_lib/actions";
import { unstable_cache as cacheTag } from "next/cache";
import MediaEmpty from "../empty";
import { ImageCard } from "./media-card";
import { cookies } from "next/headers";
import { MEDIA_IMAGES_KEY, MEDIA_IMAGES_TAG } from "../_lib/constants";

export default async function MediaImages() {
  const cookieStore = cookies();

  const getImages = cacheTag(
    async () => {
      return await getMedia(cookieStore);
    },
    [MEDIA_IMAGES_KEY],
    {
      tags: [MEDIA_IMAGES_TAG],
    }
  );

  const images = await getImages();

  return (
    <>
      {images && images.length > 0 ? (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <ImageCard
              key={index}
              url={image.url}
              name={image.name}
              alt={"image" + index}
            />
          ))}
        </div>
      ) : (
        <MediaEmpty />
      )}
    </>
  );
}
