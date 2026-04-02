'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { userSettingsAction } from '@/lib/actions';
import { Loader2, Settings, User, Link2, Lock, MessageCircle, Instagram, Send, Check, Upload } from 'lucide-react';

export function SettingsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    
    // Profile State
    const [initialNickname, setInitialNickname] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profileUrl, setProfileUrl] = useState('');
    const [autoLogin, setAutoLogin] = useState(false);
    
    // SNS State
    const [snsKakao, setSnsKakao] = useState('');
    const [snsInsta, setSnsInsta] = useState('');
    const [snsTelegram, setSnsTelegram] = useState('');
    
    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Status
    const [loadingData, setLoadingData] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    const [pwMessage, setPwMessage] = useState('');
    const [pwError, setPwError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchUserData();
            setAutoLogin(document.cookie.includes('foxmon_auto_login=1'));
        } else {
            resetFields();
        }
    }, [isOpen]);

    const handleAutoLoginToggle = (checked: boolean) => {
        setAutoLogin(checked);
        if (checked) {
            document.cookie = "foxmon_auto_login=1; path=/; max-age=2592000";
        } else {
            document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "foxmon_transient=1; path=/;"; // Ensure session token exists
        }
    };

    const resetFields = () => {
        setNickname('');
        setEmail('');
        setPhoneNumber('');
        setProfileUrl('');
        setSnsKakao('');
        setSnsInsta('');
        setSnsTelegram('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
        setError('');
        setPwMessage('');
        setPwError('');
    }

    const fetchUserData = async () => {
        setLoadingData(true);
        try {
            const res = await userSettingsAction('GET_PROFILE');
            if (res.success && res.data) {
                const data = res.data;
                setInitialNickname(data.nickname || '');
                setNickname(data.nickname || '');
                setEmail(data.email || '');
                setPhoneNumber(data.phone_number || '');
                setProfileUrl(data.profile_image_url || '');
                setSnsKakao(data.sns_kakao || '');
                setSnsInsta(data.sns_instagram || '');
                setSnsTelegram(data.sns_telegram || '');
            } else {
                setError('사용자 정보를 불러올 수 없습니다.');
            }
        } catch (err) {
            setError('데이터 로딩 중 오류가 발생했습니다.');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setMessage('');
        setError('');

        try {
            const result = await userSettingsAction('UPDATE_PROFILE', {
                profileData: {
                    nickname,
                    email,
                    phoneNumber,
                    profile_image_url: profileUrl,
                    sns_kakao: snsKakao,
                    sns_instagram: snsInsta,
                    sns_telegram: snsTelegram,
                    currentNickname: initialNickname
                }
            });

            if (result.success) {
                setMessage('설정이 저장되었습니다.');
                setInitialNickname(nickname);
                
                // 메인 화면의 프로필 이미지도 즉시 갱신되도록 이벤트 발행
                window.dispatchEvent(new Event('profile-updated'));
                
                // 3초 후 메시지 제거
                setTimeout(() => setMessage(''), 3000);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError('설정 수정 중 오류가 발생했습니다.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPwError('비밀번호를 모두 입력해주세요.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError('새 비밀번호와 확인이 일치하지 않습니다.');
            return;
        }
        
        setSavingPassword(true);
        setPwMessage('');
        setPwError('');

        try {
            const result = await userSettingsAction('CHANGE_PASSWORD', {
                passwordData: {
                    currentPassword,
                    newPassword
                }
            });

            if (result.success) {
                setPwMessage('비밀번호가 성공적으로 변경되었습니다.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                
                setTimeout(() => {
                    setPwMessage('');
                    setIsPasswordModalOpen(false);
                }, 1500);
            } else {
                setPwError(result.message);
            }
        } catch (err: any) {
            setPwError('비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            setSavingPassword(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 브라우저 뻗음 방지 (10MB 이상 컷)
        if (file.size > 10 * 1024 * 1024) {
            alert('사진은 10MB 이하로 업로드해주세요.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = (event) => {
            const img = new Image();
            img.onload = () => {
                // 프로필 사진용으로 충분한 최대 300px 너비/높이
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // 캔버스에 이미지 그리기 (리사이즈)
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // JPEG 포맷, 품질 80% (0.8) 로 압축하여 Base64로 변환
                    // 이렇게 하면 5MB 짜리가 20~30KB 내외로 줄어듭니다.
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setProfileUrl(compressedDataUrl);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button 
                    className="flex items-center justify-center w-9 h-9 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95"
                    title="회원 설정"
                >
                    <Settings className="w-[18px] h-[18px]" />
                </button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white flex flex-col max-h-[90vh] border-none rounded-2xl shadow-xl">
                {/* Header (Top Right Save Button included) */}
                <DialogHeader className="px-5 py-4 flex-shrink-0 bg-white z-10 border-b flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="font-extrabold text-lg flex items-center gap-2 text-gray-900">
                            <User className="w-4 h-4 text-[#F26E22]" /> 회원 상세 설정
                        </DialogTitle>
                        <DialogDescription className="font-medium text-[12px] text-gray-500 mt-0.5">
                            SNS 프로필과 계정 보안 정보를 관리하세요.
                        </DialogDescription>
                    </div>
                    
                    {/* Top Right Save Button */}
                    <Button 
                        onClick={handleSaveProfile} 
                        disabled={savingProfile || loadingData} 
                        className="bg-[#1A1F2C] hover:bg-black text-white px-5 font-bold rounded-lg h-9 shadow-sm shrink-0"
                    >
                        {savingProfile ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                        저장
                    </Button>
                </DialogHeader>

                {loadingData ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-2 py-20">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="font-bold text-sm">정보를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-5 py-2">
                        {message && <div className="bg-green-100 text-green-800 p-2 rounded-lg text-xs font-bold my-2 shadow-sm">{message}</div>}
                        {error && <div className="bg-red-100 text-red-800 p-2 rounded-lg text-xs font-bold my-2 shadow-sm">{error}</div>}

                        {/* SECTION 1: 회원 기본 정보 */}
                        <div className="py-4 border-b border-gray-100 relative">
                             <div className="absolute top-4 right-0 opacity-[0.15] w-14 h-4 pointer-events-none">
                                <img src="/logo.png" alt="" className="w-full h-full object-contain" />
                            </div>
                            
                            <h3 className="font-extrabold text-[#333333] text-[14px] mb-4 flex items-center gap-1.5">
                                <User className="w-4 h-4 text-gray-400 stroke-[2.5]" /> 회원 기본 정보
                            </h3>
                            
                            <div className="flex flex-col sm:flex-row gap-6 items-center">
                                {/* Left Side: Profile Image Upload */}
                                <div className="flex flex-col items-center shrink-0 sm:w-[110px]">
                                    <div className="relative group flex-shrink-0 cursor-pointer w-[100px] h-[100px] bg-[#F8F9FA] rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 flex flex-col items-center justify-center transition-colors hover:border-[#F26E22]">
                                        {profileUrl ? (
                                            <img src={profileUrl} alt="Profile" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1.5 text-gray-400 group-hover:text-[#F26E22] transition-colors p-1 text-center">
                                                <Upload className="w-6 h-6 stroke-[2]" />
                                                <span className="text-[10px] font-bold leading-tight">프로필 이미지<br/>등록</span>
                                            </div>
                                        )}
                                        <input 
                                            id="profile-upload-input"
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handlePhotoUpload} 
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                                            title="사진 추가/변경"
                                        />
                                    </div>
                                </div>
                                
                                {/* Right Side: Basic info inputs */}
                                <div className="flex-1 space-y-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">닉네임</label>
                                        <div className="relative flex-1">
                                            <input 
                                                type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-bold text-gray-800 py-1.5 focus:border-[#F26E22]" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">이메일</label>
                                        <input 
                                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-medium text-gray-800 focus:border-[#F26E22] flex-1" 
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">전화번호</label>
                                        <div className="flex items-center gap-1.5 flex-1 w-full">
                                            <input 
                                                type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-[#DBE9F4] rounded-md outline-none text-[13px] font-bold text-gray-700 bg-[#EBF2F8]" 
                                                placeholder="01000000000"
                                                readOnly
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => alert("전화번호 변경은 본인인증(PASS/SMS)이 필요합니다.\n현재 준비 중인 기능입니다.")}
                                                className="shrink-0 px-2 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-md text-[11px] font-bold hover:bg-gray-200 transition-colors"
                                            >
                                                휴대폰 재인증
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: SNS 계정 연결 */}
                        <div className="py-4 border-b border-gray-100 relative">
                             <div className="absolute top-4 right-0 opacity-[0.15] w-5 h-5 pointer-events-none">
                                <img src="/logo.png" alt="" className="w-full h-full object-contain" />
                            </div>
                            <h3 className="font-extrabold text-[#333333] text-[14px] mb-3 flex items-center gap-1.5">
                                <Link2 className="w-4 h-4 text-gray-400 stroke-[2.5]" /> SNS 계정 연결
                            </h3>
                            
                            <div className="space-y-2">
                                {/* 카카오톡 */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                                        <div className="w-5 h-5 rounded bg-[#FBE54D] flex items-center justify-center text-black">
                                            <MessageCircle className="w-3 h-3 fill-black stroke-black" />
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-600">카카오톡</span>
                                    </div>
                                    <input 
                                        type="text" value={snsKakao} onChange={e => setSnsKakao(e.target.value)}
                                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-medium text-gray-800 bg-white focus:border-[#F26E22]" 
                                    />
                                </div>
                                {/* 인스타그램 */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                                        <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white">
                                            <Instagram className="w-3 h-3" />
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-600">인스타그램</span>
                                    </div>
                                    <input 
                                        type="text" value={snsInsta} onChange={e => setSnsInsta(e.target.value)}
                                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-medium text-gray-800 bg-white focus:border-[#F26E22]" 
                                    />
                                </div>
                                {/* 텔레그램 */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                                        <div className="w-5 h-5 rounded bg-[#34AADF] flex items-center justify-center text-white">
                                            <Send className="w-2.5 h-2.5 ml-0.5" />
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-600">텔레그램</span>
                                    </div>
                                    <input 
                                        type="text" value={snsTelegram} onChange={e => setSnsTelegram(e.target.value)}
                                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-medium text-gray-800 bg-white focus:border-[#F26E22]" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: 보안 & 비밀번호 변경 버튼화 */}
                        <div className="py-4 flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <h3 className="font-extrabold text-[#333333] text-[14px] flex items-center gap-1.5">
                                    <Lock className="w-4 h-4 text-gray-400 stroke-[2]" /> 계정 보안 관리
                                </h3>
                                <p className="text-[11px] font-medium text-gray-500 pl-5">
                                    비밀번호를 새롭게 설정합니다.
                                </p>
                            </div>
                            
                            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-gray-200 text-[#333] font-bold h-7 px-3 text-[11px] rounded">
                                        비밀번호 변경
                                    </Button>
                                </DialogTrigger>
                                
                                {/* Nested Password Modal */}
                                <DialogContent className="sm:max-w-[360px] p-0 overflow-hidden bg-white border-none rounded-xl shadow-xl">
                                     <DialogHeader className="px-4 py-3 border-b flex-shrink-0 bg-gray-50">
                                        <DialogTitle className="font-extrabold text-[15px] flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-[#F26E22]" /> 비밀번호 변경
                                        </DialogTitle>
                                    </DialogHeader>
                                    
                                    <div className="p-4 space-y-3">
                                        {pwMessage && <div className="bg-green-50 text-green-700 p-2 rounded text-[11px] font-bold">{pwMessage}</div>}
                                        {pwError && <div className="bg-red-50 text-red-700 p-2 rounded text-[11px] font-bold">{pwError}</div>}
                                        
                                        <div>
                                            <label className="text-[11px] font-bold text-[#333] mb-1 block">기존 비밀번호</label>
                                            <input 
                                                type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none text-xs focus:border-[#F26E22]" 
                                                placeholder="현재 비밀번호력"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-[#333] mb-1 block">새 비밀번호 (6자 이상)</label>
                                            <input 
                                                type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none text-xs focus:border-[#F26E22]" 
                                                placeholder="새 비밀번호 입력"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-[#333] mb-1 block">새 비밀번호 확인</label>
                                            <input 
                                                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                                className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none text-xs focus:border-[#F26E22]" 
                                                placeholder="다시 입력"
                                            />
                                        </div>
                                        
                                        <Button onClick={handleSavePassword} disabled={savingPassword} className="w-full bg-[#1A1F2C] hover:bg-black text-white text-[12px] font-bold rounded h-8 mt-2">
                                            {savingPassword ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Check className="w-3 h-3 mr-1.5" />} 변경 저장
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                        </div>

                        {/* SECTION 4: 환경 표시 및 부가설정 */}
                        <div className="py-4 border-b border-gray-100 mb-6">
                            <h3 className="font-extrabold text-[#333333] text-[14px] flex items-center gap-1.5 mb-2">
                                <Settings className="w-4 h-4 text-gray-400 stroke-[2]" /> 환경 설정
                            </h3>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-gray-800">자동 로그인</span>
                                    <span className="text-[10px] text-gray-500 font-medium">브라우저를 닫아도 로그인이 유지됩니다. (PC방 등에서는 해제 권장)</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={autoLogin}
                                    onChange={(e) => handleAutoLoginToggle(e.target.checked)}
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* SECTION 5: 회원 탈퇴 링크 */}
                        <div className="pt-2 pb-6 text-center">
                            <button className="text-[11px] font-bold text-gray-400 hover:text-[#F26E22] transition-colors underline underline-offset-4 flex items-center justify-center gap-1 mx-auto">
                                회원 탈퇴를 생각하시나요?
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
