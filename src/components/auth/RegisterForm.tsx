'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { nvLog } from '@/lib/logger';
import { FA_REGISTER_FLOW } from '@/src/atoms/fa/auth/FA_REGISTER_FLOW';
import { FA_CHECK_DUPLICATE_FLOW } from '@/src/atoms/fa/auth/FA_CHECK_DUPLICATE_FLOW';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleSelector } from './RoleSelector';
import { AgeVerificationBox } from './AgeVerificationBox';
import { ChevronLeft, ChevronRight, Check, Loader2, ArrowLeft } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Auth, 2: Role, 3: TOS, 4: Info, 5: Business
  const [role, setRole] = useState<'EMPLOYER' | 'GENERAL' | null>(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
    sms: true
  });
  const [verifiedData, setVerifiedData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    nationality: 'KOREAN' as 'KOREAN' | 'FOREIGNER',
  });
  
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: '',
    business_name: '',
    representative_name: '',
    business_number: '',
    business_category: '',
    opening_date: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateChecked, setDuplicateChecked] = useState({ id: false, nickname: false });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const checkId = async () => {
    if (!formData.loginId) return alert('아이디를 입력해주세요.');
    const result = await FA_CHECK_DUPLICATE_FLOW({ loginId: formData.loginId });
    if (!result.success && result.duplicateType === 'ID') {
      alert('이미 사용 중인 아이디입니다.');
    } else if (result.success) {
      alert('사용 가능한 아이디입니다.');
      setDuplicateChecked(prev => ({ ...prev, id: true }));
    } else {
      alert('오류가 발생했습니다.');
    }
  };

  const checkNickname = async () => {
    if (!formData.nickname) return alert('닉네임을 입력해주세요.');
    const result = await FA_CHECK_DUPLICATE_FLOW({ nickname: formData.nickname });
    if (!result.success && result.duplicateType === 'NICKNAME') {
      alert('이미 사용 중인 닉네임입니다.');
    } else if (result.success) {
      alert('사용 가능한 닉네임입니다.');
      setDuplicateChecked(prev => ({ ...prev, nickname: true }));
    } else {
      alert('오류가 발생했습니다.');
    }
  };

  const validateStep4 = () => {
    if (!formData.loginId) {
      setError('아이디를 입력해주세요.');
      return false;
    }
    if (!duplicateChecked.id) {
      setError('아이디 중복 확인을 해주세요.');
      return false;
    }
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (!formData.nickname) {
      setError('닉네임을 입력해주세요.');
      return false;
    }
    if (!duplicateChecked.nickname) {
      setError('닉네임 중복 확인을 해주세요.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;
    
    if (step === 5 && role === 'EMPLOYER') {
      if (!formData.business_name || !formData.business_number || !formData.representative_name) {
        setError('필수 사업자 정보를 입력해주세요.');
        return;
      }
    }
    
    nvLog('FW', '회원가입 요청 (ID기반)', { loginId: formData.loginId, role });
    setIsLoading(true);
    setError(null);

    try {
      const result = await FA_REGISTER_FLOW({
        ...formData,
        ...verifiedData,
        role: role!,
        is_age_verified: isAgeVerified,
        smsConsent: agreements.sms, // TOS에서 받은 동의값 사용
      });

      if (result.success) {
        nvLog('FW', '회원가입 성공 -> 자동 로그인 시도');
        // 가입 성공 즉시 로그인 처리
        await signIn('credentials', {
          loginId: formData.loginId,
          password: formData.password,
          redirect: true,
          callbackUrl: '/',
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeVerifySuccess = (data: { 
    name: string; 
    birthDate: string;
    gender: string;
    phoneNumber: string; 
    nationality: 'KOREAN' | 'FOREIGNER' 
  }) => {
    setVerifiedData(data);
    setIsAgeVerified(true);
    handleNext();
  };

  const totalSteps = role === 'EMPLOYER' ? 5 : 4;
  
  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-500">
      
      {/* Back Button */}
      <button 
          onClick={() => {
              if (step > 1) {
                  handlePrev();
              } else {
                  router.push('/age-gate');
              }
          }}
          type="button"
          className="absolute top-5 left-5 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-purple-100 text-gray-500 hover:text-purple-700 transition-all shadow-sm backdrop-blur-md border border-purple-100"
          title={step > 1 ? "이전 단계로 가기" : "초기화면으로 돌아가기"}
      >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Brand Header */}
      <div className="bg-gradient-to-b from-purple-100 via-purple-50/50 to-white px-8 pt-10 pb-8 flex flex-col items-center gap-2 border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <h1 className="text-[34px] font-extrabold tracking-tighter text-purple-900 italic relative z-10 drop-shadow-sm">FOXMON</h1>
        <p className="text-purple-600 text-[11px] font-black tracking-widest uppercase relative z-10">신뢰할 수 있는 구인구직</p>
      </div>

      <div className="p-6 md:p-10 space-y-8">
        {/* Progress Stepper */}
        <div className="flex justify-between items-center px-2 md:px-4">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const s = i + 1;
            const isActive = step === s;
            const isDone = step > s;
            return (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-sm ${
                  isActive ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/30" : 
                  isDone ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/30" : "bg-gray-50 border-gray-200 text-gray-400"
                }`}>
                  {isDone ? <Check size={14} strokeWidth={3} /> : s}
                </div>
                {s < totalSteps && <div className={`w-4 md:w-8 h-[3px] mx-1 md:mx-2 rounded-full transition-colors ${isDone ? "bg-green-500" : "bg-gray-100"}`} />}
              </div>
            );
          })}
        </div>

        <div className="min-h-[400px]">
          {/* STEP 1: Auth */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-purple-900 italic tracking-tight">STEP 1: 본인 인증 정보 입력</h3>
                <p className="text-gray-500 text-sm font-medium">서비스 이용을 위해 휴대폰 본인인증이 필요합니다.</p>
              </div>
              <AgeVerificationBox onVerifySuccess={handleAgeVerifySuccess} />
            </div>
          )}

          {/* STEP 2: Role */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-black text-purple-900 italic tracking-tight text-center">STEP 2: 회원 유형 선택</h3>
              <RoleSelector selectedRole={role} onSelect={(r) => {
                setRole(r);
                handleNext();
              }} />
              <Button variant="ghost" className="text-gray-500 hover:text-purple-700 min-h-[48px] w-full font-bold" onClick={handlePrev}>
                <ChevronLeft className="mr-2" size={16} /> 본인인증 다시하기
              </Button>
            </div>
          )}

          {/* STEP 3: TOS (NEW) */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-purple-900 italic tracking-tight">STEP 3: 이용약관 동의</h3>
                <p className="text-gray-500 text-sm font-medium">서비스 이용을 위한 필수 약관에 동의해 주세요.</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3 p-1">
                    <input 
                      type="checkbox" 
                      id="all_agree"
                      checked={agreements.service && agreements.privacy && agreements.sms}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAgreements({ service: val, privacy: val, sms: val });
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <Label htmlFor="all_agree" className="text-sm font-black text-gray-900 cursor-pointer">전체 약관에 동의합니다.</Label>
                  </div>
                  
                  <div className="h-px bg-gray-200 mx-1" />

                  {[
                    { id: 'service', label: '[필수] 서비스 이용약관 동의', required: true },
                    { id: 'privacy', label: '[필수] 개인정보 수집 및 이용 동의', required: true },
                    { id: 'sms', label: '[선택] SMS 마케팅 수신 및 알림 동의', required: false },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id={item.id}
                          checked={agreements[item.id as keyof typeof agreements]}
                          onChange={(e) => setAgreements({...agreements, [item.id]: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <Label htmlFor={item.id} className={`text-xs font-bold cursor-pointer ${item.required ? 'text-gray-700' : 'text-gray-500'}`}>
                          {item.label}
                        </Label>
                      </div>
                      <button type="button" className="text-[10px] text-gray-400 underline underline-offset-2 hover:text-purple-600">보기</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="h-14 font-bold text-gray-500 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 flex-1 rounded-2xl" onClick={handlePrev}>
                  <ChevronLeft className="mr-1" size={18} /> 이전
                </Button>
                <Button 
                  type="button" 
                  disabled={!agreements.service || !agreements.privacy}
                  onClick={handleNext}
                  className="flex-[2] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 transition-all text-base disabled:opacity-50 disabled:grayscale"
                >
                  동의하고 다음으로 <ChevronRight className="ml-1" size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Info */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-black text-purple-900 italic uppercase tracking-tight">STEP 4: 계정 정보 입력</h3>
                <p className="text-gray-500 text-xs font-medium">일부 정보는 본인인증 데이터로 자동 채워집니다.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">아이디 <span className="text-purple-600">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="4~15자 영문/숫자"
                      value={formData.loginId}
                      onChange={(e) => {
                        setFormData({...formData, loginId: e.target.value});
                        setDuplicateChecked(prev => ({ ...prev, id: false }));
                      }}
                      className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl flex-1 focus-visible:ring-purple-500/50 text-sm font-bold"
                    />
                    <Button 
                      type="button" 
                      onClick={checkId} 
                      className={`h-11 rounded-xl px-4 text-[10px] font-black transition-all shrink-0 ${
                        duplicateChecked.id 
                          ? "bg-green-500 text-white" 
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                      }`}
                    >
                      {duplicateChecked.id ? "확인완료" : "중복확인"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">비밀번호 <span className="text-purple-600">*</span></Label>
                  <Input
                    type="password"
                    placeholder="4~12자 입력"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">비밀번호 확인 <span className="text-purple-600">*</span></Label>
                  <Input
                    type="password"
                    placeholder="비밀번호 다시 입력"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">닉네임 <span className="text-purple-600">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="활발한 닉네임"
                      value={formData.nickname}
                      onChange={(e) => {
                        setFormData({...formData, nickname: e.target.value});
                        setDuplicateChecked(prev => ({ ...prev, nickname: false }));
                      }}
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl flex-1 text-sm font-bold"
                    />
                    <Button 
                      type="button" 
                      onClick={checkNickname} 
                      className={`h-11 rounded-xl px-4 text-[10px] font-black transition-all shrink-0 ${
                        duplicateChecked.nickname 
                          ? "bg-green-500 text-white" 
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                      }`}
                    >
                      {duplicateChecked.nickname ? "확인완료" : "중복확인"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">이메일 (선택)</Label>
                  <Input
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="py-2 border-t border-gray-50 border-dashed space-y-3 pt-4 mt-2">
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                    <Label className="text-gray-400 text-[11px] font-black uppercase">이름 <span className="text-purple-600">*</span></Label>
                    <div className="h-10 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center px-4 text-purple-400 text-sm font-bold italic">
                      {verifiedData.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                    <Label className="text-gray-400 text-[11px] font-black uppercase">생년월일/성별 <span className="text-purple-600">*</span></Label>
                    <div className="h-10 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center px-4 text-gray-400 text-sm font-medium gap-3">
                      <span>{verifiedData.birthDate}</span>
                      <span className="w-px h-3 bg-gray-200" />
                      <span>{verifiedData.gender === 'MALE' ? '남성' : '여성'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                    <Label className="text-gray-400 text-[11px] font-black uppercase">휴대폰 <span className="text-purple-600">*</span></Label>
                    <div className="h-10 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center px-4 text-gray-400 text-sm font-medium">
                      {verifiedData.phoneNumber}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold animate-in fade-in">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                <Button type="button" variant="ghost" className="h-14 font-bold text-gray-500 flex-1 rounded-2xl" onClick={handlePrev}>
                  <ChevronLeft size={18} /> 이전
                </Button>
                {role === 'EMPLOYER' ? (
                  <Button type="button" className="flex-[2] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg transition-all text-base" onClick={() => { if (validateStep4()) handleNext(); }}>
                    사업자 정보 입력 <ChevronRight size={18} />
                  </Button>
                ) : (
                  <Button type="button" disabled={isLoading} onClick={handleSubmit} className="flex-[2] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg transition-all text-base">
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : '회원가입 완료'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Business */}
          {step === 5 && role === 'EMPLOYER' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-black text-purple-900 italic uppercase">STEP 5: 사업자 정보 기입</h3>
                <p className="text-gray-500 text-sm font-medium">사업자 인증용 정보를 입력해 주세요.</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">업종 선택</Label>
                  <select 
                    value={formData.business_category}
                    onChange={(e) => setFormData({...formData, business_category: e.target.value})}
                    className="w-full bg-gray-50/50 border border-gray-200 font-bold h-11 rounded-xl px-4 text-sm"
                  >
                    <option value="" disabled>업종을 선택하세요</option>
                    <option value="룸사롱">룸사롱</option>
                    <option value="단란주점">단란주점</option>
                    <option value="노래방">노래방</option>
                    <option value="카페">카페</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">상호명</Label>
                  <Input
                    placeholder="예: (주)폭스몬"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">대표자 성명</Label>
                  <Input
                    placeholder="사업자 등록증 기준"
                    value={formData.representative_name}
                    onChange={(e) => setFormData({...formData, representative_name: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">사업자 번호</Label>
                  <Input
                    placeholder="숫자 10자리"
                    value={formData.business_number}
                    onChange={(e) => setFormData({...formData, business_number: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">개업일자</Label>
                  <Input
                    placeholder="YYYYMMDD"
                    value={formData.opening_date}
                    onChange={(e) => setFormData({...formData, opening_date: e.target.value})}
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                <Button type="button" variant="ghost" className="h-14 font-bold text-gray-500 flex-1 rounded-2xl" onClick={handlePrev}>
                  <ChevronLeft size={18} /> 이전
                </Button>
                <Button type="button" disabled={isLoading} onClick={handleSubmit} className="flex-[2] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg transition-all text-base">
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : '최종 가입 완료하기'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
