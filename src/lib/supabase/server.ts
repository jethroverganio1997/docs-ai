import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export async function createClient(
  // The parameter is now optional and can be null
  cookie?: Promise<ReadonlyRequestCookies> | null,
) {
  let cookieStore: ReadonlyRequestCookies;

  if (!cookie) {
    // If no cookie object is provided, create a new one from the request headers.
    // Note: cookies() is synchronous and doesn't need 'await'.
    cookieStore = await cookies();
  } else {
    // If a cookie promise is provided, await it to get the resolved value.
    cookieStore = await cookie;
  }

  // The rest of the function uses the cookieStore, which is now guaranteed to be defined.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
}
