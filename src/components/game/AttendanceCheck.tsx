'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, CheckCircle } from 'lucide-react';

interface AttendanceCheckProps {
  isPlayedToday: boolean;
  activityPoints: number;
  onPlaySuccess: (rewardAmount: number, balanceAfter: number, playedTodayUpdate: boolean) => void;
}

export default function AttendanceCheck({ isPlayedToday, activityPoints, onPlaySuccess }: AttendanceCheckProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [checkedDates, setCheckedDates] = useState<string[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(true);

  // 달력 렌더링에 필요한 날짜 정보
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed (0: 1월, 5: 6월)
  const currentDate = today.getDate();

  // 이번 달의 첫 날 요일과 마지막 날짜 구하기
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0: 일요일, 1: 월요일...
  const totalDays = new Date(year, month + 1, 0).getDate();

  // 이전 달의 마지막 일수 (빈 셀 채우기용)
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarDays: Array<{ date: number; isCurrentMonth: boolean; isToday: boolean; isChecked: boolean }> = [];

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const monthStr = (month + 1).toString().padStart(2, '0');
        const res = await fetch(`/api/attendance?year=${year}&month=${monthStr}`);
        const json = await res.json();
        if (json.success && json.dates) {
          setCheckedDates(json.dates);
        }
      } catch (err) {
        console.error('출석 현황 로드 에러', err);
      } finally {
        setIsFetchLoading(false);
      }
    };
    fetchLogs();
  }, [year, month]);

  // 1. 이전 달 날짜들로 빈 칸 채우기
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      date: prevMonthTotalDays - i,
      isCurrentMonth: false,
      isToday: false,
      isChecked: false,
    });
  }

  // 2. 이번 달 날짜들 채우기
  const monthStr = (month + 1).toString().padStart(2, '0');
  for (let i = 1; i <= totalDays; i++) {
    const isToday = i === currentDate;
    const dateStr = `${year}-${monthStr}-${i.toString().padStart(2, '0')}`;
    const isChecked = checkedDates.includes(dateStr);
    calendarDays.push({
      date: i,
      isCurrentMonth: true,
      isToday,
      isChecked,
    });
  }

  // 3. 다음 달 날짜들로 42칸 채우기 (캘린더 격자 유지)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      isChecked: false,
    });
  }

  const handleAttendance = async () => {
    if (isPlayedToday || isLoading) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || '출석체크 진행 중 오류가 발생했습니다.');
      }

      const { rewardAmount, balanceAfter, message } = json;
      setSuccessMsg(`🎉 ${message}`);
      
      const kstTodayStr = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
      setCheckedDates(prev => prev.includes(kstTodayStr) ? prev : [...prev, kstTodayStr]);

      onPlaySuccess(rewardAmount, balanceAfter, true);
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900/60 rounded-3xl border border-gray-800 shadow-2xl max-w-2xl w-full mx-auto relative overflow-hidden backdrop-blur-md">
      {/* 도장 애니메이션 CSS 주입 */}
      <style jsx global>{`
        @keyframes stamp-bang {
          0% { transform: scale(3); opacity: 0; filter: blur(5px); }
          50% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; filter: none; }
        }
        .stamp-animation {
          animation: stamp-bang 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* 헤더 부분 */}
      <div className="w-full flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-500" />
          {year}년 {month + 1}월 출석체크
        </h3>
        <span className="text-[11px] font-bold text-gray-400">
          매일 1회 무료! (+100p 지급)
        </span>
      </div>

      {/* 포인트 정보 */}
      <div className="flex items-center gap-2 mb-4 w-full justify-end text-xs font-bold">
        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20">
          보유: {activityPoints.toLocaleString()}p
        </span>
        <span className="px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20">
          오늘 상태: {isPlayedToday ? '출석 완료' : '미출석'}
        </span>
      </div>

      {/* 캘린더 격자 */}
      <div className="w-full bg-gray-950/80 border border-gray-800 rounded-2xl p-4 shadow-inner">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-gray-500 mb-2 border-b border-gray-900 pb-2">
          <span className="text-red-500">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-blue-500">토</span>
        </div>

        {/* 날짜 격자 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, idx) => {
            const isWeekendSun = idx % 7 === 0;
            const isWeekendSat = idx % 7 === 6;

            return (
              <div
                key={idx}
                className={`relative aspect-square flex flex-col items-center justify-between p-1 rounded-lg border text-[11px] font-bold transition-all ${
                  !cell.isCurrentMonth
                    ? 'bg-transparent border-transparent text-gray-700'
                    : cell.isToday
                    ? 'bg-pink-500/10 border-pink-500 text-pink-100 shadow-md shadow-pink-500/5'
                    : 'bg-gray-900/40 border-gray-800/40 text-gray-400'
                }`}
              >
                {/* 날짜 번호 */}
                <span className={`self-start ${
                  !cell.isCurrentMonth ? 'text-gray-700' :
                  isWeekendSun ? 'text-red-500/80' : 
                  isWeekendSat ? 'text-blue-500/80' : ''
                }`}>
                  {cell.date}
                </span>

                {/* 출석 도장 */}
                {cell.isChecked && cell.isCurrentMonth && (
                  <div className={`absolute inset-0 flex items-center justify-center ${cell.isToday && isPlayedToday ? 'stamp-animation' : 'opacity-85'}`}>
                    <div className="w-9 h-9 rounded-full border-2 border-pink-500 bg-pink-500/10 flex items-center justify-center text-[9px] font-black text-pink-500 rotate-[-12deg] shadow-inner select-none">
                      참 잘했어요
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 조작 버튼 및 알림 영역 */}
      <div className="w-full mt-5 space-y-3">
        {successMsg && (
          <div className="p-3.5 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-center text-xs font-black text-pink-400 flex items-center justify-center gap-2 animate-in fade-in duration-300">
            <CheckCircle className="w-4 h-4 shrink-0 text-pink-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-center text-xs font-bold text-red-400">
            ⚠️ {error}
          </div>
        )}

        <Button
          onClick={handleAttendance}
          disabled={isPlayedToday || isLoading}
          className={`w-full h-12 font-black text-sm rounded-2xl transition-all active:scale-[0.98] ${
            isPlayedToday
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-pink-500/20'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              출석 도장 찍는 중...
            </span>
          ) : isPlayedToday ? (
            '오늘의 출석체크 완료!'
          ) : (
            '출석 도장 쿵! 찍기'
          )}
        </Button>
      </div>
    </div>
  );
}
