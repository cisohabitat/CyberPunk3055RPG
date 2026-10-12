import type { Metadata, Viewport } from "next";
import fonts from "../qa/media/font-provenance.json";
import "./fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saint Shard — Kite City 3055",
  description:
    "A solo cyberpunk story RPG. One job becomes a week, then a ward. Saves in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#09080d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>{fonts.fonts.filter(font => font.preload).map(font => <link key={font.file} rel="preload" href={font.file.replace(/^public/, "")} as="font" type="font/woff2" crossOrigin="anonymous" />)}</head>
      <body>{children}</body>
    </html>
  );
}
