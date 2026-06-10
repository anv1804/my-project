import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';

import { ToastProvider } from "@/components/providers/ToastProvider";
import AuthInitializer from "@/components/providers/AuthInitializer";
import { AntispamProvider } from "@/components/providers/AntispamProvider";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anvtools.us.kg';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MMO Tools Hub - Nền tảng công cụ tự động hóa',
    template: '%s | MMO Tools Hub',
  },
  description: 'Bộ công cụ MMO chuyên nghiệp: Thuê số điện thoại nhận OTP, tải video TikTok không logo, tạo tiêu đề TikTok, text-to-speech tiếng Việt và nhiều hơn nữa. Miễn phí, nhanh, bảo mật.',
  keywords: ['MMO tools', 'thuê số OTP', 'tải video TikTok', 'TikTok downloader', 'OTP phone rental', 'text to speech tiếng Việt', 'công cụ MMO', 'tools hub'],
  authors: [{ name: 'ANV Tools', url: SITE_URL }],
  creator: 'ANV Tools',
  publisher: 'MMO Tools Hub',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: 'MMO Tools Hub',
    title: 'MMO Tools Hub - Nền tảng công cụ tự động hóa',
    description: 'Bộ công cụ MMO chuyên nghiệp: Thuê số điện thoại nhận OTP, tải video TikTok không logo, TTS tiếng Việt và nhiều hơn nữa.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MMO Tools Hub - Nền tảng công cụ tự động hóa',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MMO Tools Hub - Nền tảng công cụ tự động hóa',
    description: 'Bộ công cụ MMO chuyên nghiệp: Thuê số OTP, tải TikTok, TTS tiếng Việt.',
    images: ['/og-image.png'],
    creator: '@anvtools',
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: '#F0B90B',
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
          <AntispamProvider>
            {children}
          </AntispamProvider>
          <AuthInitializer initialUser={initialUser} />
          <ToastProvider />
      </body>
    </html>
  );
}
