import React from "react";
import { FileUpload } from "../../components/supabase/file-upload";

export default function FilePage() {
  return (
    <main className="container flex flex-col max-w-4xl min-h-screen w-full items-center justify-start">
      <FileUpload />
    </main>
  );
}
