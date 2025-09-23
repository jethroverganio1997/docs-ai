"use client";

import { cn } from "@/lib/utils";
import { type UseSupabaseUploadReturn } from "@/hooks/use-supabase-upload";
import { Button } from "@/components/ui/button";
import { CheckCircle, File, Loader2, Upload, X } from "lucide-react";
import React, {
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
} from "react";

// Helper function to format bytes into a human-readable string
export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: "bytes" | "KB" | "MB" | "GB" | "TB" | "PB" | "EB" | "ZB" | "YB"
) => {
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  if (bytes === 0 || bytes === undefined)
    return size !== undefined ? `0 ${size}` : "0 bytes";
  const i =
    size !== undefined
      ? sizes.indexOf(size)
      : Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// FIX: Define the context type to include an optional `reset` function.
// The Dropzone now officially supports a reset mechanism.
type DropzoneContextType = Omit<
  UseSupabaseUploadReturn,
  "getRootProps" | "getInputProps"
> & {
  reset?: () => void;
};

const DropzoneContext = React.createContext<DropzoneContextType | undefined>(
  undefined
);

// The props for the main component now accept everything from your hook,
// which should include the new `reset` function.
type DropzoneProps = UseSupabaseUploadReturn & {
  className?: string;
  reset?: () => void;
};

const Dropzone = ({
  className,
  children,
  getRootProps,
  getInputProps,
  ...restProps
}: PropsWithChildren<DropzoneProps>) => {
  const isSuccess = restProps.isSuccess;
  const isActive = restProps.isDragActive;

  const isInvalid =
    (restProps.errors.length > 0 && !restProps.isSuccess) ||
    restProps.files.some((file) => file.errors.length !== 0);

  // `restProps` will correctly pass down the `reset` function to the context provider.
  return (
    <DropzoneContext.Provider value={{ ...restProps }}>
      <div
        {...getRootProps({
          className: cn(
            "border-2 rounded-lg p-6 text-center bg-card transition-colors duration-300 text-foreground cursor-pointer",
            className,
            isSuccess
              ? "border-solid border-primary"
              : "border-dashed border-gray-300",
            isActive && !isInvalid && "border-primary bg-primary/10",
            isInvalid && "border-destructive bg-destructive/10"
          ),
        })}
        onClick={restProps.open}
      >
        <input {...getInputProps()} />
        {children}
      </div>
    </DropzoneContext.Provider>
  );
};

const DropzoneContent = ({ className }: { className?: string }) => {
  const {
    files,
    setFiles,
    onUpload,
    loading,
    successes,
    errors,
    maxFileSize,
    maxFiles,
    isSuccess,
    // FIX: Safely retrieve `reset` from the context. It may be undefined.
    reset,
  } = useDropzoneContext();

  const exceedMaxFiles = files.length > maxFiles;

  const handleRemoveFile = useCallback(
    (e: React.MouseEvent, fileName: string) => {
      e.stopPropagation();
      setFiles(files.filter((file) => file.name !== fileName));
    },
    [files, setFiles]
  );

  useEffect(() => {
    return () =>
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
  }, [files]);

  if (isSuccess) {
    const handleUploadMore = (e: React.MouseEvent) => {
      e.stopPropagation();
      // FIX: Check if the reset function exists. If not, provide a helpful warning
      // for the developer in the console.
      if (reset) {
        reset();
      } else {
        console.warn(
          'Dropzone: "Upload More Files" was clicked, but no `reset` function was provided. Please pass a `reset` function from your upload hook to the <Dropzone> component to enable this feature.'
        );
      }
    };

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-y-2",
          className
        )}
      >
        <div className="flex items-center gap-x-2">
          <CheckCircle size={16} className="text-primary" />
          <p className="text-primary text-sm">
            Successfully uploaded {files.length} file
            {files.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={handleUploadMore}
        >
          Upload More Files
        </Button>
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {files.map((file, idx) => {
        const fileError = errors.find((e) => e.name === file.name);
        const isSuccessfullyUploaded = !!successes.find((e) => e === file.name);

        return (
          <div
            key={`${file.name}-${idx}`}
            className="flex items-center gap-x-4 border-b py-2 first:mt-4 last:mb-4 "
          >
            {file.type.startsWith("image/") && file.preview ? (
              <div className="h-10 w-10 rounded border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                <img
                  src={file.preview}
                  alt={file.name}
                  className="object-cover h-full w-full"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                <File size={18} />
              </div>
            )}

            <div className="shrink grow flex flex-col items-start truncate">
              <p title={file.name} className="text-sm truncate max-w-full">
                {file.name}
              </p>
              {file.errors.length > 0 ? (
                <p className="text-xs text-destructive">
                  {file.errors
                    .map((e) =>
                      e.message.startsWith("File is larger than")
                        ? `File is larger than ${formatBytes(
                            maxFileSize,
                            2
                          )} (Size: ${formatBytes(file.size, 2)})`
                        : e.message
                    )
                    .join(", ")}
                </p>
              ) : loading && !isSuccessfullyUploaded ? (
                <p className="text-xs text-muted-foreground">
                  Uploading file...
                </p>
              ) : !!fileError ? (
                <p className="text-xs text-destructive">
                  Failed to upload: {fileError.message}
                </p>
              ) : isSuccessfullyUploaded ? (
                <p className="text-xs text-primary">
                  Successfully uploaded file
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size, 2)}
                </p>
              )}
            </div>

            {!loading && !isSuccessfullyUploaded && (
              <Button
                size="icon"
                variant="link"
                className="shrink-0 justify-self-end text-muted-foreground hover:text-foreground"
                onClick={(e) => handleRemoveFile(e, file.name)}
              >
                <X />
              </Button>
            )}
          </div>
        );
      })}
      {exceedMaxFiles && (
        <p className="text-sm text-left mt-2 text-destructive">
          You may upload only up to {maxFiles} files, please remove{" "}
          {files.length - maxFiles} file
          {files.length - maxFiles > 1 ? "s" : ""}.
        </p>
      )}
      {files.length > 0 && !exceedMaxFiles && (
        <div className="mt-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onUpload();
            }}
            disabled={files.some((file) => file.errors.length !== 0) || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>Upload files</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

const DropzoneEmptyState = ({ className }: { className?: string }) => {
  const { maxFiles, maxFileSize, isSuccess, files, open } =
    useDropzoneContext();

  if (isSuccess) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center gap-y-2", className)}>
      <Upload size={20} className="text-muted-foreground" />
      <p className="text-sm">
        Upload{!!maxFiles && maxFiles > 1 ? ` ${maxFiles}` : ""} file
        {!maxFiles || maxFiles > 1 ? "s" : ""}
      </p>
      <div className="flex flex-col items-center gap-y-1">
        <p className="text-xs text-muted-foreground">
          Drag and drop or{" "}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="underline cursor-pointer transition hover:text-foreground bg-transparent border-none p-0 font-medium"
          >
            select {maxFiles === 1 ? `file` : "files"}
          </button>{" "}
          to upload
        </p>
        {maxFileSize !== Number.POSITIVE_INFINITY && (
          <p className="text-xs text-muted-foreground">
            Maximum file size: {formatBytes(maxFileSize, 2)}
          </p>
        )}
      </div>
    </div>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export { Dropzone, DropzoneContent, DropzoneEmptyState, useDropzoneContext };
