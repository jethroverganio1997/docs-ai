"use client";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/supabase/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";

const MediaUpload = () => {
  const props = useSupabaseUpload({
    bucketName: "media",
    path: "",
    allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
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
};

export { MediaUpload };
