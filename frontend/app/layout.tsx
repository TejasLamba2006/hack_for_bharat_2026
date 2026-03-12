import type { Metadata } from 'next'
import { Inter, Merriweather, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _merriweather = Merriweather({ 
  subsets: ["latin"], 
  weight: ["300", "400", "700"],
  variable: "--font-merriweather" 
});
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: 'DocSearch - AI-Powered Document Management',
  description: 'Upload, search, and manage your documents with AI-powered semantic search capabilities. Fast, secure, and easy-to-use document management system.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'DocSearch - AI-Powered Document Management',
    description: 'Upload, search, and manage your documents with AI-powered semantic search',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
