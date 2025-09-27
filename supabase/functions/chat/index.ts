import { createClient } from "@supabase/supabase-js";
import { codeBlock, oneLine } from "common-tags";
import { createOpenAI } from "@ai-sdk/openai";
import { embed, type UIMessage } from "ai";
import { convertToModelMessages, streamText } from "ai";

const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// These are automatically injected
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
    // Handle CORS
    const origin = req.headers.get("origin") || "";

    // Reject if not allowed
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("CORS not allowed", { status: 403 });
    }

    const corsHeader = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    };

    // Handle preflight request (OPTIONS)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeader,
      });
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    // create supabase client
    // The user's auth token is passed from the client request header
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    // deserialized the request
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!messages?.length) {
      return jsonResponse({ error: "No messages provided" }, 400);
    }

    // get last index safely
    const lastMessage = messages[messages.length - 1];
    const combinedText = lastMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ");

    // embed the users question from message
    const { embedding } = await embed({
      model: openai.textEmbeddingModel("text-embedding-3-small"),
      value: combinedText, // pass the last message
      providerOptions: {
        openai: {
          dimensions: 768, // Reduce embedding dimensions
        },
      },
    });

    // search in vector database using embeddings
    const { data: documents, error: matchError } = await supabase
      .rpc("match_document_embeddings", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
      })
      .select("content");

    if (matchError) {
      console.error(matchError);
      return jsonResponse({
        error: "There was an error reading your documents, please try again.",
      }, 500);
    }

    // sanitized docs
    const injectedDocs = documents && documents.length > 0
      ? documents.map(({ content }) => content).join("\n\n")
      : "No documents found";

    console.log(injectedDocs);

    // stream the ai response
    const result = streamText({
      model: openai("gpt-5-mini"),
      system: codeBlock`
                ${oneLine`
                    You are a very enthusiastic Far East Express representative who loves
                    to help people! Given the following sections from the FEE
                    documentation, answer the question using only that information,
                    outputted in markdown format. If you are unsure and the answer
                    is not explicitly written in the documentation, say
                    "Sorry, I don't know how to help with that."
                `}

                Context sections:
                ${injectedDocs}

                Answer as markdown (including related code snippets if available):`,

      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      headers: corsHeader,
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
});
