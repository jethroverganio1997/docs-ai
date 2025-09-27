"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DocumentView } from "../types/document-view";

const BUCKET_NAME = "files";

export async function revalidateFromClient(path: string) {
  revalidatePath(path);
}

export async function getDocumentsView(): Promise<DocumentView[]> {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("documents_with_storage_path")
    .select();

  if (error) {
    throw new Error("Files not found", error);
  }

  return documents as DocumentView[];
}

export async function downloadFile(path: string | null) {
  if (!path) throw new Error("Invalid file path");
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(path: string | null) {
  if (!path) throw new Error("Invalid file path");
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw error;

  revalidatePath("/files");
  revalidatePath("/docs");
  return true;
}
