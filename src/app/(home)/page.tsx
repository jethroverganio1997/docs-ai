import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  // const supabase = await createClient();

  // const { data, error } = await supabase.auth.getClaims();
  // if (error || !data?.claims) {
  //   redirect("/auth/login");
  // }

  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <h1 className="text-6xl md:text-8xl font-bold mb-6 text-balance items-center">
        <span className="text-gradient">FEE Remit</span>
        <br />
        <span className="text-gradient">Docs</span>
        <br />
      </h1>
      <p className="text-fd-muted-foreground">
        You can open{" "}
        <Link
          href="/docs"
          className="text-fd-foreground font-semibold underline"
        >
          /docs
        </Link>{" "}
        and see the documentation.
      </p>
    </main>
  );
}
