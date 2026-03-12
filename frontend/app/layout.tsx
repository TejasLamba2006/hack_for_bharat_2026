import type { Metadata } from "next";
import { Inter, Merriweather, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
});
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DocSearch - AI-Powered Document Management",
  description:
    "Upload, search, and manage your documents with AI-powered semantic search capabilities. Fast, secure, and easy-to-use document management system.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/branding/logo.png",
        type: "image/png",
      },
    ],
    apple: "/branding/logo.png",
  },
  openGraph: {
    title: "DocSearch - AI-Powered Document Management",
    description:
      "Upload, search, and manage your documents with AI-powered semantic search",
    type: "website",
    images: ["/branding/logo-wordmark-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
