import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: "FEE Remit Docs",
  description: "Far East Express documentations",
  // icons: {
  //   icon: [{ url: "/favicon.ico" }],
  // },
};

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
