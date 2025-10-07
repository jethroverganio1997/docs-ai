/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { processMarkdown } from "../_lib/markdown-parser.ts";
import matter from "https://esm.sh/gray-matter@4.0.3";
import { structuredMarkdown } from "../_lib/markdown-structured-data.ts";
// [3]
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

// Utility: JSON response helper
function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

type SectionType = "heading" | "text";

interface DocumentSection {
  document_id: number; // BIGINT maps to number in TypeScript
  type: SectionType; // enum-like constraint
  content: string; // TEXT → string
  anchor_id: string; // slug/id for URL fragments
}

Deno.serve(async (req) => {
  try {
    // check auth and validations
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const { document_id } = await req.json().catch(() => ({}));
    if (!document_id) {
      return jsonResponse({ error: "document_id is required" }, 400);
    }

    // create client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization } },
      auth: { persistSession: false },
    });

    // select the document
    const { data: document, error: docError } = await supabase
      .from("documents_with_storage_path")
      .select()
      .eq("id", document_id)
      .single();

    if (docError || !document?.storage_object_path) {
      return jsonResponse({ error: "Document not found" }, 404);
    }

    // get the file
    const { data: file, error: downloadError } = await supabase.storage
      .from("files")
      .download(document.storage_object_path);

    if (downloadError || !file) {
      return jsonResponse({ error: "Failed to download storage object" }, 500);
    }

    // read as text
    const fileContents = await file.text();
    if (!fileContents.trim()) {
      return jsonResponse({ error: "File is empty or unreadable" }, 400);
    }

    // process sections
    const { data, content } = matter(fileContents);

    const { error } = await supabase
      .from("documents")
      .update({
        title: data.title,
        description: data.description,
        url: "docs/" + document.storage_object_path.split(".")[0],
      })
      .eq("id", document_id);

    if (error) {
      console.error(error);
      return jsonResponse({
        error: "Failed to update documents title and description",
      }, 500);
    }

    const structuredData = structuredMarkdown(content);

    // 2. Prepare all the document sections
    const sectionsToInsert = [] as DocumentSection[];

    // Add headings
    structuredData.headings.forEach((heading) => {
      sectionsToInsert.push({
        document_id: document_id,
        type: "heading",
        content: heading.content,
        anchor_id: heading.id,
      });
    });

    // Add contents
    structuredData.contents.forEach((content) => {
      sectionsToInsert.push({
        document_id: document_id,
        type: "text",
        content: content.content,
        anchor_id: content.heading ?? "", // The heading this content belongs to
      });
    });

    // 3. Bulk insert all sections
    const { error: sectionsError } = await supabase
      .from("document_sections")
      .insert(sectionsToInsert);

    if (sectionsError) {
      console.error(sectionsError);
      return jsonResponse(
        { error: "Failed to insert document sections" },
        500,
      );
    }

    // process embeddings
    // chop the markdowns into more reasonable pieces return a list of sections
    const processed = processMarkdown(fileContents);

    // for each section insert it into document section
    const { error: insertError } = await supabase
      .from("document_embeddings")
      .insert(
        processed.sections.map(({ content }) => ({
          document_id,
          content,
        })),
      );

    if (insertError) {
      console.error(insertError);
      return jsonResponse({ error: "Failed to save document embeddings" }, 500);
    }

    console.log(
      `✅ Saved ${processed.sections.length} embeddings for file '${document.name}'`,
    );

    return new Response(null, {
      status: 204,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
});
