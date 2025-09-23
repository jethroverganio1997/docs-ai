"use client";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/supabase/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";

const FileUpload = () => {
  const props = useSupabaseUpload({
    bucketName: "files",
    path: "mdx",
    allowedMimeTypes: ["text/mdx"],
    maxFiles: 1,
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

export { FileUpload };
