import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { validateEnv } from "@/lib/env";
import "./globals.css";

validateEnv();

export const metadata: Metadata = {
  title: {
    default: "Vyostra AI Interview",
    template: "%s | Vyostra AI Interview",
  },
  description: "Vyostra AI Interview — AI-powered voice & video interviews with real-time proctoring and automated scoring",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
