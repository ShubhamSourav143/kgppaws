import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SITE } from "@/lib/config";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { MobileDock } from "@/components/layout/MobileDock";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { PawCursor } from "@/components/fx/PawCursor";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import { getSettings } from "@/services/content";
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  
  const siteName = (settings["site_name"] as string) || SITE.name;
  const description = (settings["seo_default_description"] as string) || SITE.description;
  const title = (settings["seo_default_title"] as string) || "KGP PAWS — Every Paw Has a Story";

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: title,
      template: `%s · ${siteName}`,
    },
    description,
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
      siteName,
      title,
      description,
      url: SITE.url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: "/" },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
    // icons come from the app/favicon.ico, app/icon.png and app/apple-icon.png
    // file conventions — an explicit `icons` field here would suppress them.
  };
}

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
      // The reveal-gate script in <head> sets data-reveal-ready on this element
      // before React hydrates, so the hydrated <html> carries an attribute the
      // server HTML did not — an expected, intentional mismatch. Suppressing it
      // here is the same pattern theme scripts use; it only covers this
      // element's own attributes, not its subtree.
      suppressHydrationWarning
      className={`${manrope.variable} ${fraunces.variable} antialiased`}
    >
      <head>
        {/*
          Scroll-reveal gate. This runs synchronously during head parse —
          before the body paints and independent of React hydration — and marks
          the document as JS-capable. The reveal wrappers (fx/Reveal,
          motion/Reveal, fx/TextReveal) render VISIBLE by default; their hidden
          pre-reveal state in globals.css applies only under this attribute. So
          if the bundle never loads or fails, the attribute is absent and all
          content stays visible instead of being stuck at opacity:0. See
          components/fx/use-reveal.ts for the reveal-on-scroll half.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute('data-reveal-ready','')`,
          }}
        />
        {/* Belt-and-braces for any remaining framer-motion initial={{opacity:0}} wrappers. */}
        <noscript>
          <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-cream"
        >
          Skip to main content
        </a>
        <SiteChrome>
          {/* the fixed header floats over content; pages with a cinematic
              hero pull themselves underneath it with -mt-16 md:-mt-20 */}
          <main id="main-content" className="flex-1 pt-16 md:pt-20">
            {children}
          </main>
        </SiteChrome>
        <MobileDock />
        <SmoothScroll />
        <PawCursor />
        <ServiceWorker />
      </body>
    </html>
  );
}
