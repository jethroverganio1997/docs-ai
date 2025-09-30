"use client";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/supabase/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { BUCKET_MEDIA_NAME } from "../_lib/constants";

export default function MediaUpload() {
  const props = useSupabaseUpload({
    bucketName: BUCKET_MEDIA_NAME,
    path: "",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxFiles: 5,
    maxFileSize: 1000 * 1000 * 10, // 10MB,
  });

  return (
    <div className="w-full py-4">
      <Dropzone {...props}>
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>
    </div>
  );
}
