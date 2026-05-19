'use client';

import { usePathname } from 'next/navigation';

export function MaxWidthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/fox-office');

  return (
    <div 
      className={`mx-auto bg-white min-h-screen relative shadow-[0_0_40px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 ${
        isAdmin ? 'w-full' : 'max-w-[1280px] 2xl:max-w-[1096px] 3xl:max-w-[1280px]'
      }`}
    >
      {children}
    </div>
  );
}
