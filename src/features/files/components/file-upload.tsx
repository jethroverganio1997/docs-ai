"use client";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/supabase/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { useQueryClient } from "@tanstack/react-query";

const FileUpload = () => {
  const queryClient = useQueryClient();

  const props = useSupabaseUpload({
    bucketName: "files",
    path: "",
    allowedMimeTypes: ["text/mdx"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10, // 10MB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
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
