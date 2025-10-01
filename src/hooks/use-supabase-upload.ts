import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type FileError,
  type FileRejection,
  useDropzone,
} from "react-dropzone";
import { createClient } from "../lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { revalidateTagAction } from "../lib/actions";
import {
  BUCKET_MEDIA_NAME,
  MEDIA_IMAGES_TAG,
} from "../app/media/_lib/constants";
import { toast } from "sonner";
import {
  BUCKET_FILE_NAME,
  FILES_DOCUMENT_TAG,
} from "../app/files/_lib/constants";
import { DOCS_SEARCH_TAG } from "../app/_search/lib/constants";
import { LAYOUT_TREE_TAG } from "../app/docs/_lib/constants";
import { getFileName } from "../lib/helpers";
// import { revalidatePathAction } from "../lib/actions";

const supabase = createClient();

export interface FileWithPreview extends File {
  preview?: string;
  errors: readonly FileError[];
}

type UseSupabaseUploadOptions = {
  bucketName: string;
  path?: string;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  cacheControl?: number;
  upsert?: boolean;
};

type UseSupabaseUploadReturn = ReturnType<typeof useSupabaseUpload>;

const useSupabaseUpload = (options: UseSupabaseUploadOptions) => {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = false,
  } = options;

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([]);
  const [successes, setSuccesses] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const isSuccess = useMemo(() => {
    if (errors.length === 0 && successes.length === 0) {
      return false;
    }
    if (errors.length === 0 && successes.length === files.length) {
      return true;
    }
    return false;
  }, [errors.length, successes.length, files.length]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles = acceptedFiles
        .filter((file) => !files.find((x) => x.name === file.name))
        .map((file) => {
          (file as FileWithPreview).preview = URL.createObjectURL(file);
          (file as FileWithPreview).errors = [];
          return file as FileWithPreview;
        });

      const invalidFiles = fileRejections.map(({ file, errors }) => {
        (file as FileWithPreview).preview = URL.createObjectURL(file);
        (file as FileWithPreview).errors = errors;
        return file as FileWithPreview;
      });

      const newFiles = [...files, ...validFiles, ...invalidFiles];

      setFiles(newFiles);
    },
    [files, setFiles],
  );

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {},
    ),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles !== 1,
  });

  const buildFilePath = (file: File, path?: string): string => {
    const filename = file.name;
    const lastDotIndex = filename.lastIndexOf(".");

    // Handles files with no extension (e.g., "README") or hidden files (e.g., ".env")
    if (lastDotIndex <= 0) {
      return path ? `${path}/${filename}` : filename;
    }

    // Separate the base name from the extension
    const baseName = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex); // e.g., ".mdx"

    // Replace all remaining dots in the base name with slashes
    const folderPath = baseName.replace(/\./g, "/");

    const finalFilePath = folderPath + extension;

    // Prepend the optional base path
    return path ? `${path}/${finalFilePath}` : finalFilePath;
  };

  const onUpload = useCallback(async () => {
    setLoading(true);

    // [Joshen] This is to support handling partial successes
    // If any files didn't upload for any reason, hitting "Upload" again will only upload the files that had errors
    const filesWithErrors = errors.map((x) => x.name);
    const filesToUpload = filesWithErrors.length > 0
      ? [
        ...files.filter((f) => filesWithErrors.includes(f.name)),
        ...files.filter((f) => !successes.includes(f.name)),
      ]
      : files;

    const responses = await Promise.all(
      filesToUpload.map(async (file) => {
        const filePath = buildFilePath(file);

        const { error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: cacheControl.toString(),
            upsert,
          });

        if (error) {
          return {
            filePath: filePath,
            name: file.name,
            message: error.message,
          };
        } else {
          return { filePath: filePath, name: file.name, message: undefined };
        }
      }),
    );

    const responseErrors = responses.filter((x) => x.message !== undefined);
    // if there were errors previously, this function tried to upload the files again so we should clear/overwrite the existing errors.
    setErrors(responseErrors);

    const responseSuccesses = responses.filter((x) => x.message === undefined);
    const newSuccesses = Array.from(
      new Set([...successes, ...responseSuccesses.map((x) => x.name)]),
    );
    setSuccesses(newSuccesses);

    // ✅ Trigger revalidation only when at least one upload succeeded
    if (responseSuccesses.length > 0) {
      toast.success("Successfully Uploaded!");

      // refresh media
      if (bucketName === BUCKET_MEDIA_NAME) {
        await revalidateTagAction(MEDIA_IMAGES_TAG);
      }

      // refresh files
      if (bucketName === BUCKET_FILE_NAME) {
        // client clear cache
        queryClient.invalidateQueries({ queryKey: [DOCS_SEARCH_TAG] });
        await queryClient.refetchQueries({ queryKey: [LAYOUT_TREE_TAG] });

        // server side clear cache
        responseSuccesses.map((response) => {
          revalidateTagAction(getFileName(response.filePath));
        });
        await revalidateTagAction(FILES_DOCUMENT_TAG);
      }

      // ✅ Reset state back to "empty"
      setFiles([]);
      setSuccesses([]);
      setErrors([]);
    }

    setLoading(false);
  }, [files, path, bucketName, errors, successes]);

  useEffect(() => {
    if (files.length === 0) {
      setErrors([]);
    }

    // If the number of files doesn't exceed the maxFiles parameter, remove the error 'Too many files' from each file
    if (files.length <= maxFiles) {
      let changed = false;
      const newFiles = files.map((file) => {
        if (file.errors.some((e) => e.code === "too-many-files")) {
          file.errors = file.errors.filter((e) => e.code !== "too-many-files");
          changed = true;
        }
        return file;
      });
      if (changed) {
        setFiles(newFiles);
      }
    }
  }, [files.length, setFiles, maxFiles]);

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize: maxFileSize,
    maxFiles: maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  };
};

export {
  useSupabaseUpload,
  type UseSupabaseUploadOptions,
  type UseSupabaseUploadReturn,
};
