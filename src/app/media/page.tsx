import MediaLoading from "@/app/media/loading";
import { Suspense } from "react";
import MediaImages from "./_components/media-images";
import MediaUpload from "./_components/media-upload";

export default function MediaPage() {
  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start pb-4">
      <MediaUpload />
      <Suspense fallback={<MediaLoading />}>
        <MediaImages />
      </Suspense>
    </main>
  );
}
