import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container px-4 md:px-6 py-24 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="font-bold text-gray-400">폭스몬 메인 화면을 불러오고 있습니다...</p>
    </div>
  );
}
