import React from 'react';
import { Loader2 } from 'lucide-react';

export default function JobModalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-[1000px] w-[95vw] sm:w-[90vw] h-[80vh] bg-white sm:rounded-[32px] shadow-2xl flex flex-col items-center justify-center gap-4 rounded-2xl animate-pulse">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-bold text-gray-400">구인 정보를 불러오고 있습니다...</p>
      </div>
    </div>
  );
}
