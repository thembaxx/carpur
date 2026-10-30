import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PrefsProvider } from "@/lib/prefs";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Carpur — Find your next car",
  description: "New cars and second-hand finds, with a clear view of what each one costs to own.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090b0e",
};

const themeScript =
  "try{var t=JSON.parse(localStorage.getItem('cp.t'));if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA" className={sora.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PrefsProvider>
          <Suspense fallback={<Header />}>
            <Header withActiveRoute />
          </Suspense>
          <main id="m">{children}</main>
          <Footer />
        </PrefsProvider>
        <a
          href="/vision/index.html"
          style={{
            display: "block",
            width: "fit-content",
            margin: "16px auto",
            padding: "12px 18px",
            border: "1px solid currentColor",
            borderRadius: 999,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Try on-device vision (preview)
        </a>
      </body>
    </html>
  );
}
