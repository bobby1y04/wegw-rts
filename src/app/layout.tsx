import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wegwärts",
    template: "%s · Wegwärts",
  },
  description:
    "Dein lokaler Bildungsnavigator für Studienwahl, Bewerbung, Finanzierung und Studienalltag.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
