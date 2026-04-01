'use client';

import { useState, useEffect } from 'react';
import { nvLog } from '@/lib/logger';
import { QA_SEARCH_RESUMES } from '@/src/atoms/qa/search/QA_SEARCH_RESUMES';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter, MapPin, User, Calendar, Loader2, ArrowRight } from 'lucide-react';
// import { toast } from 'sonner';

export function EmployerSearchPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    gender: '' as 'MALE' | 'FEMALE' | '',
    minAge: '',
    maxAge: '',
    regionProvince: '',
    regionCity: '',
  });

  const fetchResumes = async () => {
    setIsLoading(true);
    nvLog('FW', '인재 검색 시작', filters);

    try {
      const result = await QA_SEARCH_RESUMES({
        gender: filters.gender || undefined,
        minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
        maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
        regionProvince: filters.regionProvince || undefined,
        regionCity: filters.regionCity || undefined,
      });

      if (result.success) {
        setResumes(result.data || []);
      } else {
        alert('검색 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('시스템 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '미정';
    const birthYear = parseInt(birthDate.substring(0, 4), 10);
    return new Date().getFullYear() - birthYear;
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-purple-900 italic tracking-tighter uppercase">
          FIND YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">BEST TALENT</span>
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs md:text-sm">실시간 인재 매칭 시스템 - FOXMON PREMIUM</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl flex flex-col md:flex-row gap-6 items-end">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
            {/* Gender Filter */}
            <div className="space-y-2">
                <Label className="text-gray-600 text-[10px] font-black uppercase tracking-widest pl-1">성별</Label>
                <select 
                    value={filters.gender}
                    onChange={(e) => setFilters({...filters, gender: e.target.value as any})}
                    className="w-full bg-gray-50/50 border border-gray-200 h-11 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-purple-500/50 outline-none appearance-none"
                >
                    <option value="">성별 전체</option>
                    <option value="MALE">남성</option>
                    <option value="FEMALE">여성</option>
                </select>
            </div>

            {/* Age Filter */}
            <div className="space-y-2">
                <Label className="text-gray-600 text-[10px] font-black uppercase tracking-widest pl-1">연령대 (최소)</Label>
                <Input 
                    type="number"
                    placeholder="20"
                    value={filters.minAge}
                    onChange={(e) => setFilters({...filters, minAge: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm font-bold"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-gray-600 text-[10px] font-black uppercase tracking-widest pl-1">연령대 (최대)</Label>
                <Input 
                    type="number"
                    placeholder="40"
                    value={filters.maxAge}
                    onChange={(e) => setFilters({...filters, maxAge: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm font-bold"
                />
            </div>

            {/* Province Filter */}
            <div className="space-y-2">
                <Label className="text-gray-600 text-[10px] font-black uppercase tracking-widest pl-1">지역 (시/도)</Label>
                <select 
                    value={filters.regionProvince}
                    onChange={(e) => setFilters({...filters, regionProvince: e.target.value})}
                    className="w-full bg-gray-50/50 border border-gray-200 h-11 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-purple-500/50 outline-none appearance-none"
                >
                    <option value="">지역 전체</option>
                    <option value="서울">서울특별시</option>
                    <option value="경기">경기도</option>
                    <option value="인천">인천광역시</option>
                </select>
            </div>
        </div>

        <Button 
            onClick={fetchResumes}
            disabled={isLoading}
            className="w-full md:w-32 h-11 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.95]"
        >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <div className="flex items-center gap-2">
                    <Search size={18} />
                    검색
                </div>
            )}
        </Button>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            <p className="text-purple-900 font-black italic animate-pulse">인재 데이터를 불러오는 중...</p>
        </div>
      ) : resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {resumes.map((resume) => (
            <div key={resume.id} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-xl hover:shadow-2xl hover:border-purple-200 transition-all duration-500 relative flex flex-col justify-between overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full opacity-50 group-hover:bg-purple-100 transition-colors"></div>

                <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-3 py-1 rounded-full uppercase tracking-tighter">
                                {resume.region_province} · {resume.region_city}
                            </span>
                            <h3 className="text-lg font-black text-gray-900 italic tracking-tight group-hover:text-purple-700 transition-colors">
                                {resume.title}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 font-bold text-xs uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                            <User size={14} className="text-purple-400" />
                            {resume.user?.gender === 'MALE' ? '남성' : '여성'}
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-purple-400" />
                            {calculateAge(resume.user?.birth_date)}세
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-purple-400" />
                            {resume.region_city}
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-3 font-medium leading-relaxed">
                        {resume.introduction || "자기소개가 등록되지 않았습니다."}
                    </p>
                </div>

                <Button variant="ghost" className="mt-8 w-full h-12 font-black text-purple-600 hover:bg-purple-50 group-hover:gap-4 transition-all border border-purple-50 rounded-2xl flex items-center justify-between px-6">
                    프로필 상세보기
                    <ArrowRight size={18} />
                </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 space-y-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="text-gray-300 w-8 h-8" />
            </div>
            <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 italic">검색 결과가 없습니다.</h3>
                <p className="text-gray-400 text-sm font-medium">필터 조건을 변경하여 다시 시도해 보세요.</p>
            </div>
        </div>
      )}
    </div>
  );
}
