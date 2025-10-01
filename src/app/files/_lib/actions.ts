"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_FILE_NAME, FILES_DOCUMENT_TAG } from "./constants";
import { FilesDocuments } from "./types";
import { cookies } from "next/headers";
import { getFileName } from "../../../lib/helpers";

export async function getFilesDocument(
  cookieStore: ReturnType<typeof cookies>,
): Promise<FilesDocuments[]> {
  const supabase = await createClient(cookieStore);

  const { data: documents, error } = await supabase
    .from("documents_with_storage_path")
    .select();

  if (error) {
    throw new Error("Files not found", error);
  }

  return documents as FilesDocuments[];
}

export async function downloadFile(path: string): Promise<string> {
  if (!path) throw new Error("Invalid file path");
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_FILE_NAME)
    .createSignedUrl(path, 60);

  if (error) throw new Error("Download failed", error);
  return data.signedUrl;
}

export async function deleteFile(path: string | null): Promise<boolean> {
  if (!path) throw new Error("Invalid file path");
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET_FILE_NAME).remove([
    path,
  ]);
  if (error) throw error;

  revalidateTag(FILES_DOCUMENT_TAG);
  revalidateTag(getFileName(path));
  console.log("delete" + getFileName(path));
  return true;
}
