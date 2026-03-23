import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoteMaster",
  description:
    "Retro-themed notes app with tags, search, and pin/favorite — powered by a FastAPI backend.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
