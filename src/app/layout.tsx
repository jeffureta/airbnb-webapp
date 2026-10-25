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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tagaytay-staycation.vercel.app"),
  title: "The Taal Viewpoint Sanctuary | Direct Tagaytay Staycation Booking",
  description:
    "Direct-booking staycation suite overlooking panoramic Taal Lake & Volcano at SMDC Wind Residences, Tagaytay. Book directly to save 15% on service fees with instant GCash, Maya, and QR Ph payments.",
  keywords: [
    "Tagaytay Staycation",
    "Taal Lake View Condo",
    "Wind Residences Tagaytay",
    "Tagaytay Direct Booking",
    "GCash Staycation",
    "SMDC Wind Tagaytay",
  ],
  authors: [{ name: "The Taal Viewpoint Sanctuary" }],
  openGraph: {
    title: "The Taal Viewpoint Sanctuary | Panoramic Taal Lake Staycation",
    description:
      "Save 15% by booking directly! Panoramic Taal view, 100 Mbps fiber WiFi, Netflix, and 24/7 AI Concierge support.",
    url: "https://tagaytay-staycation.vercel.app",
    siteName: "The Taal Viewpoint Sanctuary",
    images: [
      {
        url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Panoramic Taal Lake View Balcony Suite",
      },
    ],
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Taal Viewpoint Sanctuary | Tagaytay Staycation",
    description:
      "Direct booking suite with panoramic Taal Lake view, cool mountain breeze, and zero platform markup fees.",
    images: ["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
