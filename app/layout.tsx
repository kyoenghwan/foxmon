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
import { CsAgentDock } from "@/components/chat/cs-agent-dock";
import { AutoLogoutWrapper } from "@/components/auth/auto-logout-wrapper";
import { MaxWidthWrapper } from "@/src/components/layout/MaxWidthWrapper";

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
        <MaxWidthWrapper>
          <LanguageProvider>
            <AutoLogoutWrapper>
              {children}
              {modal}
              <FoxTalkWidget />
              <CsAgentDock />
            </AutoLogoutWrapper>
          </LanguageProvider>
        </MaxWidthWrapper>
      </body>
    </html>
  );
}
