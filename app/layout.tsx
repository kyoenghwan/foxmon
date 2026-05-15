import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { LanguageProvider } from "@/components/providers/language-provider";
import { FoxTalkWidget } from "@/components/chat/foxtalk-widget";
import { AutoLogoutWrapper } from "@/components/auth/auto-logout-wrapper";
import { ZoomProvider } from "@/components/providers/zoom-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Foxmon | 여우들의 은밀한 알바",
  description: "여우몬 커뮤니티 및 구인구직 플랫폼",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f0f2f5]`}
      >
        <ZoomProvider />
        <div className="max-w-[1280px] mx-auto bg-white min-h-screen relative shadow-[0_0_40px_rgba(0,0,0,0.05)] flex flex-col">
          <LanguageProvider>
            <AutoLogoutWrapper>
              {children}
              {modal}
              <FoxTalkWidget />
            </AutoLogoutWrapper>
          </LanguageProvider>
        </div>
      </body>
    </html>
  );
}
