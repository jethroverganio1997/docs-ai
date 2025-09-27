// // app/api/search/route.ts

// import { HighlightedText } from "fumadocs-core/search/server";
// import { SortedResult } from "fumadocs-core/server";
// import { NextResponse } from "next/server";
// import { createClient } from "../../../lib/supabase/client";
// import { SearchResult } from "../../../types/search-result";

// // Helper function to parse the <mark> tags from ts_headline
// function parseHighlights(highlightedString: string): HighlightedText[] {
//   const parts = highlightedString.split(/<mark>|<\/mark>/g);
//   const result: HighlightedText[] = [];

//   for (let i = 0; i < parts.length; i++) {
//     const part = parts[i];
//     if (part) {
//       result.push({
//         type: "text",
//         content: part,
//         styles: {
//           // If the original string was '<mark>text</mark>', the part at an odd index is the highlighted one.
//           highlight: i % 2 === 1,
//         },
//       });
//     }
//   }
//   return result;
// }

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const query = searchParams.get("query");

//   if (!query) {
//     return NextResponse.json({ error: 'Query parameter "q" is required' }, {
//       status: 400,
//     });
//   }

//   const supabase = createClient();

//   // Call the RPC function in Supabase
//   const { data, error } = await supabase.rpc("search_documents", {
//     search_term: query,
//   });

//   if (error) {
//     console.error("Supabase search error:", error);
//     return NextResponse.json({ error: "Internal server error" }, {
//       status: 500,
//     });
//   }

//   if (!data || data.length === 0) {
//     return NextResponse.json("empty");
//   }

//   const result = data as SearchResult[];

//   // Transform the RPC result into the SortedResult[] format your hook expects
//   const formattedResults: SortedResult[] = result.map((item) => ({
//     id: item.id.toString(),
//     url: item.url,
//     type: item.type as "heading" | "text",
//     content: item.content,
//     contentWithHighlights: parseHighlights(item.contentWithHighlights), // Note the lowercase key from Supabase RPC
//   }));

//   return NextResponse.json(formattedResults);
// }
