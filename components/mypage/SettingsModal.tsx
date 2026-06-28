'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { userSettingsAction, verifyBusinessAction } from '@/lib/actions';
import { Loader2, Settings, User, Link2, Lock, MessageCircle, Instagram, Send, Check, Upload, Building2, Bell, Plus, Trash2, Smartphone, Heart, Eye, EyeOff, Clock, Coins, FileText, LogOut, Briefcase } from 'lucide-react';
import { playNotificationSound } from '@/lib/notification-sound';
import { TelegramConnectButton } from '@/components/employer/telegram-connect-button';
import { AgeVerificationBox } from '@/src/components/auth/AgeVerificationBox';
import { signOut } from 'next-auth/react';
import { getMyActivityCounts } from '@/lib/actions/community';

export function SettingsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'settings'>('profile');
    const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
    const [reauthLoading, setReauthLoading] = useState(false);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setActiveTab('profile');
        };
        window.addEventListener('open_settings_modal', handleOpen);
        return () => {
            window.removeEventListener('open_settings_modal', handleOpen);
        };
    }, []);
    
    // Profile State
    const [initialNickname, setInitialNickname] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profileUrl, setProfileUrl] = useState('');
    const [autoLogin, setAutoLogin] = useState(false);
    
    // Notification Settings
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    
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
    const [bizType, setBizType] = useState('비사업자');
    const [verificationDocUrl, setVerificationDocUrl] = useState('');
    const [verifyingBiz, setVerifyingBiz] = useState(false);
    
    // Telegram Push Notification State
    const [userId, setUserId] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');
    const [botUsername, setBotUsername] = useState('');
    
    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    
    // Status
    const [loadingData, setLoadingData] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [pwMessage, setPwMessage] = useState('');
    const [pwError, setPwError] = useState('');

    // Withdraw State (인라인 탈퇴 확인 UI - Radix Dialog에서 window.confirm 사용 불가)
    const [withdrawStep, setWithdrawStep] = useState<0 | 1 | 2>(0);
    const [withdrawing, setWithdrawing] = useState(false);

    // Activity Counts
    const [activityCounts, setActivityCounts] = useState({
        postCount: 0,
        appCount: 0,
        recentCount: 0,
        scrapCount: 0,
    });

    // 1. 컴포넌트 마운트 시 최초 1회 프로필 데이터 백그라운드 사전 페칭 (Pre-fetching)
    useEffect(() => {
        fetchUserData(true);
        setAutoLogin(document.cookie.includes('foxmon_auto_login=1'));
        // 알림 설정 로드
        if (typeof window !== 'undefined') {
            const sound = localStorage.getItem('foxmon_notif_sound') === '1';
            const browser = localStorage.getItem('foxmon_notif_browser') === '1';
            const push = localStorage.getItem('foxmon_notif_push') === '1';
            setNotificationsEnabled(sound || browser || push);
        }
    }, []);

    // 2. 모달이 열릴 때 데이터가 이미 있다면 백그라운드 갱신(SWR)을 수행하고, 없다면 로딩과 함께 가져옴
    useEffect(() => {
        if (isOpen) {
            setWithdrawStep(0);
            const hasData = nickname || email || phoneNumber;
            fetchUserData(!hasData); // 데이터가 이미 있다면 로딩UI(loadingData) 없이 백그라운드로 가져옴

            // 활동 카운트 로드 (localStorage + DB)
            if (typeof window !== 'undefined') {
                const apps = localStorage.getItem('foxmon_applications');
                const recents = localStorage.getItem('foxmon_recent');
                const scraps = localStorage.getItem('foxmon_scraps');
                setActivityCounts(prev => ({
                    ...prev,
                    appCount: apps ? JSON.parse(apps).length : 0,
                    recentCount: recents ? JSON.parse(recents).length : 0,
                    scrapCount: scraps ? JSON.parse(scraps).length : 0,
                }));
            }
            // DB에서 글/댓글 카운트 가져오기
            (async () => {
                try {
                    const res = await getMyActivityCounts();
                    if (res.success) {
                        setActivityCounts(prev => ({ ...prev, postCount: res.postCount }));
                    }
                } catch (e) {
                    console.error('활동 카운트 로드 실패:', e);
                }
            })();
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
            document.cookie = "foxmon_transient=1; path=/;";
        }
    };

    const resetFields = () => {
        // 백그라운드에 페칭된 프로필 기본값(닉네임, 폰번호 등)은 그대로 유지하고,
        // 사용자 임시 입력값이나 결과 메시지, 패스워드 등만 리셋합니다.
        setNewSnsValue('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
        setError('');
        setPwMessage('');
        setPwError('');
        setActiveTab('profile');
    }

    const handleToggleNotifications = async () => {
        const next = !notificationsEnabled;
        setNotificationsEnabled(next);
        const val = next ? '1' : '0';
        
        localStorage.setItem('foxmon_notif_sound', val);
        localStorage.setItem('foxmon_notif_browser', val);
        localStorage.setItem('foxmon_notif_push', val);

        if (next) {
            playNotificationSound(); // 테스트 소리 재생
            
            if ('Notification' in window && Notification.permission === 'default') {
                await Notification.requestPermission();
            }
            
            window.dispatchEvent(new Event('foxmon_enable_push'));
        }
    };

    const fetchUserData = async (isBackground = false) => {
        if (!isBackground) {
            setLoadingData(true);
        }
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
                setBizType(data.business_type || '비사업자');
                setVerificationDocUrl(data.verification_doc_url || '');
                setUserId(data.userId || '');
                setTelegramChatId(data.telegram_chat_id || '');
                setBotUsername(data.botUsername || '');

                // Parse SNS Links (JSONB array or fallback to legacy columns)
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
                if (!isBackground) {
                    setError('사용자 정보를 불러올 수 없습니다.');
                }
            }
        } catch (err) {
            if (!isBackground) {
                setError('데이터 로딩 중 오류가 발생했습니다.');
            }
        } finally {
            if (!isBackground) {
                setLoadingData(false);
            }
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

    const handleVerifyBiz = async () => {
        if (!bizNumber || bizNumber.length !== 10) {
            alert('올바른 사업자등록번호 10자리를 입력해주세요.');
            return;
        }
        setVerifyingBiz(true);
        try {
            const result = await verifyBusinessAction(bizNumber, ceoName, verifiedBizName);
            if (result.success) {
                setIsBizVerified(true);
                alert(result.message);
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('사업자번호 검증 중 오류가 발생했습니다.');
        } finally {
            setVerifyingBiz(false);
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
                    sns_links: snsLinks,
                    currentNickname: initialNickname,
                    business_registration_number: bizNumber,
                    is_business_verified: isBizVerified,
                    verified_ceo_name: ceoName,
                    verified_business_name: verifiedBizName,
                    business_cert_image_url: bizCertUrl,
                    business_type: bizType,
                    verification_doc_url: verificationDocUrl
                }
            });

            if (result.success) {
                setMessage('기본 정보가 저장되었습니다.');
                setInitialNickname(nickname);
                window.dispatchEvent(new Event('profile-updated'));
                setTimeout(() => setMessage(''), 3000);
                return true;
            } else {
                setError(result.message);
                return false;
            }
        } catch (err: any) {
            setError('설정 수정 중 오류가 발생했습니다.');
            return false;
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPwError('비밀번호를 모두 입력해주세요.');
            return false;
        }
        if (newPassword !== confirmPassword) {
            setPwError('새 비밀번호와 확인이 일치하지 않습니다.');
            return false;
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
                return true;
            } else {
                setPwError(result.message);
                return false;
            }
        } catch (err: any) {
            setPwError('비밀번호 변경 중 오류가 발생했습니다.');
            return false;
        } finally {
            setSavingPassword(false);
        }
    };

    const handleWithdrawExecute = async () => {
        setWithdrawing(true);
        try {
            const res = await fetch('/api/auth/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await res.json();

            if (result.success) {
                document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "foxmon_transient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                await signOut({ callbackUrl: '/' });
            } else {
                setError(result.message || '회원 탈퇴 처리 중 오류가 발생했습니다.');
                setWithdrawStep(0);
            }
        } catch (err) {
            console.error('Withdraw exception:', err);
            setError('회원 탈퇴 처리 중 오류가 발생했습니다.');
            setWithdrawStep(0);
        } finally {
            setWithdrawing(false);
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

    const handleVerificationDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                    setVerificationDocUrl(canvas.toDataURL('image/jpeg', 0.8));
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
        <>
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
            <DialogTrigger asChild>
                <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-gray-600 hover:text-gray-900 transition-all shadow-sm active:scale-95 text-[11px] sm:text-xs font-black cursor-pointer"
                    title="마이페이지"
                >
                    <Settings className="w-3.5 h-3.5" />
                    <span>마이페이지</span>
                </button>
            </DialogTrigger>
            
            <DialogContent 
                className="sm:max-w-[480px] p-0 overflow-hidden bg-white flex flex-col max-h-[90vh] border-none rounded-2xl shadow-xl pointer-events-auto"
                overlayClassName="pointer-events-none"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Header */}
                <DialogHeader className="px-5 py-4 flex-shrink-0 bg-white z-10 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="font-extrabold text-lg flex items-center gap-2 text-gray-900">
                            <User className="w-4 h-4 text-[#F26E22]" /> 마이페이지
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {activeTab === 'profile' ? (
                            <Button 
                                onClick={handleSaveProfile} 
                                disabled={savingProfile || loadingData} 
                                className="bg-[#1A1F2C] hover:bg-black text-white px-4 font-bold rounded-lg h-9 shadow-sm"
                            >
                                {savingProfile && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                                저장
                            </Button>
                        ) : activeTab === 'settings' ? (
                            <Button 
                                onClick={() => setIsOpen(false)}
                                disabled={loadingData} 
                                className="bg-[#1A1F2C] hover:bg-black text-white px-4 font-bold rounded-lg h-9 shadow-sm"
                            >
                                확인
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => setIsOpen(false)}
                                className="bg-[#1A1F2C] hover:bg-black text-white px-4 font-bold rounded-lg h-9 shadow-sm"
                            >
                                확인
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            onClick={() => setIsOpen(false)} 
                            className="border-gray-200 text-gray-600 px-4 font-bold rounded-lg h-9 hover:bg-gray-50 hover:text-gray-900"
                        >
                            닫기
                        </Button>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={`flex-1 py-3 text-[13px] font-bold transition-colors ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        기본 정보
                    </button>
                    <button 
                        onClick={() => setActiveTab('activity')} 
                        className={`flex-1 py-3 text-[13px] font-bold transition-colors ${activeTab === 'activity' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        나의 활동 정보
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')} 
                        className={`flex-1 py-3 text-[13px] font-bold transition-colors ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        환경 및 보안
                    </button>
                </div>

                {loadingData ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-2 py-20">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="font-bold text-sm">정보를 불러오는 중입니다...</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto bg-gray-50/30">
                        
                        {/* 탭 1: 기본 정보 */}
                        {activeTab === 'profile' && (
                            <div className="p-5 space-y-6">
                                {message && <div className="bg-green-100 text-green-800 p-2.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2"><Check className="w-4 h-4"/>{message}</div>}
                                {error && <div className="bg-red-100 text-red-800 p-2.5 rounded-lg text-xs font-bold shadow-sm">{error}</div>}

                                {/* 프로필 및 기본 정보 */}
                                <section>
                                    <h3 className="font-extrabold text-[#333] text-[13px] mb-3 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-gray-400 stroke-[2.5]" /> 프로필 기본 정보
                                    </h3>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-row items-center sm:items-start gap-4 sm:gap-5">
                                        <div className="flex flex-col items-center justify-center shrink-0 gap-1.5">
                                            <div className="relative group cursor-pointer w-[90px] h-[90px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 flex flex-col items-center justify-center transition-all hover:border-primary">
                                                {profileUrl ? (
                                                    <img src={profileUrl} alt="Profile" className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-primary p-1 text-center">
                                                        <Upload className="w-5 h-5" />
                                                        <span className="text-[10px] font-bold">이미지 등록</span>
                                                    </div>
                                                )}
                                                <input type="file" id="profile-upload-input-modal" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                            <label 
                                                htmlFor="profile-upload-input-modal" 
                                                className="px-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-md text-[11px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center select-none"
                                            >
                                                이미지 변경
                                            </label>
                                        </div>
                                        
                                        <div className="flex-1 space-y-2.5 w-full">
                                            <div className="flex items-center gap-2">
                                                <label className="text-[11px] font-bold text-gray-500 w-[60px] sm:w-[80px] shrink-0">닉네임</label>
                                                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-bold focus:border-primary transition-colors flex-1" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-[11px] font-bold text-gray-500 w-[60px] sm:w-[80px] shrink-0">이메일</label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md outline-none text-[13px] font-medium focus:border-primary transition-colors flex-1" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-[11px] font-bold text-gray-500 w-[60px] sm:w-[80px] shrink-0">전화번호</label>
                                                <div className="flex gap-2 flex-1">
                                                    <input type="text" value={phoneNumber} readOnly className="w-full px-2.5 py-1.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-md outline-none text-[13px] font-bold flex-1" />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setIsReauthModalOpen(true)}
                                                        className="shrink-0 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-md text-[11px] font-bold hover:bg-gray-50"
                                                    >
                                                        재인증
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 동적 SNS 연결 */}
                                <section>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-extrabold text-[#333] text-[13px] flex items-center gap-1.5">
                                            <Link2 className="w-4 h-4 text-gray-400 stroke-[2.5]" /> 연락처 / SNS 계정
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
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                        {snsLinks.map((sns, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
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
                                        
                                        {/* SNS 추가 폼 */}
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={newSnsType} 
                                                onChange={e => setNewSnsType(e.target.value)}
                                                className="w-[95px] px-2 py-2 border border-gray-200 rounded-lg text-[12px] font-bold outline-none focus:border-primary bg-white"
                                            >
                                                {snsOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                            <input 
                                                type="text" 
                                                value={newSnsValue} 
                                                onChange={e => setNewSnsValue(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddSns()}
                                                placeholder="아이디 또는 URL 입력"
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* 사업자 정보 (업체 전용) */}
                                 {role === 'EMPLOYER' && (
                                     <section>
                                         <div className="flex items-center justify-between mb-3">
                                             <h3 className="font-extrabold text-primary text-[13px] flex items-center gap-1.5">
                                                 <Building2 className="w-4 h-4 stroke-[2]" /> 업체 (사업자) 정보
                                             </h3>
                                             {isBizVerified ? (
                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700">인증 완료</span>
                                             ) : bizCertUrl ? (
                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">심사 중</span>
                                             ) : (
                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">미인증</span>
                                             )}
                                         </div>
                                         <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 space-y-3">
                                             <div className="text-[12px] text-orange-700 font-bold bg-orange-50 p-3.5 rounded-lg border border-orange-100 leading-relaxed">
                                                 📢 **알림**: 배너 및 프리미엄 광고 등록을 이용하시려면 아래 사업자 정보 입력 및 **실시간 국세청 인증**을 마쳐주셔야 합니다. (일반 구인 공고는 인증 없이 즉시 등록 가능)
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <label className="text-[11px] font-bold text-gray-500 w-[90px] shrink-0">상호명</label>
                                                 <input type="text" value={verifiedBizName} onChange={e => setVerifiedBizName(e.target.value)} readOnly={isBizVerified} className={`w-full px-2.5 py-1.5 border rounded-md text-[13px] font-bold flex-1 ${isBizVerified ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-200 focus:border-primary'}`} placeholder="상호명" />
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <label className="text-[11px] font-bold text-gray-500 w-[90px] shrink-0">대표자명</label>
                                                 <input type="text" value={ceoName} onChange={e => setCeoName(e.target.value)} readOnly={isBizVerified} className={`w-full px-2.5 py-1.5 border rounded-md text-[13px] font-bold flex-1 ${isBizVerified ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-200 focus:border-primary'}`} placeholder="대표자명" />
                                             </div>
                                             <div className="flex items-center gap-2">
                                                 <label className="text-[11px] font-bold text-gray-500 w-[90px] shrink-0">사업자등록번호</label>
                                                 <div className="flex gap-2 flex-1">
                                                     <input type="text" value={bizNumber} onChange={e => setBizNumber(e.target.value)} readOnly={isBizVerified} maxLength={10} className={`flex-1 px-2.5 py-1.5 border rounded-md text-[13px] font-bold ${isBizVerified ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-200 focus:border-primary'}`} placeholder="숫자 10자리" />
                                                     {!isBizVerified ? (
                                                         <Button 
                                                             type="button" 
                                                             onClick={handleVerifyBiz} 
                                                             disabled={verifyingBiz} 
                                                             className="h-8 px-3 text-[11px] font-bold shrink-0 bg-primary hover:bg-orange-600 text-white"
                                                         >
                                                             {verifyingBiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '인증하기'}
                                                         </Button>
                                                     ) : (
                                                         <Button 
                                                             type="button" 
                                                             variant="outline" 
                                                             onClick={() => setIsBizVerified(false)} 
                                                             className="h-8 px-3 text-[11px] font-bold text-red-500 shrink-0"
                                                         >
                                                             인증해제
                                                         </Button>
                                                     )}
                                                 </div>
                                             </div>
                                             <div className="pt-2 border-t border-orange-100">
                                                 <label className="text-[11px] font-bold text-gray-500 mb-1 block">사업자등록증 업로드 (유흥업종 2차 검수용)</label>
                                                 <div className="relative w-full h-[80px] bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                                     {bizCertUrl ? <img src={bizCertUrl} className="h-full object-contain" /> : <span className="text-[11px] font-bold text-gray-400">클릭하여 업로드</span>}
                                                     <input type="file" accept="image/*" onChange={handleBizCertUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                 </div>
                                             </div>
                                         </div>
                                     </section>
                                 )}
                            </div>
                        )}
                        {activeTab === 'activity' && (
                            <div className="p-5 space-y-4">
                                <h3 className="font-extrabold text-[#333] text-[13px] mb-3 flex items-center gap-1.5">
                                    나의 활동 정보
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <Link 
                                        href="/mypage/activity" 
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-4 bg-white hover:bg-blue-50/50 rounded-xl border border-gray-100 hover:border-blue-200 shadow-sm transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">내 활동 (작성 글/댓글)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{activityCounts.postCount}건</span>
                                            <span className="text-xs text-gray-400 font-bold group-hover:text-blue-500">&rarr;</span>
                                        </div>
                                    </Link>

                                    <Link 
                                        href="/mypage/applications" 
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-4 bg-white hover:bg-violet-50/50 rounded-xl border border-gray-100 hover:border-violet-200 shadow-sm transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-violet-50 text-violet-500 group-hover:scale-110 transition-transform">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">나의 공고</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">{activityCounts.appCount}건</span>
                                            <span className="text-xs text-gray-400 font-bold group-hover:text-violet-500">&rarr;</span>
                                        </div>
                                    </Link>

                                    <Link 
                                        href="/mypage/recent" 
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-4 bg-white hover:bg-indigo-50/50 rounded-xl border border-gray-100 hover:border-indigo-200 shadow-sm transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 group-hover:scale-110 transition-transform">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">최근 본 공고</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{activityCounts.recentCount}건</span>
                                            <span className="text-xs text-gray-400 font-bold group-hover:text-indigo-500">&rarr;</span>
                                        </div>
                                    </Link>

                                    <Link 
                                        href="/mypage/scraps" 
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-4 bg-white hover:bg-orange-50/50 rounded-xl border border-gray-100 hover:border-orange-200 shadow-sm transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-50 text-primary group-hover:scale-110 transition-transform">
                                                <Heart className="h-5 w-5 fill-current" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">스크랩 (좋아요)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-primary bg-orange-50 px-2 py-0.5 rounded-full">{activityCounts.scrapCount}건</span>
                                            <span className="text-xs text-gray-400 font-bold group-hover:text-primary">&rarr;</span>
                                        </div>
                                    </Link>
                                    
                                    <Link 
                                        href="/mypage/viewers" 
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-4 bg-white hover:bg-emerald-50/50 rounded-xl border border-gray-100 hover:border-emerald-200 shadow-sm transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform">
                                                <Eye className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">나를 본 업체</span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-bold group-hover:text-emerald-500">바로가기 &rarr;</span>
                                    </Link>

                                    {role === 'EMPLOYER' ? (
                                        <Link 
                                            href="/biz/points"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-between p-4 bg-white hover:bg-amber-50/50 rounded-xl border border-gray-100 hover:border-amber-200 shadow-sm transition-all duration-300 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-500 group-hover:scale-110 transition-transform">
                                                    <Coins className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">포인트 이력 (적립/사용 내역)</span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-bold group-hover:text-amber-500">바로가기 &rarr;</span>
                                        </Link>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setIsOpen(false);
                                                window.dispatchEvent(new CustomEvent('open_point_modal'));
                                            }}
                                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-amber-50/50 rounded-xl border border-gray-100 hover:border-amber-200 shadow-sm transition-all duration-300 group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-500 group-hover:scale-110 transition-transform">
                                                    <Coins className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">포인트 이력 (적립/사용 내역)</span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-bold group-hover:text-amber-500">바로가기 &rarr;</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 탭 2: 보안 및 환경 설정 */}
                        {activeTab === 'settings' && (
                            <div className="p-5 space-y-6">
                                
                                {/* 알림 설정 (모든 유저) */}
                                <section>
                                    <h3 className="font-extrabold text-[#333] text-[13px] mb-3 flex items-center gap-1.5">
                                        <Bell className="w-4 h-4 text-gray-400 stroke-[2.5]" /> 알림 설정
                                    </h3>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-gray-800">🔔 실시간 알림 받기</span>
                                                <span className="text-[11px] text-gray-500">웹 브라우저에서 소리로 알림을 받습니다.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleToggleNotifications}
                                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                    notificationsEnabled ? 'bg-primary' : 'bg-gray-300'
                                                }`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                                                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                                                }`} />
                                            </button>
                                        </div>
                                    </div>
                                </section>


                                {/* 비밀번호 변경 */}
                                <section>
                                    <h3 className="font-extrabold text-[#333] text-[13px] mb-3 flex items-center gap-1.5">
                                        <Lock className="w-4 h-4 text-gray-400 stroke-[2.5]" /> 계정 보안
                                    </h3>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                        {pwMessage && <div className="bg-green-50 text-green-700 p-2 rounded text-[11px] font-bold">{pwMessage}</div>}
                                        {pwError && <div className="bg-red-50 text-red-700 p-2 rounded text-[11px] font-bold">{pwError}</div>}
                                        
                                        <div className="flex items-center gap-2">
                                            <label className="text-[11px] font-bold text-gray-500 w-[110px] shrink-0">현재 비밀번호</label>
                                            <div className="relative flex-1">
                                                <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="one-time-code" className="w-full px-2.5 py-1.5 pr-8 border border-gray-200 rounded-md outline-none text-[13px] focus:border-primary" />
                                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                                                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[11px] font-bold text-gray-500 w-[110px] shrink-0">새 비밀번호</label>
                                            <div className="relative flex-1">
                                                <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="one-time-code" className="w-full px-2.5 py-1.5 pr-8 border border-gray-200 rounded-md outline-none text-[13px] focus:border-primary" />
                                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                                                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[11px] font-bold text-gray-500 w-[110px] shrink-0">새 비밀번호 확인</label>
                                            <div className="relative flex-1">
                                                <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="one-time-code" className="w-full px-2.5 py-1.5 pr-8 border border-gray-200 rounded-md outline-none text-[13px] focus:border-primary" />
                                                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                                                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <Button onClick={handleSavePassword} disabled={savingPassword} className="w-full mt-2 font-bold h-9 bg-[#1A1F2C] hover:bg-black text-white border-none shadow-sm rounded-lg">
                                            {savingPassword ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Check className="w-3 h-3 mr-1.5" />} 비밀번호 변경하기
                                        </Button>
                                    </div>
                                </section>

                                {/* 브라우저 환경 설정 */}
                                <section>
                                    <h3 className="font-extrabold text-[#333] text-[13px] mb-3 flex items-center gap-1.5">
                                        <Settings className="w-4 h-4 text-gray-400 stroke-[2.5]" /> 접속 환경
                                    </h3>
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[13px] font-bold text-gray-800">자동 로그인 유지</span>
                                            <span className="text-[11px] text-gray-500">브라우저를 닫아도 로그인이 유지됩니다.</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={autoLogin} onChange={(e) => handleAutoLoginToggle(e.target.checked)} />
                                            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
                                </section>

                                <div className="pt-4">
                                    {withdrawStep === 0 && (
                                        <div className="text-center">
                                            <button 
                                                onClick={() => setWithdrawStep(1)}
                                                className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors underline underline-offset-4 cursor-pointer"
                                            >
                                                회원 탈퇴를 생각하시나요?
                                            </button>
                                        </div>
                                    )}
                                    {withdrawStep === 1 && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                            <p className="text-[13px] font-bold text-red-600">⚠️ 정말로 회원 탈퇴를 진행하시겠습니까?</p>
                                            <p className="text-[11px] text-gray-500">탈퇴 시 작성하신 이력서와 모든 활동 데이터가 즉시 삭제되며 복구할 수 없습니다.</p>
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setWithdrawStep(0)} className="px-3 py-1.5 text-[12px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">취소</button>
                                                <button onClick={() => setWithdrawStep(2)} className="px-3 py-1.5 text-[12px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">탈퇴 진행</button>
                                            </div>
                                        </div>
                                    )}
                                    {withdrawStep === 2 && (
                                        <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4 space-y-3">
                                            <p className="text-[13px] font-black text-red-700">🚨 마지막 경고입니다</p>
                                            <p className="text-[11px] text-red-600 font-bold">탈퇴 후 데이터 복구는 절대 불가능합니다. 정말 계속 진행하시겠습니까?</p>
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setWithdrawStep(0)} className="px-3 py-1.5 text-[12px] font-bold text-gray-500 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">취소</button>
                                                <button onClick={handleWithdrawExecute} disabled={withdrawing} className="px-3 py-1.5 text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1">
                                                    {withdrawing && <Loader2 className="w-3 h-3 animate-spin" />}
                                                    {withdrawing ? '처리 중...' : '최종 탈퇴 확인'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>

        {/* 완전히 독립된 재인증 다이얼로그 (중첩 모달 충돌 방지를 위해 병렬 분리) */}
        <Dialog open={isReauthModalOpen} onOpenChange={setIsReauthModalOpen} preventPopState={true}>
            <DialogContent 
                className="sm:max-w-[400px] p-0 overflow-hidden bg-white border-none rounded-xl shadow-xl z-[9999]"
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-4 py-3 border-b bg-gray-50">
                    <DialogTitle className="font-extrabold text-[15px] flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#F26E22]" /> 휴대폰 재인증
                    </DialogTitle>
                    <DialogDescription className="text-[11px] text-gray-500">
                        본인인증으로 전화번호를 변경합니다.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    {reauthLoading ? (
                        <div className="flex flex-col items-center py-8 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                            <p className="text-sm font-bold text-gray-500">처리 중...</p>
                        </div>
                    ) : (
                        <AgeVerificationBox onVerifySuccess={async (data: any) => {
                            setReauthLoading(true);
                            try {
                                if (data.phoneNumber) {
                                    setPhoneNumber(data.phoneNumber);
                                }
                                const res = await userSettingsAction('UPDATE_PROFILE', {
                                    profileData: {
                                        phoneNumber: data.phoneNumber || phoneNumber,
                                        nickname,
                                        email,
                                        profile_image_url: profileUrl,
                                        sns_links: snsLinks,
                                        currentNickname: initialNickname,
                                    }
                                });
                                if (res.success) {
                                    setMessage('전화번호가 변경되었습니다.');
                                    setTimeout(() => setMessage(''), 3000);
                                }
                            } catch (_) {}
                            setReauthLoading(false);
                            setIsReauthModalOpen(false);
                        }} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
