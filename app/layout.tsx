import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PullCalculator",
  description: "祝你十连三金!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
