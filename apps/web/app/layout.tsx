import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AgeGate } from "@/components/AgeGate";
import { SiteHeader } from "@/components/SiteHeader";
import { DEFAULT_THEME, lockedTheme } from "@/lib/direction-lock";
import { AGE_GATE_CONFIRMED_VALUE, AGE_GATE_STORAGE_KEY } from "@/lib/age-gate";

const bridgeDisplay = Poppins({
  subsets: ["latin"],
  variable: "--font-bridge",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Bridge: The cannabis industry, connected",
  description: "A verified cannabis industry network for discovering businesses, following market activity, and reaching the right people.",
  icons: { icon: "/bridge-mark.svg" },
  // Staging previews must not be indexed.
  robots: lockedTheme ? { index: false, follow: false } : undefined,
};

// Connected-signal is the purple Modern Network review URL. Force it before
// first paint even when a Netlify site is still locked to Trusted Current.
const unifiedThemeScript = `(function(){try{var h=location.hostname;if(h==="bridge-connected-signal.netlify.app"){document.documentElement.setAttribute("data-theme","network");}}catch(e){}})();`;
const ageGateScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(AGE_GATE_STORAGE_KEY)})===${JSON.stringify(AGE_GATE_CONFIRMED_VALUE)}){document.documentElement.setAttribute("data-age-verified","true");}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme={lockedTheme ?? DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: unifiedThemeScript }} />
        <script dangerouslySetInnerHTML={{ __html: ageGateScript }} />
      </head>
      <body className={bridgeDisplay.variable}>
        <AgeGate>
          <a className="skip-link" href="#main">Skip to content</a>
          <SiteHeader />
          <main id="main">{children}</main>
          <footer className="site-footer">
            <div className="shell footer-inner">
              <span>Bridge discovery prototype</span>
              <span>Provisional identity · pending Tori approval</span>
            </div>
          </footer>
        </AgeGate>
      </body>
    </html>
  );
}
