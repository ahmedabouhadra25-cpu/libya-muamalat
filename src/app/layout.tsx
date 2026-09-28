import type { Metadata } from "next";
import { NewsTicker } from "@/components/NewsTicker";
import "./globals.css";

export const metadata: Metadata = {
  title: "مساعد معاملات ليبيا",
  description:
    "منصة مستقلة تساعدك على فهم وإنجاز معاملاتك في ليبيا.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <NewsTicker />
        {children}
      </body>
    </html>
  );
}
