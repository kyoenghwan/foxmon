'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceCheckProps {
  onAttendanceSuccess?: (balanceAfter: number) => void;
  className?: string;
}

export function AttendanceCheck({ onAttendanceSuccess, className }: AttendanceCheckProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [attendedDates, setAttendedDates] = useState<string[]>([]);
  const [todayAttended, setTodayAttended] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // KST 오늘 날짜 문자열
  const getKstTodayStr = () => {
    return new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
  };

  const todayStr = getKstTodayStr();

  // 출석 데이터 가져오기
  const fetchAttendance = async (year: number, month: number) => {
    setLoading(true);
    try {
      const monthStr = month.toString().padStart(2, '0');
      const res = await fetch(`/api/attendance?year=${year}&month=${monthStr}`);
      const data = await res.json();
      if (data.success) {
        setAttendedDates(data.dates);
        setTodayAttended(data.dates.includes(todayStr));
      }
    } catch (e) {
      console.error('출석 데이터를 가져오지 못했습니다.', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // 출석체크 실행
  const handleAttendance = async () => {
    if (todayAttended || checking) return;
    setChecking(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setTodayAttended(true);
        setAttendedDates(prev => [...prev, todayStr]);
        if (onAttendanceSuccess && data.balanceAfter !== undefined) {
          onAttendanceSuccess(data.balanceAfter);
        }
        alert(data.message || '출석체크가 완료되었습니다!');
      } else {
        alert(data.message || '출석체크에 실패했습니다.');
      }
    } catch (e) {
      alert('출석체크 중 네트워크 오류가 발생했습니다.');
    } finally {
      setChecking(false);
    }
  };

  // 달력 렌더링용 연산
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay(); // 0: 일요일, 6: 토요일
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDay }, (_, i) => i);

  // 이전/다음 월 이동
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  return (
    <div className={cn("bg-white border border-gray-100 rounded-3xl p-6 shadow-xl relative overflow-hidden", className)}>
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-36 h-36 bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70" />
      <div className="absolute bottom-[-10%] left-[-10%] w-36 h-36 bg-blue-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-5 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-gray-900 leading-tight">매일매일 출석체크</h4>
            <p className="text-[11px] text-purple-600 font-bold mt-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-purple-600" /> 하루 1번, 활동 포인트 100p 즉시 적립!
            </p>
          </div>
        </div>

        <button
          onClick={handleAttendance}
          disabled={todayAttended || checking}
          className={cn(
            "w-full sm:w-auto h-12 px-6 rounded-2xl font-black text-xs tracking-tight transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-md",
            todayAttended
              ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/20"
          )}
        >
          {checking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : todayAttended ? (
            <>
              <Check className="w-4 h-4" strokeWidth={3} /> 오늘 출석 완료
            </>
          ) : (
            <>
              <Award className="w-4 h-4" /> 오늘 출석하기
            </>
          )}
        </button>
      </div>

      {/* Calendar Controller */}
      <div className="flex justify-between items-center mb-5 relative z-10">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 transition-all font-bold text-sm"
        >
          &lt;
        </button>
        <span className="text-sm font-black text-gray-800 tracking-tight">
          {currentYear}년 {currentMonth}월
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 transition-all font-bold text-sm"
        >
          &gt;
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="relative z-10">
        {loading ? (
          <div className="h-[240px] flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-xs text-gray-400 font-bold">출석 현황을 불러오는 중...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 text-center">
            {/* 요일 헤더 */}
            {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
              <span 
                key={w} 
                className={cn(
                  "text-[11px] font-black tracking-tighter pb-2", 
                  idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-gray-400"
                )}
              >
                {w}
              </span>
            ))}

            {/* 빈 슬롯 */}
            {emptySlots.map(s => (
              <div key={`empty-${s}`} className="aspect-square" />
            ))}

            {/* 날짜 셀 */}
            {daysArray.map(day => {
              const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const isAttended = attendedDates.includes(dateStr);
              const isToday = dateStr === todayStr;

              return (
                <div 
                  key={day} 
                  className={cn(
                    "aspect-square rounded-xl border flex flex-col items-center justify-center relative group transition-all duration-200 select-none text-xs font-bold",
                    isAttended 
                      ? "bg-purple-500 border-purple-500 text-white shadow-sm shadow-purple-500/20" 
                      : isToday 
                        ? "border-purple-600 text-purple-600 bg-purple-50/30"
                        : "border-gray-100 bg-gray-50/30 text-gray-700 hover:bg-gray-50 hover:border-gray-200"
                  )}
                >
                  <span className={cn(isAttended ? "opacity-30 scale-75 text-[10px]" : "")}>{day}</span>
                  {isAttended && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
                      <Check className="w-5 h-5 text-white" strokeWidth={3.5} />
                    </div>
                  )}
                  {isToday && !isAttended && (
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 absolute bottom-1.5 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
