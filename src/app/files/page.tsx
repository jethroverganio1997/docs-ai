"use client";

import { FileUpload } from "@/features/files/components/file-upload";
import { getDocumentsView } from "@/features/files/actions/files-actions";
import { FilesDataTable } from "@/features/files/components/file-table";
import { useQuery } from "@tanstack/react-query";
import { DocumentView } from "@/types/document-view";
import FilesLoading from "@/features/files/components/file-loading";
import FilesError from "@/features/files/components/file-error";
export default function FilePage() {
  const {
    data: documents,
    isPending,
    isLoading,
    isError,
    error,
  } = useQuery<DocumentView[], Error>({
    queryKey: ["files"],
    queryFn: getDocumentsView, // Pass the server function directly
  });

  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <FileUpload />
      {isPending || isLoading ? (
        <FilesLoading />
      ) : isError ? (
        <FilesError error={error} />
      ) : (
        <FilesDataTable data={documents} />
      )}
    </main>
  );
}
