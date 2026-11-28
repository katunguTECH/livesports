
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import "./globals.css";

const GA_ID = "G-T62SH96D1S";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LiveSports - Find where to watch any sport, anywhere",
  description:
    "A global directory of legal sports broadcasters. Live fixtures across football, basketball, NFL, baseball, hockey, tennis, MMA, golf, and rugby - with broadcaster links for every region.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://sports4.life"
  ),
  openGraph: {
    title: "LiveSports - Global sports broadcast directory",
    description:
      "Find where to watch any sport, anywhere in the world. Live fixtures, worldwide broadcasters, no geolocation locks.",
    type: "website",
    siteName: "LiveSports",
  },
  verification: {
    other: {
      "mitgo-verification": [
        "68f683e0-d6ca-479b-a3ca-b234f10a974c",
        "5561c83a-8b74-427d-8b98-b3734c6a7135",
      ],
      "fo-verify": "e3a6a8d5-d23f-498e-bcfb-37678edbbc78",
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveSports - Global sports broadcast directory",
    description:
      "Find where to watch any sport, anywhere in the world.",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <AnalyticsTracker />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />

        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
