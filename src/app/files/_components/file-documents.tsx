
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { FILES_DOCUMENT_KEY, FILES_DOCUMENT_TAG } from "../_lib/constants";
import { getFilesDocument } from "../_lib/actions";
import { FilesDataTable } from "./file-table";


export default async function FileDocuments() {
  const cookieStore = cookies();

  const getDocuments = unstable_cache(
    async () => {
      return await getFilesDocument(cookieStore);
    },
    [FILES_DOCUMENT_KEY],
    {
      tags: [FILES_DOCUMENT_TAG],
    }
  );

  const documents = await getDocuments();

  return  <FilesDataTable data={documents} />;
}
