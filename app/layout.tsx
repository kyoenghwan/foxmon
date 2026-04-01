import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Foxmon",
  description: "Part-time job platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <AutoLogoutWrapper>
            {children}
            <FoxTalkWidget />
          </AutoLogoutWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}
