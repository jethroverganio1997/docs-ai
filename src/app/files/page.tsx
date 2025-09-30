import FilesLoading from "@/app/files/loading";
import FileUpload from "./_components/file-upload";
import { Suspense } from "react";
import FileDocuments from "./_components/file-documents";
export default function FilePage() {
  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <FileUpload />
      <Suspense fallback={<FilesLoading />}>
        <FileDocuments />
      </Suspense>
    </main>
  );
}
