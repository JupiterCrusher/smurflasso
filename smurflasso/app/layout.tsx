import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Campus Incident Explorer',
  description: 'Independent dashboard for exploring public campus incident records, trends, locations, and case status.',
  keywords: ['campus incidents', 'crime log', 'campus safety', 'public data dashboard'],
  authors: [{ name: 'Cole Kreiling', url: 'https://colekreiling.com' }],
  openGraph: {
    title: 'Campus Incident Explorer',
    description: 'Independent public incident dashboard with summaries, filters, charts, and a searchable log.',
    url: 'https://your-site.vercel.app',
    siteName: 'Campus Incident Explorer',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Campus Incident Explorer dashboard preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
