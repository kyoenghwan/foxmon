import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

import { LanguageProvider } from "@/components/providers/language-provider";
import { FoxTalkWidget } from "@/components/chat/foxtalk-widget";
import { CsAgentDock } from "@/components/chat/cs-agent-dock";
import { AutoLogoutWrapper } from "@/components/auth/auto-logout-wrapper";
import { MaxWidthWrapper } from "@/src/components/layout/MaxWidthWrapper";
import Script from "next/script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Foxmon | 여우들의 은밀한 구인구직",
  description: "유흥알바, 고수익알바, 텐프로, 룸싸롱 등 프리미엄 유흥업소 구인구직 및 커뮤니티 플랫폼 폭스몬입니다.",
  keywords: [
    "폭스몬", "유흥알바", "밤알바", "여우알바", "악녀알바", "고수익알바", 
    "텐프로", "텐카페", "하이쩜오", "쩜오", "룸싸롱", "룸알바", "퍼블릭", 
    "가라오케", "셔츠룸", "레깅스룸", "노래방알바", "노래클럽", "보도", 
    "바알바", "모던바", "토킹바", "착석바", "룸바", "여성알바", "여자알바", 
    "당일지급알바", "당일지급", "주말알바", "투잡", "단기알바", 
    "유흥구인구직", "업소알바", "아가씨구인", "마담구인", "유흥커뮤니티"
  ],
  openGraph: {
    title: "Foxmon | 여우들의 은밀한 구인구직",
    description: "유흥알바, 고수익알바, 텐프로, 룸싸롱 등 프리미엄 유흥업소 구인구직 및 커뮤니티 플랫폼 폭스몬입니다.",
    url: "https://foxmon-d.vercel.app", // 추후 정식 도메인으로 변경 예정
    siteName: "Foxmon",
    images: [
      {
        url: "/og-image.jpg", // 임시. 나중에 실제 이미지 경로로 변경해야 함.
        width: 1200,
        height: 630,
        alt: "Foxmon 로고 및 소개",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foxmon | 여우들의 은밀한 구인구직",
    description: "프리미엄 유흥업소 구인구직 및 커뮤니티 플랫폼 폭스몬",
    images: ["/og-image.jpg"],
  },
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
        <Script src="https://cdn.iamport.kr/v1/iamport.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
