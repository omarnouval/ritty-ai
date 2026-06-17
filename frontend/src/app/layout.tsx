import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { CustomCursor } from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Ritty.ai — Rent AI Agents. Instantly.",
  description: "The future is agent-native. Build yours on Ritual Chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="noise-overlay">
        <CustomCursor />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
