'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Plus, ArrowLeft, Loader2, Save, Upload, User2, Trash2, Eye, EyeOff } from 'lucide-react';
import { manageResumeAction } from '@/lib/actions';
import { ResumeData } from '@/src/atoms/oa/resume/OA_UPSERT_RESUME';
import { QA_GET_COMMON_CODES, CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { nvLog } from '@/lib/logger';

export function ResumeManagementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ResumeData>>({});

  // Master Data
  const [regions, setRegions] = useState<CodeItem[]>([]);
  const [categories, setCategories] = useState<CodeItem[]>([]);
  const [selectedSido, setSelectedSido] = useState<string>('');
  const [selectedSigungu, setSelectedSigungu] = useState<string>('');
  const [isCustomSns, setIsCustomSns] = useState(false);

  useEffect(() => {
    const fetchMasterData = async () => {
      const res = await QA_GET_COMMON_CODES(undefined, true);
      if (res.success && res.data) {
        setRegions(res.data.filter(c => c.list_type === 'JOB_REGION_1' || c.list_type === 'JOB_REGION_2'));
        setCategories(res.data.filter(c => c.list_type === 'CATEGORY_1'));
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (formData.desired_location) {
      const parts = formData.desired_location.split(' ');
      if (parts.length >= 2) {
        setSelectedSido(parts[0]);
        setSelectedSigungu(parts.slice(1).join(' '));
      } else {
        setSelectedSido(parts[0]);
        setSelectedSigungu('');
      }
    } else {
      setSelectedSido('');
      setSelectedSigungu('');
    }
  }, [formData.desired_location]);

  const handleSidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sido = e.target.value;
    setSelectedSido(sido);
    setSelectedSigungu('');
    setFormData(prev => ({ ...prev, desired_location: sido }));
  };

  const handleSigunguChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sigungu = e.target.value;
    setSelectedSigungu(sigungu);
    setFormData(prev => ({ ...prev, desired_location: `${selectedSido} ${sigungu}`.trim() }));
  };

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    } else {
      // reset state when closed
      setViewMode('LIST');
      setFormData({});
      setSelectedSido('');
      setSelectedSigungu('');
    }
  }, [isOpen]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      nvLog('FW', '이력서 목록 호출 시작');
      const res = await manageResumeAction('GET');
      if (res.success && (res as any).resumes) {
        setResumes((res as any).resumes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = async (resume?: ResumeData) => {
    if (resume) {
      setFormData({ ...resume });
      setIsCustomSns(!!resume.sns_type && !['카카오톡', '라인', '텔레그램'].includes(resume.sns_type));
      setViewMode('FORM');
    } else {
      setLoading(true);
      setIsCustomSns(false);
      try {
        const res = await manageResumeAction('GET_DEFAULTS');
        setFormData({
          title: '',
          is_contact_public: false,
          is_anytime_contact: false,
          gender: (res as any).defaults?.gender || 'F',
          contact_number: (res as any).defaults?.phone_number || ''
        });
      } catch (err) {
        console.error(err);
        setFormData({ title: '', is_contact_public: false, is_anytime_contact: false });
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
      const res = await manageResumeAction('SAVE', formData as ResumeData);
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

  const handleTogglePublic = async (e: React.MouseEvent, resume: ResumeData) => {
    e.stopPropagation();
    if (!resume.id) return;
    
    let newAdTitle: string | null | undefined = resume.ad_title;
    if (!resume.is_public) {
      const inputTitle = window.prompt("구직 리스트에 노출될 제목을 입력해주세요.\n(빈칸으로 두시면 이력서 원래 제목이 사용됩니다.)", resume.ad_title || resume.title);
      if (inputTitle === null) return;
      newAdTitle = inputTitle.trim() === '' ? null : inputTitle.trim();
    }
    
    try {
      const res = await manageResumeAction('TOGGLE_PUBLIC', {
        ...resume,
        is_public: !resume.is_public,
        ad_title: newAdTitle
      });
      if (res.success) {
        // 로컬 상태 즉시 업데이트
        setResumes(prev => prev.map(r => 
          r.id === resume.id ? { ...r, is_public: !r.is_public, ad_title: newAdTitle } : r
        ));
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
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
            {viewMode === 'FORM' && (
               <button onClick={() => setViewMode('LIST')} className="hover:bg-gray-100 p-1 rounded-full transition">
                 <ArrowLeft className="w-5 h-5" />
               </button>
            )}
            📝 {viewMode === 'LIST' ? '이력서 보관함' : '이력서 작성/수정'}
          </DialogTitle>
          <DialogDescription className="font-medium text-gray-500">
            {viewMode === 'LIST' 
               ? '기존에 등록된 이력서를 선택하거나 새로 등록하세요.' 
               : '빈틈없이 꼼꼼하게 채워 지원율을 높이세요!'}
          </DialogDescription>
          {viewMode === 'LIST' && (
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-2 font-medium">
              💡 이력서를 <strong>공개</strong>하면 업체에서 인재 검색 시 노출되어 스카우트 제안을 받을 수 있습니다.
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 scrollbar-hide">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
               <Loader2 className="w-8 h-8 animate-spin" />
               <p className="font-bold text-sm">이력서를 불러오는 중입니다...</p>
             </div>
          ) : viewMode === 'LIST' ? (
            <div className="flex flex-col gap-4">
              {resumes.length === 0 ? (
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
                    <div key={r.id || r.title} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary hover:shadow-md transition-all group">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => handleOpenForm(r)}>
                          {r.photo_url ? (
                            <img src={r.photo_url} alt="Profile" className="w-12 h-12 object-cover rounded-full border bg-gray-50 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border text-gray-400 flex-shrink-0">
                              <User2 className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-black text-lg text-gray-900 group-hover:text-primary transition-colors truncate">{r.title}</h4>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                               업데이트: {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '방금'} | {r.desired_location || '희망지역 미기재'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* 공개/비공개 토글 */}
                          <button
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
                          {/* 수정하기 */}
                          <Button variant="outline" className="rounded-full shadow-sm text-xs h-8 whitespace-nowrap" onClick={() => handleOpenForm(r)}>수정하기</Button>
                          {/* 삭제 */}
                          <button
                            onClick={(e) => handleDelete(e, r)}
                            disabled={deleting === r.id}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
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
              )}
            </div>
          ) : (
            <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col gap-6">
              {/* 사진 첨부 Section (New) */}
              <section className="flex items-center gap-6 pb-2 border-b border-gray-100">
                <div className="relative group flex-shrink-0 cursor-pointer w-24 h-32 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                   {formData.photo_url ? (
                      <img src={formData.photo_url} alt="Uploaded Photo" className="w-full h-full object-cover" />
                   ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                         <Upload className="w-6 h-6" />
                         <span className="text-[10px] font-bold">사진 등록</span>
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
                <div>
                   <h3 className="font-black text-gray-800 text-lg">사진 또는 이미지 등록</h3>
                   <p className="text-xs text-gray-500 font-medium mt-1">단정하고 신뢰감을 주는 사진을 등록하면 채용 확률이 크게 높아집니다.<br/>(5MB 이하의 썸네일 이미지 파일 지원)</p>
                   {formData.photo_url && (
                     <Button variant="ghost" className="h-6 px-3 text-xs mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 p-0" onClick={() => setFormData({...formData, photo_url: undefined})}>사진 삭제</Button>
                   )}
                </div>
              </section>

              {/* 개인정보 Section */}
              <section>
                <h3 className="font-black border-l-4 border-primary pl-3 mb-4 text-gray-800 text-lg">기본 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5"><span className="text-primary">*</span> 이력서 제목</label>
                    <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none transition-colors text-sm font-medium" placeholder="예: 성실한 20대 지원자" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5"><span className="text-primary">*</span> 별명</label>
                    <input type="text" value={formData.nickname || ''} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none transition-colors text-sm font-medium" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">성별</label>
                    <div className="flex gap-4 p-2.5">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input type="radio" value="F" checked={formData.gender === 'F'} onChange={e => setFormData({...formData, gender: 'F'})} className="accent-primary w-4 h-4" /> 여성
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input type="radio" value="M" checked={formData.gender === 'M'} onChange={e => setFormData({...formData, gender: 'M'})} className="accent-primary w-4 h-4" /> 남성
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">연락처</label>
                    <div className="flex gap-2 items-center">
                       <input type="text" value={formData.contact_number || ''} onChange={e => setFormData({...formData, contact_number: e.target.value})} placeholder="010-0000-0000" className="w-full p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none transition-colors text-sm font-medium" />
                       <label className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-gray-600">
                         <input type="checkbox" checked={formData.is_contact_public} onChange={e => setFormData({...formData, is_contact_public: e.target.checked})} className="accent-primary w-4 h-4" /> 공개
                       </label>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">SNS 계정</label>
                    <div className="flex gap-2">
                      <select 
                        value={isCustomSns ? '기타' : (formData.sns_type || '')} 
                        onChange={e => {
                          if (e.target.value === '기타') {
                            setIsCustomSns(true);
                            setFormData({...formData, sns_type: ''});
                          } else {
                            setIsCustomSns(false);
                            setFormData({...formData, sns_type: e.target.value});
                          }
                        }}
                        className="w-1/3 p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none text-sm font-medium bg-white"
                      >
                        <option value="">SNS 선택</option>
                        <option value="카카오톡">카카오톡</option>
                        <option value="라인">라인</option>
                        <option value="텔레그램">텔레그램</option>
                        <option value="인스타그램">인스타그램</option>
                        <option value="기타">기타 (직접입력)</option>
                      </select>
                      {isCustomSns && (
                         <input 
                           type="text" 
                           placeholder="SNS 종류" 
                           value={formData.sns_type || ''} 
                           onChange={e => setFormData({...formData, sns_type: e.target.value})} 
                           className="w-1/3 p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none text-sm font-medium" 
                         />
                      )}
                      <input 
                        type="text" 
                        value={formData.sns_id || ''} 
                        onChange={e => setFormData({...formData, sns_id: e.target.value})} 
                        placeholder="아이디를 입력해주세요" 
                        className="flex-1 p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none text-sm font-medium" 
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 희망정보 Section */}
              <section>
                <h3 className="font-black border-l-4 border-primary pl-3 mb-4 text-gray-800 text-lg">희망 근무 조건</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">희망 지역</label>
                    <div className="flex gap-2">
                        <select
                            value={selectedSido}
                            onChange={handleSidoChange}
                            className="w-1/2 p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none text-sm font-medium bg-white"
                        >
                            <option value="">시/도 선택</option>
                            {regions.filter(r => !r.parent_code_value).map(sido => (
                                <option key={sido.code_value} value={sido.code_name}>{sido.code_name}</option>
                            ))}
                        </select>
                        <select
                            value={selectedSigungu}
                            onChange={handleSigunguChange}
                            disabled={!selectedSido}
                            className="w-1/2 p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none text-sm font-medium bg-white disabled:bg-gray-50"
                        >
                            <option value="">시/군/구 선택</option>
                            {regions.filter(r => {
                                const sido = regions.find(s => s.code_name === selectedSido && !s.parent_code_value);
                                return r.parent_code_value === sido?.code_value;
                            }).map(sigungu => (
                                <option key={sigungu.code_value} value={sigungu.code_name}>{sigungu.code_name}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">희망 업종</label>
                    <select
                        value={formData.desired_industry || ''}
                        onChange={e => setFormData({...formData, desired_industry: e.target.value})}
                        className="w-full p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none text-sm font-medium bg-white"
                    >
                        <option value="">업종 선택</option>
                        {categories.map(cat => (
                            <option key={cat.code_value} value={cat.code_name}>{cat.code_name}</option>
                        ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">연락 가능 시간</label>
                    <div className="flex items-center gap-4">
                      <input type="text" value={formData.contact_time || ''} disabled={formData.is_anytime_contact} onChange={e => setFormData({...formData, contact_time: e.target.value})} placeholder="오후 2시 ~ 오후 8시" className="w-full p-2.5 border-2 border-gray-100 rounded-lg focus:border-primary outline-none disabled:bg-gray-100 disabled:text-gray-400 text-sm font-medium" />
                      <label className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={formData.is_anytime_contact} onChange={e => setFormData({...formData, is_anytime_contact: e.target.checked})} className="accent-primary w-4 h-4" /> 상관없음
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* 키워드 Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-black border-l-4 border-primary pl-3 text-gray-800 text-lg">키워드</h3>
                  <span className="text-xs text-gray-500 font-medium">(키워드는 3개까지 선택 가능합니다.)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {['선불가능', '성형지원', '숙식제공', '경력우대', '당일지급', '초보가능', '파트타임', '주말알바', '당일알바', '주간알바', '투잡알바', '평일알바'].map((kw) => (
                    <label key={kw} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(formData.keywords || []).includes(kw)}
                        onChange={(e) => {
                           const current = formData.keywords || [];
                           if (e.target.checked) {
                             if (current.length >= 3) {
                               alert('키워드는 최대 3개까지만 선택할 수 있습니다.');
                               return;
                             }
                             setFormData({...formData, keywords: [...current, kw]});
                           } else {
                             setFormData({...formData, keywords: current.filter(k => k !== kw)});
                           }
                        }}
                        className="accent-primary w-4 h-4 rounded" 
                      />
                      <span className="text-sm font-medium text-gray-700">{kw}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* 자기소개 Section */}
              <section>
                <h3 className="font-black border-l-4 border-primary pl-3 mb-4 text-gray-800 text-lg">자기소개 및 경력 상세</h3>
                <div>
                   <textarea rows={6} value={formData.self_introduction || ''} onChange={e => setFormData({...formData, self_introduction: e.target.value})} className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-primary outline-none transition-colors text-sm font-medium resize-none leading-relaxed" placeholder="이전 알바 경험, 본인의 특장점, 마음가짐 등을 자유롭고 자세하게 적어주시면 채용 확률이 200% 상승합니다!" />
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
