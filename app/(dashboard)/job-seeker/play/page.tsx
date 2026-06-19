import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PlayDashboardClient from './PlayDashboardClient';

export default async function PlayPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login?session_expired=1');
  }

  return (
    <div className="w-full min-h-screen bg-gray-950 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 타이틀 및 헤더 */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent filter drop-shadow">
            여우들의 놀이터 🎮
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-xl mx-auto">
            매일 주어지는 무료 기회로 대박 포인트를 노려보세요! 쌓인 포인트는 상품권으로 즉시 교환하실 수 있습니다.
          </p>
        </div>

        {/* 클라이언트 사이드 게임 대시보드 조립 */}
        <PlayDashboardClient />
        
      </div>
    </div>
  );
}
