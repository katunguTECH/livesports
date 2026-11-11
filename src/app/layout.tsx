import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GoogleAnalytics } from "@next/third-parties/google";
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
      "mitgo-verification": "68f683e0-d6ca-479b-a3ca-b234f10a974c",
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveSports - Global sports broadcast directory",
    description:
      "Find where to watch any sport, anywhere in the world.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <GoogleAnalytics gaId="G-T62SH96D1S" />
      </body>
    </html>
  );
}
