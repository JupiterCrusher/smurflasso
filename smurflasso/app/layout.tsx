import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: 'Boise State Crime Tracker',
  description: 'Unofficial live dashboard tracking campus crime reports from Boise State University.',
  keywords: ['Boise State', 'Crime Tracker', 'Campus Safety', 'BSU'],
  authors: [{ name: 'Cole Kreiling', url: 'https://colekreiling.com' }],
  openGraph: {
    title: 'Boise State Crime Tracker',
    description: 'Live, auto-updating crime log from BSU’s public safety data.',
    url: 'https://your-site.vercel.app',
    siteName: 'Boise State Crime Tracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Boise State Crime Tracker Preview',
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
