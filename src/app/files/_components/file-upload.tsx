"use client";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/supabase/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { BUCKET_FILE_NAME } from "../_lib/constants";

export default function FileUpload() {
  const props = useSupabaseUpload({
    bucketName: BUCKET_FILE_NAME,
    path: "",
    allowedMimeTypes: ["text/mdx"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10, // 10MB,
    upsert: true,
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
