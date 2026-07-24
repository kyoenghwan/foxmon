import '@/app/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Foxmon CS Terminal',
  description: 'Foxmon Realtime CS Response & Recharge Management Mobile WebApp',
};

export default function CsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen overflow-x-hidden antialiased`}>
        {children}
      </body>
    </html>
  );
}
