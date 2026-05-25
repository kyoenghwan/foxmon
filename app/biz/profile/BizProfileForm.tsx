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
import { Loader2, Settings, User, Link2, Lock, MessageCircle, Instagram, Send, Check, Upload, Building2, Plus, Trash2 } from 'lucide-react';
import { TelegramConnectButton } from '@/components/employer/telegram-connect-button';

export default function BizProfileForm() {
    
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    
    // Profile State
    const [initialNickname, setInitialNickname] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profileUrl, setProfileUrl] = useState('');
    const [autoLogin, setAutoLogin] = useState(false);
    
    // Dynamic SNS State
    const [snsLinks, setSnsLinks] = useState<{type: string; value: string}[]>([]);
    const [newSnsType, setNewSnsType] = useState('kakao');
    const [newSnsValue, setNewSnsValue] = useState('');
    
    // Business Verification State
    const [role, setRole] = useState('');
    const [bizNumber, setBizNumber] = useState('');
    const [ceoName, setCeoName] = useState('');
    const [isBizVerified, setIsBizVerified] = useState(false);
    const [verifiedBizName, setVerifiedBizName] = useState('');
    const [bizCertUrl, setBizCertUrl] = useState('');
    
    // Telegram Push Notification State
    const [userId, setUserId] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');
    const [botUsername, setBotUsername] = useState('');
    
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
        fetchUserData();
        setAutoLogin(document.cookie.includes('foxmon_auto_login=1'));
    }, []);

    const handleAutoLoginToggle = (checked: boolean) => {
        setAutoLogin(checked);
        if (checked) {
            document.cookie = "foxmon_auto_login=1; path=/; max-age=2592000";
        } else {
            document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "foxmon_transient=1; path=/;";
        }
    };

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
                setRole(data.role || 'GENERAL');
                setBizNumber(data.business_registration_number || '');
                setCeoName(data.verified_ceo_name || '');
                setIsBizVerified(data.is_business_verified || false);
                setVerifiedBizName(data.verified_business_name || '');
                setBizCertUrl(data.business_cert_image_url || '');
                setUserId(data.userId || '');
                setTelegramChatId(data.telegram_chat_id || '');
                setBotUsername(data.botUsername || '');

                if (data.sns_links && Array.isArray(data.sns_links)) {
                    setSnsLinks(data.sns_links);
                } else {
                    const legacySns = [];
                    if (data.sns_kakao) legacySns.push({ type: 'kakao', value: data.sns_kakao });
                    if (data.sns_instagram) legacySns.push({ type: 'instagram', value: data.sns_instagram });
                    if (data.sns_telegram) legacySns.push({ type: 'telegram', value: data.sns_telegram });
                    if (data.sns_x) legacySns.push({ type: 'x', value: data.sns_x });
                    setSnsLinks(legacySns);
                }
            } else {
                setError('사용자 정보를 불러올 수 없습니다.');
            }
        } catch (err) {
            setError('데이터 로딩 중 오류가 발생했습니다.');
        } finally {
            setLoadingData(false);
        }
    };

    const handleAddSns = () => {
        if (!newSnsValue.trim()) {
            alert('아이디 또는 URL을 입력해주세요.');
            return;
        }
        setSnsLinks([...snsLinks, { type: newSnsType, value: newSnsValue.trim() }]);
        setNewSnsValue('');
    };

    const handleRemoveSns = (index: number) => {
        setSnsLinks(snsLinks.filter((_, i) => i !== index));
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
                    sns_links: snsLinks,
                    currentNickname: initialNickname,
                    business_registration_number: bizNumber,
                    is_business_verified: isBizVerified,
                    verified_ceo_name: ceoName,
                    verified_business_name: verifiedBizName,
                    business_cert_image_url: bizCertUrl
                }
            });

            if (result.success) {
                setMessage('설정이 저장되었습니다.');
                setInitialNickname(nickname);
                window.dispatchEvent(new Event('profile-updated'));
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
                passwordData: { currentPassword, newPassword }
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
        if (file.size > 10 * 1024 * 1024) return alert('사진은 10MB 이하로 업로드해주세요.');

        const reader = new FileReader();
        reader.onloadend = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX_WIDTH = 300; const MAX_HEIGHT = 300;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    setProfileUrl(canvas.toDataURL('image/jpeg', 0.8));
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleBizCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return alert('사진은 10MB 이하로 업로드해주세요.');

        const reader = new FileReader();
        reader.onloadend = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    setBizCertUrl(canvas.toDataURL('image/jpeg', 0.8));
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const getSnsIcon = (type: string) => {
        switch (type) {
            case 'kakao': return <span className="bg-[#FBE54D] text-black text-[10px] px-1.5 py-0.5 rounded font-black">TALK</span>;
            case 'instagram': return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
            case 'telegram': return <Send className="w-3.5 h-3.5 text-blue-500" />;
            case 'line': return <span className="bg-[#00B900] text-white text-[10px] px-1.5 py-0.5 rounded font-black">LINE</span>;
            case 'x': return <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded font-black">𝕏</span>;
            default: return <Link2 className="w-3.5 h-3.5 text-gray-500" />;
        }
    };

    const snsOptions = [
        { value: 'kakao', label: '카카오톡' },
        { value: 'instagram', label: '인스타그램' },
        { value: 'telegram', label: '텔레그램' },
        { value: 'line', label: '라인' },
        { value: 'x', label: 'X(트위터)' },
        { value: 'other', label: '기타/URL' }
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 flex-shrink-0 bg-white z-10 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div>
                        <h2 className="font-extrabold text-lg flex items-center gap-2 text-gray-900">
                            <Building2 className="w-4 h-4 text-[#F26E22]" /> 업체 프로필 관리
                        </h2>
                        <p className="font-medium text-[13px] text-gray-500 mt-1">
                            사업자 정보 및 SNS 프로필을 관리하세요.
                        </p>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={savingProfile || loadingData} className="bg-[#1A1F2C] hover:bg-black text-white px-5 font-bold rounded-lg h-9 shadow-sm shrink-0">
                        {savingProfile && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                        저장
                    </Button>
                </div>

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
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">닉네임</label>
                                        <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-bold text-gray-800 py-1.5 focus:border-[#F26E22]" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">이메일</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-medium text-gray-800 focus:border-[#F26E22] flex-1" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">전화번호</label>
                                        <div className="flex items-center gap-1.5 flex-1 w-full">
                                            <input type="text" value={phoneNumber} readOnly className="w-full px-2.5 py-1.5 border border-[#DBE9F4] rounded-md outline-none text-[13px] font-bold text-gray-700 bg-[#EBF2F8]" />
                                            <button type="button" onClick={() => alert("준비 중인 기능입니다.")} className="shrink-0 px-2 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-md text-[11px] font-bold hover:bg-gray-200">휴대폰 재인증</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: SNS 계정 연결 */}
                        <div className="py-4 border-b border-gray-100 relative">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-extrabold text-[#333333] text-[14px] flex items-center gap-1.5">
                                    <Link2 className="w-4 h-4 text-gray-400 stroke-[2.5]" /> SNS 계정 연결
                                </h3>
                                <button 
                                    type="button" 
                                    onClick={handleAddSns} 
                                    className="h-7 w-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-bold shadow-sm transition-colors active:scale-95 cursor-pointer" 
                                    title="SNS 계정 추가"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                {snsLinks.map((sns, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                        <div className="w-[85px] flex items-center gap-1.5 shrink-0 pl-1">
                                            {getSnsIcon(sns.type)}
                                            <span className="text-[11px] font-bold text-gray-600">
                                                {snsOptions.find(o => o.value === sns.type)?.label || '기타'}
                                            </span>
                                        </div>
                                        <input 
                                            type="text" 
                                            value={sns.value} 
                                            onChange={e => {
                                                const newLinks = [...snsLinks];
                                                newLinks[index].value = e.target.value;
                                                setSnsLinks(newLinks);
                                            }}
                                            className="flex-1 bg-transparent border-none outline-none text-[13px] font-medium text-gray-800"
                                            placeholder="아이디 또는 URL"
                                        />
                                        <button onClick={() => handleRemoveSns(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={newSnsType} 
                                        onChange={e => setNewSnsType(e.target.value)}
                                        className="w-[95px] px-2 py-2 border border-gray-200 rounded-lg text-[12px] font-bold outline-none bg-white"
                                    >
                                        {snsOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <input 
                                        type="text" 
                                        value={newSnsValue} 
                                        onChange={e => setNewSnsValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSns()}
                                        placeholder="아이디 또는 URL 입력"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: 보안 & 비밀번호 변경 버튼화 */}
                        <div className="py-4 flex items-center justify-between border-b border-gray-100">
                            <div className="flex flex-col gap-0.5">
                                <h3 className="font-extrabold text-[#333333] text-[14px] flex items-center gap-1.5">
                                    <Lock className="w-4 h-4 text-gray-400 stroke-[2]" /> 계정 보안 관리
                                </h3>
                                <p className="text-[11px] font-medium text-gray-500 pl-5">비밀번호를 새롭게 설정합니다.</p>
                            </div>
                            
                            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-gray-200 text-[#333] font-bold h-7 px-3 text-[11px] rounded">
                                        비밀번호 변경
                                    </Button>
                                </DialogTrigger>
                                
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
                                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none text-xs focus:border-[#F26E22]" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-[#333] mb-1 block">새 비밀번호</label>
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none text-xs focus:border-[#F26E22]" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-[#333] mb-1 block">새 비밀번호 확인</label>
                                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none text-xs focus:border-[#F26E22]" />
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
                            <div className="flex flex-col gap-3">
                                {role === 'EMPLOYER' && (
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-bold text-gray-800">텔레그램 실시간 알림 연동</span>
                                            <span className="text-[10px] text-gray-500 font-medium">지원자 알림 등을 텔레그램으로 즉시 받습니다.</span>
                                        </div>
                                        {userId ? (
                                            <TelegramConnectButton userId={userId} botUsername={botUsername} isLinked={!!telegramChatId} />
                                        ) : (
                                            <div className="text-[10px] text-gray-400">로딩 중...</div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-bold text-gray-800">자동 로그인 유지</span>
                                        <span className="text-[10px] text-gray-500 font-medium">브라우저를 닫아도 로그인이 유지됩니다.</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" checked={autoLogin} onChange={(e) => handleAutoLoginToggle(e.target.checked)} />
                                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 5: 사업자 정보 관리 (업체회원 이상) */}
                        {(role === 'EMPLOYER' || role === 'ADMIN') && (
                            <div className="py-4 border-b border-gray-100 mb-6 bg-orange-50/30 -mx-5 px-5 rounded-lg border border-orange-100/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-extrabold text-[#333333] text-[14px] flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-primary stroke-[2]" /> 사업자 정보 관리
                                    </h3>
                                    {isBizVerified ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700">
                                            <Check className="w-3 h-3 stroke-[3]" /> 인증 완료
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">
                                            미인증 상태
                                        </span>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">대표자명</label>
                                        <input type="text" value={ceoName} onChange={e => setCeoName(e.target.value)} className={`w-full px-2.5 py-1.5 border rounded-md outline-none text-[13px] font-bold flex-1 ${isBizVerified ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-200 text-gray-800 focus:border-primary'}`} readOnly={isBizVerified} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">상호명</label>
                                        <input type="text" value={verifiedBizName} onChange={e => setVerifiedBizName(e.target.value)} className={`w-full px-2.5 py-1.5 border rounded-md outline-none text-[13px] font-bold flex-1 ${isBizVerified ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-200 text-gray-800 focus:border-primary'}`} readOnly={isBizVerified} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[12px] font-bold text-gray-500 w-[60px] shrink-0">사업자번호</label>
                                        <div className="flex items-center gap-1.5 flex-1 w-full">
                                            <input type="text" value={bizNumber} onChange={e => setBizNumber(e.target.value)} className={`w-full px-2.5 py-1.5 border rounded-md outline-none text-[13px] font-bold flex-1 ${isBizVerified ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-200 text-gray-800 focus:border-primary'}`} readOnly={isBizVerified} maxLength={10} />
                                            {!isBizVerified && (
                                                <Button type="button" onClick={() => setIsBizVerified(true)} className="shrink-0 px-3 h-8 bg-primary text-white rounded-md text-[11px] font-bold">인증하기</Button>
                                            )}
                                            {isBizVerified && (
                                                <Button type="button" onClick={() => setIsBizVerified(false)} variant="outline" className="shrink-0 px-3 h-8 border-red-200 text-red-500 rounded-md text-[11px] font-bold">해제</Button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-orange-100">
                                        <label className="text-[12px] font-bold text-gray-500 flex items-center justify-between">사업자등록증 업로드 (2차 검수용)</label>
                                        <div className="relative group cursor-pointer w-full h-[120px] bg-white rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex flex-col items-center justify-center transition-colors hover:border-primary">
                                            {bizCertUrl ? (
                                                <img src={bizCertUrl} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 text-gray-400 p-2 text-center">
                                                    <Upload className="w-5 h-5 stroke-[2]" />
                                                    <span className="text-[11px] font-bold leading-tight">유흥업종 여부 확인용<br/>등록증 이미지 업로드</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleBizCertUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
        </div>
    );
}
