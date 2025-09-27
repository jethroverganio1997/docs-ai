// supabase/functions/search/index.ts
import { createClient } from "@supabase/supabase-js";

// Define the types directly in the function or import from a shared file.
// These should match the types in your front-end application.
type HighlightedText = {
  type: "text";
  content: string;
  styles?: {
    highlight?: boolean;
  };
};

type SortedResult = {
  id: string;
  url: string;
  type: "page" | "heading" | "text";
  content: string;
  contentWithHighlights?: HighlightedText[];
};

type SearchResult = {
  id: number;
  url: string;
  type: "page" | "heading" | "text";
  content: string;
  contentWithHighlights: string;
  rank: number;
};

// This helper function is the same as your API route version.
function parseHighlights(highlightedString: string): HighlightedText[] {
  const parts = highlightedString.split(/<mark>|<\/mark>/g);
  const result: HighlightedText[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part) {
      result.push({
        type: "text",
        content: part,
        styles: {
          highlight: i % 2 === 1,
        },
      });
    }
  }
  return result;
}

const ALLOWED_ORIGINS = [
  "https://yourapp.com",
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

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response("CORS not allowed", { status: 403 });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    };

    // Handle preflight request (OPTIONS)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return new Response(
        JSON.stringify({ error: `No authorization header passed` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 1. Extract search query from the URL
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter "query" is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    console.log(searchParams);
    // 2. Create a Supabase client
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

    // 3. Call the RPC function
    const { data, error } = await supabase.rpc(
      "search_documents",
      {
        search_term: query,
      },
    );
    console.log(data);

    if (error) {
      console.error("Supabase search error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify("empty"), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataCast = data as SearchResult[];

    // 4. Transform the result for the client
    const formattedResults: SortedResult[] = dataCast.map((item) => ({
      id: item.id.toString(),
      url: item.url,
      type: item.type,
      content: item.content,
      contentWithHighlights: parseHighlights(item.contentWithHighlights),
    }));

    return new Response(JSON.stringify(formattedResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Caught error:", err);
    return jsonResponse({ error: `Internal Server Error ${err}` }, 500);
  }
});
