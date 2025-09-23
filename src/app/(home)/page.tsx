import Link from "next/link";

export default function HomePage() {
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
