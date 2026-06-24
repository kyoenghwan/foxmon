'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { nvLog } from '@/lib/logger';
import { FA_CHECK_DUPLICATE_FLOW } from '@/src/atoms/fa/auth/FA_CHECK_DUPLICATE_FLOW';
import { normalizeLoginId, RA_VALIDATE_LOGIN_ID } from '@/src/atoms/ra/auth/RA_LOGIN_ID';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RoleSelector } from './RoleSelector';
import { AgeVerificationBox } from './AgeVerificationBox';
import { ChevronLeft, ChevronRight, Check, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { getPolicy } from '@/lib/actions/policies';

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Auth, 2: Role, 3: TOS, 4: Info, 5: Business
  const [role, setRole] = useState<'EMPLOYER' | 'GENERAL' | null>(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  // 생년월일(YYYYMMDD) → 만 나이 + 연대 라벨 (예: "23 (20대초)")
  const getAgeLabel = (birthDate: string) => {
    if (!birthDate || birthDate.length !== 8) return '';
    const birthYear = parseInt(birthDate.substring(0, 4), 10);
    const birthMonth = parseInt(birthDate.substring(4, 6), 10);
    const birthDay = parseInt(birthDate.substring(6, 8), 10);
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthNow = today.getMonth() + 1;
    if (monthNow < birthMonth || (monthNow === birthMonth && today.getDate() < birthDay)) {
      age--;
    }
    const decade = Math.floor(age / 10) * 10;
    const remainder = age - decade;
    let sub = '초';
    if (remainder >= 7) sub = '후';
    else if (remainder >= 4) sub = '중';
    return `만 ${age}세 (${decade}대${sub}반)`;
  };

  // 휴대폰 번호 마스킹 (01012345678 → 010-****-5678)
  const maskPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length === 11) {
      return `${digits.substring(0, 3)}-****-${digits.substring(7)}`;
    }
    return phone;
  };
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
    sms: false
  });
  const [viewedPolicies, setViewedPolicies] = useState({
    service: false,
    privacy: false,
    sms: false
  });
  const [pendingAgreement, setPendingAgreement] = useState<string | string[] | 'all' | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyModalTitle, setPolicyModalTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState({
    name: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    nationality: 'KOREAN' as 'KOREAN' | 'FOREIGNER',
    ci: '',
  });

  useEffect(() => {
    // 이미 로그인 폼이나 연령게이트에서 본인인증을 통과했는지 확인
    const isAgeVerifiedCookie = typeof document !== 'undefined' && document.cookie.split('; ').some(row => row.startsWith('age_verified=true'));
    const storedUser = typeof window !== 'undefined' && sessionStorage.getItem('foxmon_verified_user');

    if (isAgeVerifiedCookie && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // 회원가입에는 phoneNumber가 필수이므로, 없으면 Step 1(본인인증)부터 시작
        if (parsed.name && parsed.birthDate && parsed.phoneNumber) {
          setVerifiedData(parsed);
          setIsAgeVerified(true);
          setStep(2);
        }
      } catch (e) {
        // 세션 복구 실패 시 Step 1부터 시작
      }
    }
  }, []);

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
    business_type: '비사업자',
    business_address: '',
    verification_doc_url: '',
    referrerLoginId: '', // 추천인 아이디 필드
  });

  const [referrerChecked, setReferrerChecked] = useState(false);
  const [referrerNickname, setReferrerNickname] = useState('');
  const [referrerError, setReferrerError] = useState<string | null>(null);

  const [docFile, setDocFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);
  const [duplicateChecked, setDuplicateChecked] = useState({ id: false, nickname: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleOpenPolicy = async (id: string, label: string, pendingTarget: string | 'all' | null = null) => {
    setViewedPolicies(prev => ({ ...prev, [id]: true }));
    setPendingAgreement(pendingTarget);
    const typeMap: Record<string, 'TERMS' | 'PRIVACY' | 'SMS'> = {
      service: 'TERMS',
      privacy: 'PRIVACY',
      sms: 'SMS'
    };
    
    setPolicyModalTitle(label);
    setPolicyContent('');
    setIsPolicyModalOpen(true);
    setIsPolicyLoading(true);
    try {
      const content = await getPolicy(typeMap[id] || 'TERMS');
      setPolicyContent(content);
    } catch (e) {
      setPolicyContent('약관을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsPolicyLoading(false);
    }
  };

  const handleOpenCombinedPolicies = async (ids: string[], pendingTarget: string | 'all' | null = null) => {
    setViewedPolicies(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id as keyof typeof next] = true; });
      return next;
    });
    setPendingAgreement(pendingTarget);

    const typeMap: Record<string, 'TERMS' | 'PRIVACY' | 'SMS'> = {
      service: 'TERMS',
      privacy: 'PRIVACY',
      sms: 'SMS'
    };
    const labelMap: Record<string, string> = {
      service: '[필수] 서비스 이용약관',
      privacy: '[필수] 개인정보 수집 및 이용',
      sms: '[선택] SMS 마케팅 수신 및 알림'
    };

    setPolicyModalTitle('통합 약관 보기');
    setPolicyContent('');
    setIsPolicyModalOpen(true);
    setIsPolicyLoading(true);

    try {
      const contents = await Promise.all(
        ids.map(async (id) => {
          const content = await getPolicy(typeMap[id] || 'TERMS');
          return `==========================================\n[ ${labelMap[id]} ]\n==========================================\n\n${content}\n\n`;
        })
      );
      setPolicyContent(contents.join('\n'));
    } catch (e) {
      setPolicyContent('약관을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsPolicyLoading(false);
    }
  };

  const handleAgreeFromModal = () => {
    if (pendingAgreement === 'all') {
      setAgreements({ service: true, privacy: true, sms: true });
    } else if (Array.isArray(pendingAgreement)) {
      setAgreements(prev => {
        const next = { ...prev };
        pendingAgreement.forEach(id => { next[id as keyof typeof next] = true; });
        return next;
      });
    } else if (typeof pendingAgreement === 'string') {
      setAgreements(prev => ({ ...prev, [pendingAgreement]: true }));
    }
    setIsPolicyModalOpen(false);
    setPendingAgreement(null);
  };

  const checkId = async () => {
    if (!formData.loginId) {
      setIdError('아이디를 입력해주세요.');
      return alert('아이디를 입력해주세요.');
    }
    const validation = RA_VALIDATE_LOGIN_ID(formData.loginId);
    if (!validation.isValid) {
      setIdError(validation.error || '올바르지 않은 아이디 형식입니다.');
      return alert(validation.error || '올바르지 않은 아이디 형식입니다.');
    }
    const result = await FA_CHECK_DUPLICATE_FLOW({ loginId: formData.loginId });
    if (!result.success) {
      const errMsg = result.message || '사용할 수 없는 아이디입니다.';
      setIdError(errMsg);
      alert(errMsg);
      setDuplicateChecked((prev) => ({ ...prev, id: false }));
    } else if (result.success) {
      setIdError(null);
      alert('사용 가능한 아이디입니다.');
      setDuplicateChecked(prev => ({ ...prev, id: true }));
    } else {
      setIdError('오류가 발생했습니다.');
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

  const checkReferrer = async () => {
    const refId = formData.referrerLoginId.trim().toLowerCase();
    if (!refId) return alert('추천인 아이디를 입력해주세요.');
    if (refId === formData.loginId.toLowerCase()) {
      setReferrerError('본인은 추천인으로 등록할 수 없습니다.');
      setReferrerChecked(false);
      setReferrerNickname('');
      return;
    }

    try {
      const res = await fetch(`/api/auth/check-referrer?loginId=${encodeURIComponent(refId)}`);
      const data = await res.json();
      if (data.success) {
        setReferrerNickname(data.nickname);
        setReferrerChecked(true);
        setReferrerError(null);
      } else {
        setReferrerError(data.message || '존재하지 않는 추천인 아이디입니다.');
        setReferrerChecked(false);
        setReferrerNickname('');
      }
    } catch (e) {
      alert('추천인 확인 중 오류가 발생했습니다.');
    }
  };

  const validateStep4 = () => {
    if (!formData.loginId) {
      setError('아이디를 입력해주세요.');
      setIdError('아이디를 입력해주세요.');
      return false;
    }
    const validation = RA_VALIDATE_LOGIN_ID(formData.loginId);
    if (!validation.isValid) {
      setError(validation.error || '올바르지 않은 아이디 형식입니다.');
      setIdError(validation.error || '올바르지 않은 아이디 형식입니다.');
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
    setIdError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    if (step === 5 && role === 'EMPLOYER') {
      if (!docFile) {
        setError('신분증 또는 사업자등록증 사본을 첨부해주세요.');
        return;
      }
      if (formData.business_type === '사업자' && !formData.business_address) {
        setError('실제 영업장 주소를 입력해주세요.');
        return;
      }
      if (formData.business_type === '사업자' && !formData.business_category) {
        setError('필수 사업자 정보(업종)를 선택해주세요.');
        return;
      }
    }

    nvLog('FW', '회원가입 요청 (ID기반)', { loginId: formData.loginId, role });
    setIsLoading(true);
    setError(null);

    try {
      let finalDocUrl = '';
      if (docFile) {
        const { uploadVerificationDocument } = await import('@/lib/actions/upload');
        const uploadFormData = new FormData();
        uploadFormData.append('file', docFile);
        const uploadResult = await uploadVerificationDocument(uploadFormData);
        if (!uploadResult.success) {
          setError(uploadResult.message || '파일 업로드에 실패했습니다.');
          setIsLoading(false);
          return;
        }
        finalDocUrl = uploadResult.url!;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: formData.loginId,
          password: formData.password,
          email: formData.email || null,
          name: verifiedData.name,
          nickname: formData.nickname,
          role: role!,
          birthDate: verifiedData.birthDate,
          gender: verifiedData.gender,
          phoneNumber: verifiedData.phoneNumber,
          nationality: verifiedData.nationality,
          is_age_verified: isAgeVerified,
          ci: verifiedData.ci || null,
          smsConsent: agreements.sms,
          business_name: formData.business_name || null,
          representative_name: formData.representative_name || null,
          business_number: formData.business_number || null,
          business_category: formData.business_category || null,
          opening_date: formData.opening_date || null,
          business_type: formData.business_type || '비사업자',
          business_address: formData.business_address || null,
          verification_doc_url: finalDocUrl || null,
          referrerLoginId: formData.referrerLoginId ? formData.referrerLoginId.trim() : null
        })
      });

      const result = await response.json();

      if (result.success) {
        nvLog('FW', '회원가입 성공 -> 자동 로그인 시도');

        // 세션 쿠키 발급 (PC방 보안 로직과 충돌되어 500에러/리디렉션 루프 빠지는 것을 방지)
        document.cookie = "foxmon_transient=1; path=/;";
        document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // 가입 성공 즉시 로그인 처리
        await signIn('credentials', {
          loginId: formData.loginId,
          password: formData.password,
          redirect: true,
          callbackUrl: '/',
        });
      } else {
        setError(result.message || '회원가입 중 오류가 발생했습니다.');
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
    nationality: 'KOREAN' | 'FOREIGNER';
    ci?: string;
  }) => {
    setVerifiedData({
      name: data.name,
      birthDate: data.birthDate,
      gender: data.gender,
      phoneNumber: data.phoneNumber,
      nationality: data.nationality,
      ci: data.ci || '',
    });
    setIsAgeVerified(true);
    // 회원가입 경로에서는 phoneNumber 포함하여 세션에 저장 (가입 완료 시 DB에 필요)
    sessionStorage.setItem('foxmon_verified_user', JSON.stringify(data));
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
        title={step > 1 ? "이전 단계로 가기" : "연령인증 화면으로 돌아가기"}
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Brand Header */}
      <div className="bg-gradient-to-b from-purple-100 via-purple-50/50 to-white px-4 pt-16 pb-10 md:pt-20 md:pb-12 flex flex-col items-center justify-center border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="relative z-10 w-[240px] md:w-[280px] flex justify-center">
          <Image 
            src="/foxmon_log.png" 
            alt="FOXMON" 
            width={1600} 
            height={400} 
            priority
            className="w-full h-auto object-contain"
          />
        </div>
        <p className="text-purple-600 text-base md:text-lg font-black tracking-widest uppercase relative z-10 mt-1 md:mt-2">신뢰할 수 있는 구인구직</p>
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-sm ${isActive ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/30" :
                    isDone ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/30" : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}>
                  {isDone ? <Check size={14} strokeWidth={3} /> : s}
                </div>
                {s < totalSteps && <div className={`w-4 md:w-8 h-[3px] mx-1 md:mx-2 rounded-full transition-colors ${isDone ? "bg-green-500" : "bg-gray-100"}`} />}
              </div>
            );
          })}
        </div>

        <div className="min-h-[300px] pb-4">
          {/* STEP 1: Auth */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
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
                        if (val) {
                          const unviewed = ['service', 'privacy'].filter(id => !viewedPolicies[id as keyof typeof viewedPolicies]);
                          if (unviewed.length > 0) {
                            alert('필수 약관의 내용을 모두 확인해주세요.');
                            if (unviewed.length === 1) {
                              const labelMap: Record<string, string> = {
                                service: '[필수] 서비스 이용약관 동의',
                                privacy: '[필수] 개인정보 수집 및 이용 동의'
                              };
                              handleOpenPolicy(unviewed[0], labelMap[unviewed[0]], 'all');
                            } else {
                              handleOpenCombinedPolicies(unviewed, 'all');
                            }
                            return;
                          }
                        }
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
                          onChange={(e) => {
                            if (e.target.checked && !viewedPolicies[item.id as keyof typeof viewedPolicies]) {
                              alert('해당 약관의 내용을 먼저 확인해주세요.');
                              handleOpenPolicy(item.id, item.label, item.id);
                              return;
                            }
                            setAgreements({ ...agreements, [item.id]: e.target.checked });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <Label htmlFor={item.id} className={`text-xs font-bold cursor-pointer ${item.required ? 'text-gray-700' : 'text-gray-500'}`}>
                          {item.label}
                        </Label>
                      </div>
                      <button type="button" onClick={() => handleOpenPolicy(item.id, item.label, item.id)} className="text-[10px] text-gray-400 underline underline-offset-2 hover:text-purple-600">보기</button>
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
                  <Label className="text-gray-600 text-[13px] font-black tracking-wider">아이디 <span className="text-purple-600">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="4~15자 영문 소문자·숫자"
                      value={formData.loginId}
                      onChange={(e) => {
                        const val = e.target.value;
                        const normalized = normalizeLoginId(val);
                        const hasInvalidChar = val.toLowerCase() !== val.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (hasInvalidChar) {
                          setIdError('영문 소문자와 숫자만 입력 가능합니다.');
                        } else {
                          setIdError(null);
                        }
                        setFormData({ ...formData, loginId: normalized });
                        setDuplicateChecked(prev => ({ ...prev, id: false }));
                      }}
                      autoComplete="off"
                      spellCheck={false}
                      className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-11 rounded-xl flex-1 focus-visible:ring-purple-500/50 text-sm font-bold"
                    />
                    <Button
                      type="button"
                      onClick={checkId}
                      className={`h-11 rounded-xl px-4 text-xs font-black transition-all shrink-0 ${duplicateChecked.id
                          ? "bg-green-500 text-white"
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                        }`}
                    >
                      {duplicateChecked.id ? "확인완료" : "중복확인"}
                    </Button>
                  </div>
                </div>
                {idError && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] gap-3 -mt-3 animate-in fade-in">
                    <div />
                    <span className="text-[11px] text-red-500 font-bold">✗ {idError}</span>
                  </div>
                )}

                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[13px] font-black tracking-wider">비밀번호 <span className="text-purple-600">*</span></Label>
                  <div className="relative w-full">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="4~12자 입력"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      autoComplete="new-password"
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[13px] font-black tracking-wider">비밀번호 확인 <span className="text-purple-600">*</span></Label>
                  <div className="relative w-full">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호 다시 입력"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      autoComplete="new-password"
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[13px] font-black tracking-wider">닉네임 <span className="text-purple-600">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="활발한 닉네임"
                      value={formData.nickname}
                      onChange={(e) => {
                        setFormData({ ...formData, nickname: e.target.value });
                        setDuplicateChecked(prev => ({ ...prev, nickname: false }));
                      }}
                      autoComplete="off"
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl flex-1 text-sm font-bold"
                    />
                    <Button
                      type="button"
                      onClick={checkNickname}
                      className={`h-11 rounded-xl px-4 text-xs font-black transition-all shrink-0 ${duplicateChecked.nickname
                          ? "bg-green-500 text-white"
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                        }`}
                    >
                      {duplicateChecked.nickname ? "확인완료" : "중복확인"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[13px] font-black tracking-wider">이메일 (선택)</Label>
                  <Input
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="off"
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                  <Label className="text-gray-600 text-[13px] font-black tracking-wider">추천인 (선택)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="추천인의 아이디 입력"
                      value={formData.referrerLoginId}
                      onChange={(e) => {
                        setFormData({ ...formData, referrerLoginId: normalizeLoginId(e.target.value) });
                        setReferrerChecked(false);
                        setReferrerNickname('');
                        setReferrerError(null);
                      }}
                      autoComplete="off"
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl flex-1 text-sm font-bold"
                    />
                    <Button
                      type="button"
                      onClick={checkReferrer}
                      className={`h-11 rounded-xl px-4 text-xs font-black transition-all shrink-0 ${referrerChecked
                          ? "bg-green-500 text-white"
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                        }`}
                    >
                      {referrerChecked ? "확인완료" : "추천인확인"}
                    </Button>
                  </div>
                </div>
                {referrerChecked && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] gap-3 -mt-3">
                    <div />
                    <span className="text-[11px] text-green-600 font-bold">✓ 확인 완료: {referrerNickname} 님</span>
                  </div>
                )}
                {referrerError && (
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] gap-3 -mt-3">
                    <div />
                    <span className="text-[11px] text-red-500 font-bold">✗ {referrerError}</span>
                  </div>
                )}

                <div className="py-2 border-t border-gray-50 border-dashed space-y-3 pt-4 mt-2">
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                    <Label className="text-gray-400 text-[13px] font-black">이름 <span className="text-purple-600">*</span></Label>
                    <div className="h-10 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center px-4 text-purple-400 text-sm font-bold italic">
                      {verifiedData.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                    <Label className="text-gray-400 text-[13px] font-black">생년월일/성별 <span className="text-purple-600">*</span></Label>
                    <div className="h-10 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center px-4 text-gray-400 text-sm font-medium gap-3">
                      <span>{verifiedData.birthDate}</span>
                      <span className="w-px h-3 bg-gray-200" />
                      <span>{verifiedData.gender === 'MALE' ? '남성' : '여성'}</span>
                      {verifiedData.birthDate && (
                        <>
                          <span className="w-px h-3 bg-gray-200" />
                          <span className="text-purple-500 font-bold">{getAgeLabel(verifiedData.birthDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[90px_1fr] md:grid-cols-[110px_1fr] items-center gap-3">
                    <Label className="text-gray-400 text-[13px] font-black">휴대폰 <span className="text-purple-600">*</span></Label>
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
                <h3 className="text-xl font-black text-purple-900 italic uppercase">STEP 5: 구인자 신원 확인</h3>
                <p className="text-gray-500 text-sm font-medium">안전한 직업정보 제공을 위해 실명 및 사업장 확인이 필수입니다.</p>
              </div>

              <div className="space-y-4">
                {/* 사업자 구분 */}
                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider shrink-0">사업자 구분</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="business_type"
                        value="사업자"
                        checked={formData.business_type === '사업자'}
                        onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="text-sm font-bold text-gray-800">사업자</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="business_type"
                        value="비사업자"
                        checked={formData.business_type === '비사업자'}
                        onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="text-sm font-bold text-gray-800">비사업자 (프리랜서/영업진)</span>
                    </label>
                  </div>
                </div>

                {/* 확인문서 첨부 */}
                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-900 text-[12px] font-black uppercase">확인문서 첨부 <span className="text-purple-600">*</span></Label>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {formData.business_type === '사업자' ? '사업자등록증/영업허가증' : '주민등록증/운전면허증'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                      <span>파일 선택</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDocFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <span className="text-sm text-gray-500 truncate flex-1">
                      {docFile ? docFile.name : '선택된 파일 없음'}
                    </span>
                  </div>
                  <p className="text-[10px] text-red-500 font-bold tracking-tight">※ 기업회원 심사를 위한 필수항목입니다. (허위 제출 시 가입 거절)</p>
                </div>

                {formData.business_type === '사업자' && (
                  <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">업종 선택</Label>
                    <select
                      value={formData.business_category}
                      onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
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
                )}

                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">회사/점포명</Label>
                  <Input
                    placeholder={formData.business_type === '사업자' ? "사업자등록증 상호명" : "실제 일하시는 가게 이름"}
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    autoComplete="off"
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider flex flex-col">
                    <span>사업장 주소 {formData.business_type === '사업자' && <span className="text-purple-600">*</span>}</span>
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder={formData.business_type === '사업자' ? "사업자등록증 상 주소" : "실제 근무하시는 가게 주소"}
                      value={formData.business_address}
                      onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                      autoComplete="off"
                      className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">대표자 성명</Label>
                  <Input
                    placeholder={formData.business_type === '사업자' ? "사업자등록증 대표자명" : "본인 이름 (또는 사장님 이름)"}
                    value={formData.representative_name}
                    onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                    autoComplete="off"
                    className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                  />
                </div>

                {formData.business_type === '사업자' && (
                  <>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">사업자 번호</Label>
                      <Input
                        placeholder="숫자 10자리"
                        value={formData.business_number}
                        onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                        autoComplete="off"
                        className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                      <Label className="text-gray-600 text-[11px] font-black uppercase tracking-wider">개업일자</Label>
                      <Input
                        placeholder="YYYYMMDD"
                        value={formData.opening_date}
                        onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                        autoComplete="off"
                        className="bg-gray-50/50 border-gray-200 h-11 rounded-xl text-sm"
                      />
                    </div>
                  </>
                )}
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
                  <Button type="button" disabled={isLoading} onClick={handleSubmit} className="flex-[2] h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg transition-all text-base">
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : '최종 가입 완료하기'}
                  </Button>
                </div>
              </div>
          )}
            </div>
      {/* Policy Modal */}
      <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-lg font-black text-gray-900 leading-tight">
              {policyModalTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              안전한 서비스 이용을 위한 내용입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {isPolicyLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">약관을 불러오는 중입니다...</p>
              </div>
            ) : (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                {policyContent}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { setIsPolicyModalOpen(false); setPendingAgreement(null); }} className="px-6 font-bold text-gray-500">
              닫기
            </Button>
            <Button type="button" onClick={handleAgreeFromModal} className="px-8 bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md">
              확인 및 동의하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
