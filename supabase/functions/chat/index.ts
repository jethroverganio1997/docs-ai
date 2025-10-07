import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { codeBlock, oneLine } from "https://esm.sh/common-tags@1.8.2";
import { createOpenAI } from "https://esm.sh/@ai-sdk/openai@2.0.32";
import { convertToModelMessages, streamText, embed, type UIMessage } from "https://esm.sh/ai@5.0.45";

const openai = createOpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const ALLOWED_ORIGINS = [
  "https://docs.jethroverganio.com",
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
    console.log("before auth");

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization,x-client-info, apikey, content-type",
    };

    // Handle preflight request (OPTIONS)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    console.log("after options");

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
        match_threshold: 0.4,
        match_count: 5,
      })
      .select("content, url");

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

    const injectedUrl = documents && documents.length > 0
      ? [...new Set(documents.map(({ url }) => url))]
      : [];
    console.log(injectedUrl);

    // stream the ai response
    const result = streamText({
      model: openai("gpt-5-mini"),
      system: codeBlock`
                ${oneLine`
                    You are a very enthusiastic Far East Express representative. Your job is to help people by answering their questions in a friendly, conversational tone.

                    Always answer using information from the Context sections provided below.

                    If the answer is already in the chat history, you may use that instead.

                    If the answer is not in the context section or chat history, but related topics exist in the documentation, suggest those topics briefly.

                    Never make up information or provide suggestions that are not in the documentation or chat history.

                    Do not add extra offers of help or optional follow-ups at the end of responses.

                    If you cannot find the answer in either the documentation or chat history, say:
                    “Sorry, I don’t know how to help with that.”

                    Keep all answers:
                        Short and clear.
                        In the first person (use “I”).
                        Warm, professional, and helpful."
                `}

                Context sections:
                ${injectedDocs}
                
                Answer as markdown (including related code snippets and image links if available):`,

      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      headers: corsHeaders,
      messageMetadata: ({ part }) => {
        // Send sources when the generation is finished
        if (part.type === "finish") {
          return {
            sources: injectedUrl, // Attach the array of URLs
          };
        }
      },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
});
