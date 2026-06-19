'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Compass, Gift, HelpCircle, Calendar } from 'lucide-react';
import RouletteGame from '@/src/components/game/RouletteGame';
import LuckyBoxGame from '@/src/components/game/LuckyBoxGame';
import AttendanceCheck from '@/src/components/game/AttendanceCheck';
import RetroDrawGame from '@/src/components/game/RetroDrawGame';

type DailyStatus = {
  roulettePlayed: boolean;
  luckyBoxPlayed: boolean;
  attendancePlayed: boolean;
};

type RetroSlot = {
  id: string;
  slotNumber: number;
  isPulled: boolean;
  rewardAmount?: number;
  rewardTier?: number;
  userNickname?: string;
};

type RetroBoard = {
  boardRound: number;
  isCompleted: boolean;
  slots: RetroSlot[];
};

type ActiveTab = 'roulette' | 'luckybox' | 'attendance' | 'retro';

export default function PlayDashboardClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('attendance');
  const [loading, setLoading] = useState(true);
  const [activityPoints, setActivityPoints] = useState(0);
  const [dailyStatus, setDailyStatus] = useState<DailyStatus>({
    roulettePlayed: false,
    luckyBoxPlayed: false,
    attendancePlayed: false,
  });
  const [retroBoard, setRetroBoard] = useState<RetroBoard | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/game/status');
      const json = await res.json();
      if (json.success) {
        setActivityPoints(json.activityPoints);
        setDailyStatus(json.dailyStatus);
        setRetroBoard(json.retroBoard);
      }
    } catch (err) {
      console.error('현황 조회 중 오류가 발생했습니다.', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 미니게임 플레이 성공 시 콜백
  const handleMiniGameSuccess = (rewardAmount: number, balanceAfter: number, playedTodayUpdate: boolean) => {
    setActivityPoints(balanceAfter);
    if (playedTodayUpdate) {
      setDailyStatus((prev) => ({
        ...prev,
        roulettePlayed: activeTab === 'roulette' ? true : prev.roulettePlayed,
        luckyBoxPlayed: activeTab === 'luckybox' ? true : prev.luckyBoxPlayed,
        attendancePlayed: activeTab === 'attendance' ? true : prev.attendancePlayed,
      }));
    }
  };

  // 추억의 딱지 뽑기 성공 시 콜백
  const handleRetroPullSuccess = (rewardAmount: number, balanceAfter: number, updatedBoard: RetroBoard) => {
    setActivityPoints(balanceAfter);
    setRetroBoard(updatedBoard);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-3 bg-gray-900/40 rounded-3xl border border-gray-800">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <span className="text-gray-400 text-sm font-semibold">놀이터를 불러오는 중입니다...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 탭 네비게이션 */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 p-1.5 bg-gray-900/80 border border-gray-800 rounded-2xl max-w-2xl mx-auto backdrop-blur-lg w-full">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-3 rounded-xl text-xs font-black tracking-tight transition-all uppercase ${
            activeTab === 'attendance'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          출석체크
        </button>
        <button
          onClick={() => setActiveTab('luckybox')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-3 rounded-xl text-xs font-black tracking-tight transition-all uppercase ${
            activeTab === 'luckybox'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Gift className="w-4 h-4" />
          랜덤상자
        </button>
        <button
          onClick={() => setActiveTab('roulette')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-3 rounded-xl text-xs font-black tracking-tight transition-all uppercase ${
            activeTab === 'roulette'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Compass className="w-4 h-4" />
          회전 룰렛
        </button>
        <button
          onClick={() => setActiveTab('retro')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-5 py-3 rounded-xl text-xs font-black tracking-tight transition-all uppercase ${
            activeTab === 'retro'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          종이뽑기
        </button>
      </div>

      {/* 게임 콘텐츠 컨테이너 */}
      <div className="w-full flex items-center justify-center">
        {activeTab === 'roulette' && (
          <RouletteGame
            isPlayedToday={dailyStatus.roulettePlayed}
            activityPoints={activityPoints}
            onPlaySuccess={handleMiniGameSuccess}
          />
        )}
        
        {activeTab === 'luckybox' && (
          <LuckyBoxGame
            isPlayedToday={dailyStatus.luckyBoxPlayed}
            activityPoints={activityPoints}
            onPlaySuccess={handleMiniGameSuccess}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceCheck
            isPlayedToday={dailyStatus.attendancePlayed}
            activityPoints={activityPoints}
            onPlaySuccess={handleMiniGameSuccess}
          />
        )}

        {activeTab === 'retro' && (
          <RetroDrawGame
            board={retroBoard}
            activityPoints={activityPoints}
            onPullSuccess={handleRetroPullSuccess}
            onRefreshBoard={fetchStatus}
          />
        )}
      </div>

    </div>
  );
}
