import { FileUpload } from "../../components/supabase/file-upload";
import { createClient } from "../../lib/supabase/server"; // <-- server client
import FileCard from "./file-card";

export default async function FilePage() {
  const supabase = await createClient();
  const { data: documents, error } = await supabase
    .from("documents_with_storage_path")
    .select();

  if (error) {
    return (
      <main className="container max-w-4xl w-full p-4">
        <p className="text-destructive">Failed to fetch files: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="container flex flex-col max-w-4xl w-full items-center justify-start">
      <FileUpload />

      {documents && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {documents.map((document) => (
            <FileCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </main>
  );
}
