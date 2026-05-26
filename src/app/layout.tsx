import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ef4444",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  title: "Pinverse — Discover, Save & Share Creative Ideas",
  description:
    "A Pinterest-inspired platform to discover, save, and share creative visual content. Explore curated collections, organize your favorite ideas, and connect with a community of creators.",
  keywords: [
    "Pinverse",
    "Pinterest",
    "visual discovery",
    "creative ideas",
    "pin board",
    "mood board",
    "inspiration",
    "image collection",
    "visual bookmarks",
    "idea saving",
    "creative content",
    "design inspiration",
    "photo sharing",
    "curated collections",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Pinverse" }],
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Pinverse — Discover, Save & Share Creative Ideas",
    description:
      "A Pinterest-inspired platform to discover, save, and share creative visual content. Explore curated collections and connect with creators.",
    type: "website",
    siteName: "Pinverse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pinverse — Discover, Save & Share Creative Ideas",
    description:
      "A Pinterest-inspired platform to discover, save, and share creative visual content.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Pinverse",
  },
};

function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pinverse",
    description:
      "A Pinterest-inspired platform to discover, save, and share creative visual content.",
    url: "https://pinverse.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://pinverse.app/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
