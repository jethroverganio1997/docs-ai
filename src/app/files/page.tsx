import { FileUpload } from "@/features/files/components/file-upload";
import { getDocumentsView } from "../../features/files/actions/files-actions";
import { FilesDataTable } from "../../features/files/components/file-table";
export default async function FilePage() {
  const documents = await getDocumentsView();

  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <FileUpload />
      <FilesDataTable data={documents} />
    </main>
  );
}
