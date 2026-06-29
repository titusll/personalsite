import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lyricle — Daily Lyric Game",
  description: "Guess the song from its lyrics, one line at a time. A new puzzle every day.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
