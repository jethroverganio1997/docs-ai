// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { embed } from "https://esm.sh/ai@5.0.45";
import { createOpenAI } from "https://esm.sh/@ai-sdk/openai@2.0.32";

// [5]

const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Utility: JSON response helper
function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    // check auth and validation
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization } },
      auth: { persistSession: false },
    });

    // return a batch of rows
    const { ids, table, contentColumn, embeddingColumn } = await req.json();

    // select the row which have null embeddings
    const { data: rows, error: selectError } = await supabase
      .from(table)
      .select(`id, ${contentColumn}` as "*")
      .in("id", ids)
      .is(embeddingColumn, null);

    if (selectError) {
      console.error(selectError);
      return jsonResponse({ error: "Embed data not found" }, 404);
    }

    // for each row embed the raw data and update the row
    for (const row of rows) {
      const { id, [contentColumn]: content } = row;

      if (!content) {
        console.error(`No content available in column '${contentColumn}'`);
        continue;
      }

      const { embedding } = await embed({
        model: openai.textEmbeddingModel("text-embedding-3-small"),
        value: content,
        providerOptions: {
          openai: {
            dimensions: 768, // Reduce embedding dimensions
          },
        },
      });

      const { error } = await supabase
        .from(table)
        .update({
          [embeddingColumn]: embedding,
        })
        .eq("id", id);

      if (error) {
        console.error(
          `Failed to save embedding on '${table}' table with id ${id} ${error.message}`,
        );
      }

      console.log(
        `Generated embedding ${
          JSON.stringify({
            table,
            id,
            contentColumn,
            embeddingColumn,
          })
        }`,
      );
    }

    return new Response(null, {
      status: 204,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
});
