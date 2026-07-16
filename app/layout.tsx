import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SITE } from "@/lib/config";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReportFab } from "@/components/layout/ReportFab";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "KGP PAWS — Every Paw Has a Story",
    template: "%s · KGP PAWS",
  },
  description: SITE.description,
  keywords: [
    "animal welfare",
    "IIT Kharagpur",
    "adopt a dog",
    "adopt a cat",
    "campus animals",
    "animal rescue India",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "KGP PAWS — Every Paw Has a Story",
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: "KGP PAWS — Every Paw Has a Story",
    description: SITE.description,
  },
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    title: "KGP PAWS",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#173F35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-cream"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <ReportFab />
        <ServiceWorker />
      </body>
    </html>
  );
}
