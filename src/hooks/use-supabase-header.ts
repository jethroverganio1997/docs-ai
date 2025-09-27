// hooks/use-supabase-header.ts
import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client";

// Define the expected shape of the headers object
type SupabaseHeaders = Record<string, string>;

export function useSupabaseHeaders(): SupabaseHeaders | undefined {
  const supabaseClient = createClient();
  const [headers, setHeaders] = useState<SupabaseHeaders | undefined>();

  useEffect(() => {
    // Define an async function inside the effect to fetch the session
    const getHeaders = async () => {
      // Always include the API key
      const baseHeaders = {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      };

      // Get the user's session
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (!session) {
        setHeaders(baseHeaders);
        return;
      }

      // If a session exists, add the Authorization token
      setHeaders({
        ...baseHeaders,
        Authorization: `Bearer ${session.access_token}`,
      });
    };

    getHeaders();

    // Re-run the effect whenever the supabaseClient instance changes
  }, [supabaseClient]);

  return headers;
}