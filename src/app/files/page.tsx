import { FileUpload } from "@/components/files/file-upload";
import { getDocumentsView } from "../../actions/files-actions";
import { FilesDataTable } from "../../components/files/file-table";

export default async function FilePage() {
  const documents = await getDocumentsView();

  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <FileUpload />
      <FilesDataTable data={documents} />
    </main>
  );
}
