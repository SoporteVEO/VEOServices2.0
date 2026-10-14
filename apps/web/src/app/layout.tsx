import type { Metadata, Viewport } from "next";
import { Funnel_Display, Funnel_Sans, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/primitives/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { BRAND_COLORS } from "@/lib/brand-colors";
import { QueryProvider } from "@/lib/query-provider";
import { cn } from "@/lib/utils";

const funnelSans = Funnel_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const funnelDisplay = Funnel_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Veo",
  description: "Veo application",
  applicationName: "Veo Services",
  appleWebApp: {
    capable: true,
    title: "Veo",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_COLORS.snow },
    { media: "(prefers-color-scheme: dark)", color: BRAND_COLORS.dark },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        funnelSans.variable,
        funnelDisplay.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-svh font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              <Toaster position="top-center" />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
