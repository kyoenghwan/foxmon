'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MarqueeText } from '@/components/ui/marquee-text';
import { FileText, Plus, ArrowLeft, Loader2, Save, Upload, Trash2, Eye, EyeOff, Pencil } from 'lucide-react';
import { manageResumeAction, manageSeekerAdAction } from '@/lib/actions';
import { ResumeData } from '@/src/atoms/oa/resume/OA_UPSERT_RESUME';

type ResumeFormState = Partial<ResumeData> & { desired_industries?: string[] };
import { SeekerAdData } from '@/src/atoms/qa/resume/QA_GET_USER_SEEKER_ADS';
import { QA_GET_COMMON_CODES, CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { nvLog } from '@/lib/logger';
import { cn } from '@/lib/utils';
import {
  applyOtherIndustryText,
  buildFlatIndustryOptions,
  formatDesiredIndustries,
  getCustomOtherIndustry,
  isDesiredIndustrySelected,
  isOtherIndustryChecked,
  MAX_DESIRED_INDUSTRIES,
  normalizeDesiredIndustries,
  OTHER_INDUSTRY_CODE,
  OTHER_INDUSTRY_LABEL,
  parseDesiredIndustries,
} from '@/lib/resume-industry';
import {
  formatDesiredLocations,
  isSigunguAllSelected,
  isSigunguSelected,
  MAX_DESIRED_SIGUNGU,
  normalizeDesiredLocation,
  parseDesiredLocations,
  SIGUNGU_ALL_LABEL,
} from '@/lib/resume-location';
import { buildUnifiedTagOptions, isTagSelected } from '@/lib/tag-options';
import {
  appendEmptySnsRow,
  buildResumeSnsPayload,
  resumeSnsSelectValue,
  resumeToSnsRows,
  type ResumeSnsFormRow,
} from '@/lib/resume-sns';

/** 이력서 폼 주요 블록 구분 (테두리·배경) */
const RESUME_FORM_SECTION_CLASS =
  'rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm p-4 md:p-6 space-y-4';

function resolveSalaryTypeValue(type: string | undefined, salaryTypes: CodeItem[]) {
  if (!type) return '';
  const match = salaryTypes.find((s) => s.code_value === type || s.code_name === type);
  return match?.code_value ?? type;
}

function isNegotiableSalaryType(type: string | undefined, salaryTypes: CodeItem[]) {
  if (!type) return false;
  const match = salaryTypes.find((s) => s.code_value === type || s.code_name === type);
  if (match) {
    return match.code_value === 'NEGOTIATE' || match.code_name.includes('협의');
  }
  return type === '협의' || type.includes('협의');
}

function formatPayAmount(amount?: number) {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return '';
  return amount.toLocaleString('ko-KR');
}

function parsePayAmountInput(value: string): number | undefined {
  const raw = value.replace(/[^0-9]/g, '');
  if (!raw) return undefined;
  const num = parseInt(raw, 10);
  return Number.isNaN(num) ? undefined : num;
}

export function ResumeManagementModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'RESUME' | 'AD'>('RESUME');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [seekerAds, setSeekerAds] = useState<SeekerAdData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ResumeFormState>({});
  const [adFormView, setAdFormView] = useState<boolean>(false);
  const [adFormData, setAdFormData] = useState<Partial<SeekerAdData>>({});

  // Master Data
  const [regions, setRegions] = useState<CodeItem[]>([]);
  const [industryOptions, setIndustryOptions] = useState<CodeItem[]>([]);
  const [salaryTypes, setSalaryTypes] = useState<CodeItem[]>([]);
  const [keywordsList, setKeywordsList] = useState<CodeItem[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigungus, setSelectedSigungus] = useState<string[]>([]);
  const [otherIndustryText, setOtherIndustryText] = useState('');
  const [snsRows, setSnsRows] = useState<ResumeSnsFormRow[]>([{ type: '', value: '' }]);

  useEffect(() => {
    const fetchMasterData = async () => {
      const res = await QA_GET_COMMON_CODES(undefined, true);
      if (res.success && res.data) {
        setRegions(res.data.filter(c => c.list_type === 'JOB_REGION_1' || c.list_type === 'JOB_REGION_2'));
        const category1 = res.data.filter((c) => c.list_type === 'CATEGORY_1');
        const category2 = res.data.filter((c) => c.list_type === 'CATEGORY_2');
        setIndustryOptions(buildFlatIndustryOptions(category1, category2));
        setSalaryTypes(res.data.filter(c => c.list_type === 'SALARY_TYPE').sort((a, b) => a.sort_order - b.sort_order));
        setKeywordsList(buildUnifiedTagOptions(res.data));
      }
    };
    fetchMasterData();
  }, []);

  const selectedPayType = resolveSalaryTypeValue(formData.desired_pay_type, salaryTypes);
  const isPayNegotiable = isNegotiableSalaryType(formData.desired_pay_type, salaryTypes);

  useEffect(() => {
    const { sido, sigungus } = parseDesiredLocations(formData.desired_location);
    setSelectedSido(sido);
    setSelectedSigungus(sigungus);
  }, [formData.desired_location]);

  const syncDesiredLocation = (sido: string, sigungus: string[]) => {
    setFormData((prev) => ({
      ...prev,
      desired_location: formatDesiredLocations(sido, sigungus),
    }));
  };

  const handleSidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sido = e.target.value;
    setSelectedSido(sido);
    setSelectedSigungus([]);
    syncDesiredLocation(sido, []);
  };

  const toggleSigungu = (name: string, checked: boolean) => {
    let next = [...selectedSigungus];
    if (name === SIGUNGU_ALL_LABEL) {
      next = checked ? [SIGUNGU_ALL_LABEL] : next.filter((s) => s !== SIGUNGU_ALL_LABEL);
    } else if (checked) {
      next = next.filter((s) => s !== SIGUNGU_ALL_LABEL);
      if (next.includes(name)) return;
      if (next.length >= MAX_DESIRED_SIGUNGU) {
        alert(`시/군/구는 최대 ${MAX_DESIRED_SIGUNGU}개까지만 선택할 수 있습니다.`);
        return;
      }
      next.push(name);
    } else {
      next = next.filter((s) => s !== name);
    }
    setSelectedSigungus(next);
    syncDesiredLocation(selectedSido, next);
  };

  const sigunguAllSelected = isSigunguAllSelected(selectedSigungus);
  const hasSpecificSigungu = selectedSigungus.some((s) => s !== SIGUNGU_ALL_LABEL);

  const isOtherIndustryOption = (item: CodeItem) =>
    item.code_value === OTHER_INDUSTRY_CODE || item.code_name === OTHER_INDUSTRY_LABEL;

  const handleOtherIndustryTextChange = (text: string) => {
    setOtherIndustryText(text);
    const current =
      formData.desired_industries ?? parseDesiredIndustries(formData.desired_industry);
    if (!isOtherIndustryChecked(current, industryOptions)) return;
    setFormData({
      ...formData,
      desired_industries: applyOtherIndustryText(current, text, industryOptions),
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
      fetchAds();
    } else {
      // reset state when closed
      setViewMode('LIST');
      setFormData({});
      setSelectedSido('');
      setSelectedSigungus([]);
      setOtherIndustryText('');
      setSnsRows([{ type: '', value: '' }]);
      setActiveTab('RESUME');
    }
  }, [isOpen]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      nvLog('FW', '이력서 목록 호출 시작');
      const res = await manageResumeAction('GET');
      if (res.success && (res as any).data) {
        setResumes((res as any).data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const res = await manageSeekerAdAction('GET');
      if (res.success && (res as any).data) {
        setSeekerAds((res as any).data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenForm = async (resume?: ResumeData) => {
    if (resume) {
      const desiredIndustries = parseDesiredIndustries(resume.desired_industry);
      setFormData({
        ...resume,
        desired_industries: desiredIndustries,
      });
      setOtherIndustryText(getCustomOtherIndustry(desiredIndustries, industryOptions));
      setSnsRows(resumeToSnsRows(resume));
      setViewMode('FORM');
    } else {
      setLoading(true);
      try {
        const res = await manageResumeAction('GET_DEFAULTS');
        setFormData({
          title: '',
          is_contact_public: false,
          is_anytime_contact: false,
          gender: (res as any).data?.gender || 'F',
          contact_number: (res as any).data?.phone_number || ''
        });
        setSnsRows([{ type: '', value: '' }]);
      } catch (err) {
        console.error(err);
        setFormData({ title: '', is_contact_public: false, is_anytime_contact: false });
        setSnsRows([{ type: '', value: '' }]);
      } finally {
        setLoading(false);
        setViewMode('FORM');
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('사진은 5MB 이하로 업로드해주세요.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
        alert('이력서 제목은 필수입니다.');
        return;
    }
    setSaving(true);
    try {
      const industries = normalizeDesiredIndustries(
        formData.desired_industries ?? formData.desired_industry
      );
      const { desired_industries: _omit, ...rest } = formData;
      const snsPart = buildResumeSnsPayload(snsRows);
      const payload: ResumeData = {
        ...(rest as ResumeData),
        desired_location: normalizeDesiredLocation(formData.desired_location) || undefined,
        desired_industry: formatDesiredIndustries(industries) || undefined,
        sns_links: snsPart.sns_links,
        sns_type: snsPart.sns_type,
        sns_id: snsPart.sns_id,
      };
      const res = await manageResumeAction('SAVE', payload);
      if (res.success) {
        alert('저장되었습니다.');
        setViewMode('LIST');
        fetchResumes(); // refresh list
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    if (!resume.id) return;
    if (!confirm('이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    setDeleting(resume.id);
    try {
      const res = await manageResumeAction('DELETE', resume);
      if (res.success) {
        fetchResumes();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAdStatus = async (ad: any) => {
    setDeleting(ad.id); // Reusing deleting state as loading
    try {
      const newStatus = ad.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await manageSeekerAdAction('SAVE', {
        id: ad.id,
        resume_id: ad.resume_id || (ad.resumes as any)?.id,
        ad_title: ad.ad_title,
        status: newStatus
      });
      if (res.success) {
        setSeekerAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublic = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    if (!resume.id) return;
    
    try {
      const res = await manageResumeAction('TOGGLE_PUBLIC', {
        ...resume,
        is_public: !resume.is_public,
        ad_title: null // 더 이상 이력서 테이블에서 관리하지 않음
      });
      if (res.success) {
        // 로컬 상태 즉시 업데이트
        setResumes(prev => prev.map(r => 
          r.id === resume.id ? { ...r, is_public: !r.is_public, ad_title: null } : r
        ));
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdSave = async () => {
    if (!adFormData.resume_id) {
        alert('이력서를 선택해주세요.');
        return;
    }
    if (!adFormData.ad_title) {
        alert('구직글 제목을 입력해주세요.');
        return;
    }
    setSaving(true);
    try {
      const res = await manageSeekerAdAction('SAVE', adFormData);
      if (res.success) {
        alert('구직글이 등록되었습니다.');
        setAdFormView(false);
        setAdFormData({});
        fetchAds(); // refresh list
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdDelete = async (e: React.MouseEvent, ad: SeekerAdData) => {
    e.stopPropagation();
    if (!window.confirm('정말 구직글을 내리시겠습니까? (이력서는 삭제되지 않습니다)')) return;
    setDeleting(ad.id);
    try {
      const res = await manageSeekerAdAction('DELETE', { id: ad.id } as any);
      if (res.success) {
        fetchAds();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="h-full w-max flex items-center gap-1.5 px-5 text-[13px] sm:text-[14px] font-black text-white bg-primary hover:bg-orange-600 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0 flex-nowrap" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <FileText className="w-4 h-4 shrink-0" />
          <span style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>이력서&nbsp;관리</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col bg-white overflow-hidden p-0">
        <DialogHeader className="px-6 py-5 border-b flex-shrink-0">
          <DialogTitle className="font-black text-xl flex items-center gap-2">
            {(viewMode === 'FORM' || adFormView) && (
              <button onClick={() => { setViewMode('LIST'); setAdFormView(false); }} className="hover:bg-gray-100 p-1 rounded-full transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {viewMode === 'FORM' ? '📝 이력서 작성/수정' : adFormView ? '📢 구직글 등록' : activeTab === 'RESUME' ? '📝 이력서 관리' : '📢 구직글 관리'}
          </DialogTitle>
          {viewMode === 'LIST' && !adFormView && (
            <div className="flex border-b border-gray-100 mt-4 gap-4">
              <button onClick={() => setActiveTab('RESUME')} className={`pb-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'RESUME' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>내 이력서 보관함</button>
              <button onClick={() => setActiveTab('AD')} className={`pb-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'AD' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>인재정보 구직글</button>
            </div>
          )}
          <DialogDescription className="font-medium text-gray-500 mt-3">
            {viewMode === 'LIST' && !adFormView
              ? activeTab === 'RESUME' 
                  ? '기존에 등록된 이력서를 선택하거나 새로 등록하세요.' 
                  : '작성된 이력서를 바탕으로 인재정보 게시판에 구직 광고를 올릴 수 있습니다.'
              : viewMode === 'FORM'
                  ? '빈틈없이 꼼꼼하게 채워 지원율을 높이세요!'
                  : '원하는 이력서를 선택하고 구직 게시판에 올릴 제목을 입력하세요.'}
          </DialogDescription>
          {viewMode === 'LIST' && !adFormView && activeTab === 'RESUME' && (
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-2 font-medium">
              💡 이력서를 <strong>공개</strong>로 설정하면, 업체에서 사장님을 열람했을 때 이력서를 볼 수 있게 됩니다.
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 scrollbar-hide">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="font-bold text-sm">이력서를 불러오는 중입니다...</p>
            </div>
          ) : viewMode === 'LIST' && !adFormView ? (
            <div className="flex flex-col gap-4">
              {activeTab === 'RESUME' ? (
                resumes.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-gray-800">아직 등록된 이력서가 없어요</h3>
                      <p className="text-sm font-medium text-gray-500 mt-1">강력한 이력서를 등록하고 알바 합격률을 2배로 올려보세요!</p>
                    </div>
                    <Button onClick={() => handleOpenForm()} className="rounded-xl px-8 font-black mt-2">
                      <Plus className="w-4 h-4 mr-1" /> 새 이력서 등록하기
                    </Button>
                  </div>
                ) : (
                  <>
                    {resumes.map(r => (
                      <div key={r.id || r.title} className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 hover:border-primary hover:shadow-md transition-all group">
                        {/* 1행: 업데이트 · 지역 */}
                        <p className="text-xs md:text-sm text-gray-500 font-medium">
                          업데이트: {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '방금'} · {r.desired_location || '지역 미기재'}
                        </p>
                        {/* 2행: 제목(좌) · 버튼(우 정렬) */}
                        <div className="mt-2 flex items-start gap-2">
                          <div
                            className="min-w-0 flex-1 cursor-pointer pr-1"
                            title={r.title || undefined}
                            onClick={() => handleOpenForm(r)}
                            role="button"
                            tabIndex={0}
                            aria-label={`이력서 수정: ${r.title || '제목 없음'}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenForm(r);
                              }
                            }}
                          >
                            <MarqueeText className="font-black text-base md:text-lg text-gray-900 group-hover:text-primary transition-colors text-left">
                              {r.title}
                            </MarqueeText>
                          </div>
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleTogglePublic(e, r)}
                              className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold border transition-all ${
                                r.is_public
                                  ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                              }`}
                              title={r.is_public ? '공개 중 (클릭하여 비공개)' : '비공개 (클릭하여 공개)'}
                            >
                              {r.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              {r.is_public ? '공개' : '비공개'}
                            </button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full shadow-sm shrink-0"
                              onClick={() => handleOpenForm(r)}
                              aria-label="이력서 수정"
                              title="이력서 수정"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, r)}
                              disabled={deleting === r.id}
                              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 shrink-0"
                              title="이력서 삭제"
                            >
                              {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button onClick={() => handleOpenForm()} variant="ghost" className="border-2 border-dashed border-gray-300 rounded-2xl py-8 font-black text-gray-500 hover:text-primary hover:border-primary transition-all hover:bg-primary/5">
                      <Plus className="w-5 h-5 mr-2" /> 추가 이력서 등록 (새로 작성)
                    </Button>
                  </>
                )
              ) : (
                // AD TAB CONTENT
                seekerAds.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-gray-800">등록된 구직글이 없어요</h3>
                      <p className="text-sm font-medium text-gray-500 mt-1">인재정보 게시판에 나를 알리고 스카우트 제안을 받아보세요!</p>
                    </div>
                    <Button onClick={() => { if(resumes.length === 0) { alert('먼저 이력서를 작성해주세요!'); setActiveTab('RESUME'); } else { setAdFormView(true); } }} className="rounded-xl px-8 font-black mt-2">
                      <Plus className="w-4 h-4 mr-1" /> 새 구직글 등록하기
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden w-full overflow-x-auto">
                        <table className="w-full min-w-[600px] text-center text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                                <tr>
                                    <th className="py-3.5 px-4 w-[40%] text-left">제목</th>
                                    <th className="py-3.5 px-2 w-[15%]">상태</th>
                                    <th className="py-3.5 px-2 w-[25%]">연결된 이력서</th>
                                    <th className="py-3.5 px-2 w-[15%]">작성일</th>
                                    <th className="py-3.5 px-2 w-[5%]">삭제</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {seekerAds.map(ad => {
                                    const dateObj = new Date(ad.created_at || new Date());
                                    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                                    const isStatusActive = ad.status === 'ACTIVE';
                                    
                                    return (
                                        <tr key={ad.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-4 px-4 text-left">
                                                <button 
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        router.push(`/seekers/${ad.id}`);
                                                    }}
                                                    className="font-extrabold text-gray-900 truncate max-w-[200px] hover:text-primary hover:underline transition-colors text-left focus:outline-none cursor-pointer"
                                                >
                                                    {ad.ad_title}
                                                </button>
                                            </td>
                                            <td className="py-4 px-2">
                                                <button 
                                                    onClick={() => handleToggleAdStatus(ad)}
                                                    disabled={deleting === ad.id}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-[12px] font-bold tracking-tight transition-colors focus:outline-none cursor-pointer",
                                                        isStatusActive 
                                                            ? "bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105 active:scale-95" 
                                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105 active:scale-95"
                                                    )}
                                                    title={isStatusActive ? "클릭 시 구직 완료로 변경" : "클릭 시 다시 구직 중으로 변경"}
                                                >
                                                    {deleting === ad.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : (isStatusActive ? '구직 중' : '구직 완료')}
                                                </button>
                                            </td>
                                            <td className="py-4 px-2 text-gray-600 font-medium truncate max-w-[150px]">
                                                {(ad.resumes as any)?.title || '알 수 없음'}
                                            </td>
                                            <td className="py-4 px-2 text-gray-400 font-medium text-[13px]">
                                                {dateStr}
                                            </td>
                                            <td className="py-4 px-2 flex justify-center items-center">
                                                <Button 
                                                    variant="ghost"
                                                    onClick={(e) => handleAdDelete(e, ad)}
                                                    disabled={deleting === ad.id}
                                                    className="w-8 h-8 p-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                                                    title="구직글 삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Button onClick={() => setAdFormView(true)} variant="ghost" className="border-2 border-dashed border-gray-300 rounded-2xl py-8 font-black text-gray-500 hover:text-primary hover:border-primary transition-all hover:bg-primary/5 mt-4">
                      <Plus className="w-5 h-5 mr-2" /> 새 구직글 추가 등록
                    </Button>
                  </>
                )
              )}
            </div>
          ) : adFormView ? (
            <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col gap-6">
                <section>
                  <h3 className="font-black border-l-3 border-primary pl-2.5 mb-3 text-gray-800 text-sm md:text-base">구직글 올리기</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">어떤 이력서를 사용할까요?</label>
                      <select
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        value={adFormData.resume_id || ''}
                        onChange={(e) => setAdFormData(prev => ({ ...prev, resume_id: e.target.value }))}
                      >
                        <option value="" disabled>이력서를 선택해주세요</option>
                        {resumes.map(r => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">구직 게시판에 노출될 제목</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="예) 성실하게 열심히 일하겠습니다!"
                        value={adFormData.ad_title || ''}
                        onChange={(e) => setAdFormData(prev => ({ ...prev, ad_title: e.target.value }))}
                      />
                    </div>
                  </div>
                </section>
                <div className="mt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 py-6 rounded-xl font-bold text-base" onClick={() => setAdFormView(false)}>
                    취소
                  </Button>
                  <Button className="flex-1 py-6 rounded-xl font-black text-base" onClick={handleAdSave} disabled={saving}>
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                      <><Save className="w-5 h-5 mr-2" /> 인재정보 등록하기</>
                    )}
                  </Button>
                </div>
            </div>
          ) : (
            <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-col gap-4 md:p-6 md:gap-6">
              {/* 제목 (모바일: 라벨 옆 인라인) */}
              <section className={RESUME_FORM_SECTION_CLASS}>
                <div className="flex flex-row items-center gap-2 md:flex-col md:items-stretch">
                  <label className="text-base font-black text-gray-800 shrink-0 whitespace-nowrap md:text-lg md:mb-2 md:block">
                    <span className="text-primary">*</span>{' '}
                    <span className="md:hidden">제목</span>
                    <span className="hidden md:inline">이력서 제목</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="flex-1 min-w-0 h-9 px-2.5 py-1 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-bold placeholder-gray-400 md:w-full md:h-auto md:p-4 md:border-2 md:rounded-xl md:focus:ring-4 md:text-lg"
                    placeholder="예: 성실하고 책임감 있는 20대..."
                  />
                </div>
              </section>

              {/* 사진 및 기본정보 Section */}
              <section className={RESUME_FORM_SECTION_CLASS}>
                <h3 className="font-black border-l-3 border-primary pl-2.5 text-gray-800 text-sm md:text-base">기본 정보</h3>
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                  {/* 왼쪽: 사진 첨부 */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <div className="relative group cursor-pointer w-24 h-32 md:w-32 md:h-40 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-primary transition-colors">
                      {formData.photo_url ? (
                          <img src={formData.photo_url} alt="Uploaded Photo" className="w-full h-full object-cover" />
                      ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                            <Upload className="w-6 h-6" />
                            <span className="text-[11px] font-bold">사진 등록</span>
                          </div>
                      )}
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                          title="사진 변경하기"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] text-gray-500 font-medium leading-tight">(5MB 이하 이미지 권장)</p>
                      {formData.photo_url && (
                        <Button variant="ghost" className="h-6 px-3 text-xs mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 p-0" onClick={() => setFormData({...formData, photo_url: undefined})}>사진 삭제</Button>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 기본정보 폼 */}
                  <div className="flex-1 flex flex-col gap-5">
                    <div>
                      <div className="flex flex-row items-center gap-2 md:flex-col md:items-stretch">
                        <label className="text-sm font-bold text-gray-700 shrink-0 whitespace-nowrap md:mb-1.5 md:block">
                          <span className="text-primary">*</span> 이름/닉네임
                        </label>
                        <input type="text" value={formData.nickname || ''} onChange={e => setFormData({...formData, nickname: e.target.value})} className="flex-1 min-w-0 h-9 px-2.5 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium bg-gray-50/50 md:w-full md:h-auto md:p-3" placeholder="활동할 이름이나 닉네임" />
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-row items-center gap-2 md:flex-col md:items-stretch">
                        <label className="text-sm font-bold text-gray-700 shrink-0 whitespace-nowrap md:mb-1.5 md:block">
                          <span className="text-primary">*</span>{' '}
                          <span className="md:hidden">성별/출생</span>
                          <span className="hidden md:inline">성별 / 출생연도</span>
                        </label>
                        <div className="flex-1 min-w-0 flex gap-1 items-center bg-gray-50/50 border border-gray-200 p-1 rounded-lg md:gap-2 md:p-2">
                          <div className="flex gap-1.5 px-1 border-r border-gray-200 md:gap-3 md:px-2">
                            <label className="flex items-center gap-0.5 cursor-pointer font-medium text-[11px] text-gray-700 hover:text-primary transition-colors md:gap-1.5 md:text-sm">
                              <input type="radio" value="F" checked={formData.gender === 'F'} onChange={e => setFormData({...formData, gender: 'F'})} className="accent-primary w-3.5 h-3.5 md:w-4 md:h-4" /> 여성
                            </label>
                            <label className="flex items-center gap-0.5 cursor-pointer font-medium text-[11px] text-gray-700 hover:text-primary transition-colors md:gap-1.5 md:text-sm">
                              <input type="radio" value="M" checked={formData.gender === 'M'} onChange={e => setFormData({...formData, gender: 'M'})} className="accent-primary w-3.5 h-3.5 md:w-4 md:h-4" /> 남성
                            </label>
                          </div>
                          <div className="flex items-center gap-0.5 flex-1 min-w-0 px-0.5 md:gap-1.5 md:px-1">
                            <input
                              type="number"
                              value={formData.birth_year || ''}
                              onChange={e => setFormData({...formData, birth_year: parseInt(e.target.value) || undefined})}
                              placeholder="1995"
                              className="w-full min-w-0 h-7 px-1 bg-white border border-gray-200 rounded focus:border-primary outline-none transition-colors text-xs font-bold text-center md:h-auto md:p-1.5 md:text-sm"
                            />
                            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap md:text-xs">년생</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium md:text-[11px] md:mt-1.5 md:ml-1">※ 작성 후 목록에서는 나이로 자동 변환되어 노출됩니다.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 연락처 및 SNS Section */}
              <section className={RESUME_FORM_SECTION_CLASS}>
                <h3 className="font-black border-l-3 border-primary pl-2.5 text-gray-800 text-sm md:text-base">연락처 및 SNS</h3>
                <div className="flex flex-col gap-4 md:gap-6">
                    <div>
                      <div className="flex flex-row items-center gap-2 md:flex-col md:items-stretch">
                        <label className="text-sm font-bold text-gray-700 shrink-0 whitespace-nowrap md:mb-2 md:block">연락처</label>
                        <input type="text" value={formData.contact_number || ''} onChange={e => setFormData({...formData, contact_number: e.target.value})} placeholder="010-0000-0000" className="flex-1 min-w-0 h-9 px-2.5 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium bg-white md:h-auto md:p-3" />
                        <label className="flex items-center gap-1 shrink-0 whitespace-nowrap text-xs font-bold text-gray-700 cursor-pointer hover:text-primary transition-colors md:gap-2 md:text-sm md:bg-white md:border md:border-gray-200 md:p-3 md:rounded-lg">
                          <input type="checkbox" checked={formData.is_contact_public} onChange={e => setFormData({...formData, is_contact_public: e.target.checked})} className="accent-primary w-3.5 h-3.5 rounded md:w-4 md:h-4" />
                          <span className="md:hidden">공개</span>
                          <span className="hidden md:inline">연락처 공개</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-row items-start justify-between gap-2 mb-2 md:items-center">
                        <label className="text-sm font-bold text-gray-700 shrink-0">SNS 계정 (선택)</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-bold shrink-0 border-primary/40 text-primary hover:bg-primary/5"
                          onClick={() => {
                            const next = appendEmptySnsRow(snsRows);
                            if (!next) {
                              alert('SNS는 최대 10개까지 등록할 수 있습니다.');
                              return;
                            }
                            setSnsRows(next);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-0.5" />
                          추가
                        </Button>
                      </div>
                      <div className="flex flex-col gap-3">
                        {snsRows.map((row, idx) => {
                          const selectVal = resumeSnsSelectValue(row.type);
                          const showCustomType = selectVal === '기타';
                          return (
                            <div key={idx} className="flex flex-wrap items-center gap-2">
                              <select
                                value={selectVal}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setSnsRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, type: v === '기타' ? '' : v } : r
                                    )
                                  );
                                }}
                                className="w-[88px] h-9 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium bg-white cursor-pointer md:w-[120px] md:h-auto md:p-3"
                              >
                                <option value="">선택</option>
                                <option value="카카오톡">카카오톡</option>
                                <option value="라인">라인</option>
                                <option value="텔레그램">텔레그램</option>
                                <option value="인스타그램">인스타그램</option>
                                <option value="기타">직접입력</option>
                              </select>
                              {showCustomType && (
                                <input
                                  type="text"
                                  placeholder="종류"
                                  value={row.type}
                                  onChange={(e) =>
                                    setSnsRows((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, type: e.target.value } : r))
                                    )
                                  }
                                  className="w-[72px] h-9 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium bg-white md:w-[100px] md:h-auto md:p-3"
                                />
                              )}
                              <input
                                type="text"
                                value={row.value}
                                onChange={(e) =>
                                  setSnsRows((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                                  )
                                }
                                placeholder="아이디 입력"
                                className="flex-1 min-w-[120px] h-9 px-2.5 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium bg-white md:h-auto md:p-3"
                              />
                              {snsRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSnsRows((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 shrink-0"
                                  aria-label="SNS 행 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                </div>
              </section>

              {/* 근무 조건 Section */}
              <section className={RESUME_FORM_SECTION_CLASS}>
                <h3 className="font-black border-l-3 border-primary pl-2.5 text-gray-800 text-sm md:text-base">근무 조건</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="sm:col-span-2">
                    <div className="flex flex-row items-center gap-2 md:flex-col md:items-stretch mb-2">
                      <label className="text-sm font-bold text-gray-700 shrink-0 whitespace-nowrap md:mb-2 md:block">지역</label>
                      <select
                        value={selectedSido}
                        onChange={handleSidoChange}
                        className="flex-1 min-w-0 h-9 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium bg-white cursor-pointer md:max-w-xs md:h-auto md:p-3"
                      >
                        <option value="">시/도 선택</option>
                        {regions.filter((r) => !r.parent_code_value).map((sido) => (
                          <option key={sido.code_value} value={sido.code_name}>
                            {sido.code_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedSido === '해외' ? (
                      <input
                        type="text"
                        value={selectedSigungus[0] ?? ''}
                        onChange={(e) => {
                          const detail = e.target.value;
                          setSelectedSigungus(detail ? [detail] : []);
                          syncDesiredLocation('해외', detail ? [detail] : []);
                        }}
                        placeholder="국가 및 지역 입력 (예: 미국)"
                        className="w-full mt-2 h-9 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium bg-white md:h-auto md:p-3"
                      />
                    ) : selectedSido ? (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                          (시/군/구는 {MAX_DESIRED_SIGUNGU}개까지 선택 가능합니다.)
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
                          {regions
                            .filter((r) => {
                              const sido = regions.find(
                                (s) => s.code_name === selectedSido && !s.parent_code_value
                              );
                              return r.parent_code_value === sido?.code_value;
                            })
                            .map((sigungu) => {
                              const isAllOption = sigungu.code_name === SIGUNGU_ALL_LABEL;
                              const disabled =
                                (sigunguAllSelected && !isAllOption) ||
                                (hasSpecificSigungu && isAllOption);
                              return (
                                <label
                                  key={sigungu.code_value}
                                  className={cn(
                                    'flex items-center gap-1.5 min-w-0',
                                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSigunguSelected(selectedSigungus, sigungu.code_name)}
                                    disabled={disabled}
                                    onChange={(e) =>
                                      toggleSigungu(sigungu.code_name, e.target.checked)
                                    }
                                    className="accent-primary w-3.5 h-3.5 sm:w-4 sm:h-4 rounded shrink-0 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-[11px] sm:text-sm font-medium text-gray-700 truncate">
                                    {sigungu.code_name}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-bold text-gray-700">업종</label>
                      <span className="text-xs text-gray-500 font-medium">
                        (업종은 {MAX_DESIRED_INDUSTRIES}개까지 선택 가능합니다.)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                        {industryOptions.map((item) => (
                          <label key={item.code_value} className="flex items-center gap-1.5 cursor-pointer min-w-0">
                            <input
                              type="checkbox"
                              checked={
                                isOtherIndustryOption(item)
                                  ? isOtherIndustryChecked(
                                      formData.desired_industries,
                                      industryOptions
                                    )
                                  : isDesiredIndustrySelected(
                                      formData.desired_industries,
                                      item.code_value,
                                      item.code_name
                                    )
                              }
                              onChange={(e) => {
                                const current =
                                  formData.desired_industries ??
                                  parseDesiredIndustries(formData.desired_industry);
                                if (isOtherIndustryOption(item)) {
                                  if (e.target.checked) {
                                    if (
                                      !isOtherIndustryChecked(current, industryOptions) &&
                                      current.length >= MAX_DESIRED_INDUSTRIES
                                    ) {
                                      alert(
                                        `업종은 최대 ${MAX_DESIRED_INDUSTRIES}개까지만 선택할 수 있습니다.`
                                      );
                                      return;
                                    }
                                    setOtherIndustryText('');
                                    setFormData({
                                      ...formData,
                                      desired_industries: applyOtherIndustryText(
                                        current,
                                        '',
                                        industryOptions
                                      ),
                                    });
                                  } else {
                                    setOtherIndustryText('');
                                    const custom = getCustomOtherIndustry(
                                      current,
                                      industryOptions
                                    );
                                    setFormData({
                                      ...formData,
                                      desired_industries: current.filter(
                                        (v) =>
                                          v !== item.code_value &&
                                          v !== item.code_name &&
                                          v !== custom
                                      ),
                                    });
                                  }
                                  return;
                                }
                                const selected = isDesiredIndustrySelected(
                                  current,
                                  item.code_value,
                                  item.code_name
                                );
                                if (e.target.checked) {
                                  if (!selected && current.length >= MAX_DESIRED_INDUSTRIES) {
                                    alert(
                                      `업종은 최대 ${MAX_DESIRED_INDUSTRIES}개까지만 선택할 수 있습니다.`
                                    );
                                    return;
                                  }
                                  if (!selected) {
                                    const normalized = current.filter(
                                      (v) => v !== item.code_value && v !== item.code_name
                                    );
                                    setFormData({
                                      ...formData,
                                      desired_industries: [...normalized, item.code_name],
                                    });
                                  }
                                } else {
                                  setFormData({
                                    ...formData,
                                    desired_industries: current.filter(
                                      (v) => v !== item.code_value && v !== item.code_name
                                    ),
                                  });
                                }
                              }}
                              className="accent-primary w-3.5 h-3.5 sm:w-4 sm:h-4 rounded shrink-0"
                            />
                            <span className="text-[11px] sm:text-sm font-medium text-gray-700 truncate">
                              {item.code_name}
                            </span>
                          </label>
                        ))}
                        {industryOptions.length === 0 && (
                          <span className="col-span-3 text-sm text-gray-400 font-medium py-2">
                            업종을 불러오는 중...
                          </span>
                        )}
                    </div>
                    {isOtherIndustryChecked(formData.desired_industries, industryOptions) && (
                      <input
                        type="text"
                        value={otherIndustryText}
                        onChange={(e) => handleOtherIndustryTextChange(e.target.value)}
                        placeholder="업종을 직접 입력해 주세요"
                        className="w-full mt-2 h-9 px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium bg-white md:h-auto md:p-3"
                      />
                    )}
                  </div>

                  {/* 급여 */}
                  <div className="sm:col-span-2">
                    <div className="flex flex-row items-center gap-2 md:flex-col md:items-stretch">
                      <label className="text-sm font-bold text-gray-700 shrink-0 whitespace-nowrap md:mb-2 md:block">
                        <span className="md:hidden">급여</span>
                        <span className="hidden md:inline">원하는 급여</span>
                      </label>
                      <div className="flex flex-1 min-w-0 gap-1.5 md:gap-2">
                        <select
                            value={selectedPayType || salaryTypes[0]?.code_value || ''}
                            onChange={e => {
                                const next = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  desired_pay_type: next,
                                  ...(isNegotiableSalaryType(next, salaryTypes) ? { desired_pay_amount: undefined } : {}),
                                }));
                            }}
                            className="w-[72px] shrink-0 h-9 px-1.5 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs font-medium bg-white cursor-pointer md:w-[120px] md:h-auto md:p-3 md:text-sm"
                        >
                            {salaryTypes.length > 0 ? (
                              salaryTypes.map((item) => (
                                <option key={item.code_value} value={item.code_value}>
                                  {item.code_name}
                                </option>
                              ))
                            ) : (
                              <option value="">로딩 중...</option>
                            )}
                        </select>
                        <div className="flex flex-1 min-w-0 items-center gap-1">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatPayAmount(formData.desired_pay_amount)}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    desired_pay_amount: parsePayAmountInput(e.target.value),
                                  })
                                }
                                disabled={isPayNegotiable}
                                placeholder={isPayNegotiable ? '협의' : '금액'}
                                className="w-full min-w-0 h-9 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium bg-white disabled:bg-gray-50 disabled:text-gray-400 md:h-auto md:p-3"
                            />
                            {!isPayNegotiable && <span className="text-xs font-bold text-gray-700 flex-shrink-0 md:text-sm">원</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex flex-row items-center gap-2 md:flex-col md:items-stretch">
                      <label className="text-sm font-bold text-gray-700 shrink-0 whitespace-nowrap md:mb-2 md:block">
                        <span className="md:hidden">연락시간</span>
                        <span className="hidden md:inline">연락 가능 시간</span>
                      </label>
                      <div className="flex flex-1 min-w-0 items-center gap-1.5 bg-gray-50/50 border border-gray-200 p-1.5 pl-2 rounded-lg md:gap-4 md:p-2 md:pl-3">
                      <input 
                        type="text" 
                        value={formData.contact_time || ''} 
                        disabled={formData.is_anytime_contact} 
                        onChange={e => setFormData({...formData, contact_time: e.target.value})} 
                        placeholder="예: 오후 2시 ~ 오후 8시" 
                        className="flex-1 min-w-0 h-8 px-1 bg-transparent outline-none disabled:text-gray-400 text-sm font-medium md:h-auto md:p-2" 
                      />
                      <label className="flex items-center gap-1 shrink-0 whitespace-nowrap text-xs font-bold text-gray-600 cursor-pointer hover:text-primary transition-colors md:gap-2 md:text-sm md:bg-white md:border md:border-gray-200 md:p-2 md:rounded-lg">
                        <input 
                          type="checkbox" 
                          checked={formData.is_anytime_contact} 
                          onChange={e => setFormData({...formData, is_anytime_contact: e.target.checked})} 
                          className="accent-primary w-4 h-4 rounded" 
                        /> 
                        상관없음
                      </label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 키워드 Section */}
              <section className={RESUME_FORM_SECTION_CLASS}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black border-l-3 border-primary pl-2.5 text-gray-800 text-sm md:text-base">키워드</h3>
                  <span className="text-xs text-gray-500 font-medium">
                    (키워드·혜택은 3개까지 선택 가능합니다.)
                  </span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-200/80">
                  {keywordsList.map((item) => (
                    <label key={item.code_value} className="flex items-center gap-1.5 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={isTagSelected(formData.keywords, item)}
                        onChange={(e) => {
                          const current = formData.keywords || [];
                          const selected = isTagSelected(current, item);
                          if (e.target.checked) {
                            if (!selected && current.length >= 3) {
                              alert('키워드는 최대 3개까지만 선택할 수 있습니다.');
                              return;
                            }
                            if (!selected) {
                              const normalized = current.filter(
                                (k) => k !== item.code_value && k !== item.code_name
                              );
                              setFormData({ ...formData, keywords: [...normalized, item.code_value] });
                            }
                          } else {
                            setFormData({
                              ...formData,
                              keywords: current.filter(
                                (k) => k !== item.code_value && k !== item.code_name
                              ),
                            });
                          }
                        }}
                        className="accent-primary w-3.5 h-3.5 sm:w-4 sm:h-4 rounded shrink-0"
                      />
                      <span className="text-[11px] sm:text-sm font-medium text-gray-700 truncate">{item.code_name}</span>
                    </label>
                  ))}
                  {keywordsList.length === 0 && (
                    <span className="col-span-3 text-sm text-gray-400 font-medium py-2">키워드를 불러오는 중...</span>
                  )}
                </div>
              </section>

              {/* 자기소개 Section */}
              <section className={RESUME_FORM_SECTION_CLASS}>
                <h3 className="font-black border-l-3 border-primary pl-2.5 text-gray-800 text-sm md:text-base">자기소개 및 경력 상세</h3>
                <div>
                  <textarea rows={5} value={formData.self_introduction || ''} onChange={e => setFormData({...formData, self_introduction: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-primary outline-none transition-colors text-sm font-medium resize-none leading-relaxed md:p-3 md:border-2 md:border-gray-100 md:rounded-xl" placeholder="이전 알바 경험, 본인의 특장점, 마음가짐 등을 자유롭고 자세하게 적어주시면 채용 확률이 200% 상승합니다!" />
                </div>
              </section>
            </div>
          )}
        </div>
        
        {viewMode === 'FORM' && (
          <div className="p-4 border-t bg-white flex justify-end gap-3 flex-shrink-0 shadow-[-0px_-10px_20px_rgba(0,0,0,0.02)]">
            <Button onClick={() => setViewMode('LIST')} variant="outline" className="font-bold h-12 px-6 rounded-xl border-gray-200">취소</Button>
            <Button onClick={handleSave} disabled={saving} className="font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
              이력서 저장하기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
