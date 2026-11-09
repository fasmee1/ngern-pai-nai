import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Prompt } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";

const bodyFont = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

const headingFont = Prompt({
  variable: "--font-heading",
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "เงินไปไหน",
  description: "จดรายรับรายจ่าย แล้วรู้ทันทีว่าเงินหายไปไหน",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
