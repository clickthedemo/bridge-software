import type { Metadata } from "next";
import { Caveat, Inter, Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { AgeGate } from "@/components/AgeGate";
import { SiteHeader } from "@/components/SiteHeader";
import { TabBar } from "@/components/TabBar";
import { DEFAULT_THEME, lockedTheme } from "@/lib/direction-lock";
import { AGE_GATE_CONFIRMED_VALUE, AGE_GATE_STORAGE_KEY } from "@/lib/age-gate";
import { AuthProvider } from "@/components/auth/AuthProvider";

// Client brand kit, 2026-07-20 Tori source package: Poppins headlines,
// Montserrat SemiBold subheads, Inter body. Caveat is the marginalia hand
// from the Field Notes companion, used for accents only.
//
// Inter, Montserrat and Caveat are loaded as VARIABLE fonts: no `weight` key,
// so next/font ships the whole 100-900 axis. Pinning a static list here is
// what caused the weight defect found 2026-09-21 - globals.css declares 650,
// 700, 750, 780, 800, 850 and 900 across ~45 selectors (.button, nav a, label,
// .status-chip, .tag, .eyebrow among them) while only 400/500/600 of Inter and
// 600/700 of Montserrat were ever downloaded. The browser cannot load a weight
// that was not requested, so it synthesised a faux bold instead and the
// rendered text did not match the declared weight anywhere on the site.
// Poppins has no variable axis on Google Fonts, so its weights stay enumerated;
// 800 is the only one globals.css asks for and it is present.
const bridgeDisplay = Poppins({
  subsets: ["latin"],
  variable: "--font-bridge",
  weight: ["600", "700", "800"],
});

const bridgeSubhead = Montserrat({
  subsets: ["latin"],
  variable: "--font-bridge-subhead",
});

const bridgeBody = Inter({
  subsets: ["latin"],
  variable: "--font-bridge-body",
});

const bridgeHand = Caveat({
  subsets: ["latin"],
  variable: "--font-bridge-hand",
});

const fontVariables = [bridgeDisplay, bridgeSubhead, bridgeBody, bridgeHand]
  .map((font) => font.variable)
  .join(" ");

export const metadata: Metadata = {
  metadataBase: new URL("https://bridge-connected-signal.netlify.app"),
  title: "Bridge: The cannabis industry, connected",
  description: "A verified cannabis industry network for discovering businesses, following market activity, and reaching the right people.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/bridge-mark.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Bridge: The cannabis industry, connected",
    description: "A verified cannabis industry network for discovering businesses, following market activity, and reaching the right people.",
    url: "https://bridge-connected-signal.netlify.app",
    siteName: "Bridge",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Bridge: the cannabis industry, connected",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bridge: The cannabis industry, connected",
    description: "A verified cannabis industry network for discovering businesses, following market activity, and reaching the right people.",
    images: ["/og.png"],
  },
  // The official review prototype stays out of search.
  robots: { index: false, follow: false },
};

// Connected-signal is the purple Modern Network review URL. Force it before
// first paint even when a Netlify site is still locked to Trusted Current.
const unifiedThemeScript = `(function(){try{var h=location.hostname;if(h==="bridge-connected-signal.netlify.app"){document.documentElement.setAttribute("data-theme","network");}}catch(e){}})();`;
const ageGateScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(AGE_GATE_STORAGE_KEY)})===${JSON.stringify(AGE_GATE_CONFIRMED_VALUE)}){document.documentElement.setAttribute("data-age-verified","true");}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} data-theme={lockedTheme ?? DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: unifiedThemeScript }} />
        <script dangerouslySetInnerHTML={{ __html: ageGateScript }} />
      </head>
      <body>
        <AuthProvider><AgeGate>
          <a className="skip-link" href="#main">Skip to content</a>
          <SiteHeader />
          <main id="main">{children}</main>
          <TabBar />
          <footer className="site-footer">
            <div className="shell footer-inner">
              <span>Bridge</span>
              <span>The cannabis industry, connected</span>
            </div>
          </footer>
        </AgeGate></AuthProvider>
      </body>
    </html>
  );
}
