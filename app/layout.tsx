import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthLog AI Marketing Team",
  description: "HealthLog AI Marketing Team MVP console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

