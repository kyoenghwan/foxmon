'use client';

import { useState, useEffect } from 'react';
import { nvLog } from '@/lib/logger';
import { FA_MANAGE_RESUME_FLOW } from '@/src/atoms/fa/resume/FA_MANAGE_RESUME_FLOW';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, FileText, MapPin, Briefcase } from 'lucide-react';

interface ResumeEditorProps {
  userId: string;
  initialData?: any;
  onSaveSuccess?: () => void;
}

export function ResumeEditor({ userId, initialData, onSaveSuccess }: ResumeEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    experience: initialData?.experience || '',
    introduction: initialData?.introduction || '',
    regionProvince: initialData?.region_province || '',
    regionCity: initialData?.region_city || '',
    isActive: initialData?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.regionProvince || !formData.regionCity) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    nvLog('FW', '이력서 저장 시도', { userId });
    setIsLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        experience: formData.experience,
        introduction: formData.introduction,
        region_province: formData.regionProvince,
        region_city: formData.regionCity,
        is_active: formData.isActive
      };
      
      const result = await FA_MANAGE_RESUME_FLOW('SAVE', userId, payload);

      if (result.success) {
        alert('이력서가 성공적으로 저장되었습니다.');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        alert(result.message || '저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('시스템 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl relative overflow-hidden group">
      {/* Decorative Gradient Background */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl group-hover:bg-purple-200/50 transition-all duration-700"></div>
      
      <div className="relative z-10 space-y-8">
        <div className="flex items-center gap-3 border-b border-purple-100 pb-4">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
            <FileText className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-purple-900 italic tracking-tight">RESUME EDITOR</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">나를 알리는 매력적인 한 줄</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              이력서 제목 (한 줄 홍보)
            </Label>
            <Input
              placeholder="예: 성실하고 밝은 성격의 신입 웨이터입니다!"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="bg-gray-50/50 border-gray-200 text-gray-900 font-bold h-12 rounded-2xl focus:ring-purple-500/50 text-sm"
            />
          </div>

          {/* Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3 h-3 text-purple-500" />
                희망 근무지 (시/도)
              </Label>
              <select 
                value={formData.regionProvince}
                onChange={(e) => setFormData({...formData, regionProvince: e.target.value})}
                className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 font-bold h-12 rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none text-sm"
              >
                <option value="">시/도 선택</option>
                <option value="서울">서울특별시</option>
                <option value="경기">경기도</option>
                <option value="인천">인천광역시</option>
                <option value="부산">부산광역시</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3 h-3 text-purple-500" />
                희망 근무지 (시/군/구)
              </Label>
              <Input
                placeholder="예: 강남구, 분당구"
                value={formData.regionCity}
                onChange={(e) => setFormData({...formData, regionCity: e.target.value})}
                className="bg-gray-50/50 border-gray-200 text-gray-900 font-bold h-12 rounded-2xl focus:ring-purple-500/50 text-sm"
              />
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-3 h-3 text-purple-500" />
              업무 경력
            </Label>
            <Textarea
              placeholder="주요 경력을 적어주세요 (예: OO식당 1년, XX카페 6개월)"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              className="bg-gray-50/50 border-gray-200 text-gray-900 font-bold rounded-2xl focus:ring-purple-500/50 text-sm min-h-[100px]"
            />
          </div>

          {/* Introduction */}
          <div className="space-y-2">
            <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                자기 소개
            </Label>
            <Textarea
              placeholder="사장님께 어필할 수 있는 자신의 강점을 적어주세요."
              value={formData.introduction}
              onChange={(e) => setFormData({...formData, introduction: e.target.value})}
              className="bg-gray-50/50 border-gray-200 text-gray-900 font-bold rounded-2xl focus:ring-purple-500/50 text-sm min-h-[150px]"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="w-5 h-5 rounded border-gray-300 bg-white text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <div className="flex flex-col">
              <Label htmlFor="isActive" className="text-purple-900 font-black text-sm cursor-pointer select-none">구직 활동 중</Label>
              <p className="text-gray-500 text-[11px] font-medium">체크 시 업체 검색 결과에 노출됩니다.</p>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (
              <div className="flex items-center justify-center gap-2">
                <Save size={18} />
                프로필 저장하기
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
