import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';

import { ToastProvider } from "@/components/providers/ToastProvider";
import AuthInitializer from "@/components/providers/AuthInitializer";
import { createClient } from "@/utils/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MMO Tools Hub - Nền tảng công cụ tự động hóa",
  description: "Bộ công cụ tải video không logo và dịch vụ Landing page cho dân MMO.",
  viewport: "width=device-width, initial-scale=1, minimum-scale=1",
};

export default async function RootLayout({ children }) {
  let initialUser = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    initialUser = user ?? null;
  } catch {
    // Supabase chưa cấu hình hoặc lỗi đọc session — giữ null
  }

  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <NextTopLoader
            color="#F0B90B"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #F0B90B,0 0 5px #F0B90B"
          />
          {children}
          <AuthInitializer initialUser={initialUser} />
          <ToastProvider />
      </body>
    </html>
  );
}
