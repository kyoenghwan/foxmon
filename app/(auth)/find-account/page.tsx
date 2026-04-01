'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AgeVerificationBox } from '@/src/components/auth/AgeVerificationBox';
import { nvLog } from '@/lib/logger';

function FindAccountContent() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Select Mode, 2: Verification, 3: Result/Reset
    const [mode, setMode] = useState<'FIND_ID' | 'RESET_PW'>('FIND_ID');
    const [verifiedData, setVerifiedData] = useState<any>(null);
    const [loginId, setLoginId] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [foundId, setFoundId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerifySuccess = async (data: any) => {
        setVerifiedData(data);
        if (mode === 'FIND_ID') {
            await performFindId(data);
        } else {
            setStep(3); // Go to Login ID entry for PW reset
        }
    };

    const performFindId = async (data: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/find-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'FIND_ID',
                    name: data.name,
                    phoneNumber: data.phoneNumber,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setFoundId(result.data.maskedId);
                setStep(3);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('서버 통신 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!loginId) return setError('아이디를 입력해주세요.');
        if (!newPassword || newPassword !== confirmPassword) return setError('비밀번호가 일치하지 않거나 비어있습니다.');
        
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/find-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'RESET_PW',
                    name: verifiedData.name,
                    phoneNumber: verifiedData.phoneNumber,
                    loginId,
                    newPassword,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setStep(4); // Success screen
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('서버 통신 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 py-8 bg-[#f8f9fa]">
            <div className="w-full max-w-xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-500">
                
                {/* Back Button */}
                <button 
                    onClick={() => {
                        if (step > 1) setStep(prev => prev - 1);
                        else router.back();
                    }}
                    className="absolute top-6 left-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-purple-100 text-gray-500 hover:text-purple-700 transition-all shadow-sm border border-purple-100"
                >
                    <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-b from-purple-100/50 to-white px-8 pt-12 pb-8 flex flex-col items-center gap-2 border-b border-gray-50">
                    <h1 className="text-3xl font-black tracking-tighter text-purple-900 italic">FOXMON</h1>
                    <p className="text-purple-600 text-[10px] font-black tracking-widest uppercase">계정 정보 찾기</p>
                </div>

                <div className="p-8 md:p-12">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center space-y-2">
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight">어떤 정보를 찾으시나요?</h2>
                                <p className="text-gray-400 text-sm font-medium">원하시는 메뉴를 선택해 주세요.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => { setMode('FIND_ID'); setStep(2); }}
                                    className="flex items-center gap-5 p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-purple-300 hover:bg-purple-50/30 transition-all group group cursor-pointer text-left"
                                >
                                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                        <Search className="w-7 h-7 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-lg font-black text-gray-800 group-hover:text-purple-900">아이디 찾기</div>
                                        <p className="text-xs text-gray-400 font-medium mt-1">이름과 휴대폰 본인인증으로 찾기</p>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => { setMode('RESET_PW'); setStep(2); }}
                                    className="flex items-center gap-5 p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-purple-300 hover:bg-purple-50/30 transition-all group group cursor-pointer text-left"
                                >
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                        <Lock className="w-7 h-7 text-gray-400 group-hover:text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-lg font-black text-gray-800 group-hover:text-purple-900">비밀번호 찾기</div>
                                        <p className="text-xs text-gray-400 font-medium mt-1">본인인증 후 새로운 비밀번호 설정</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight">본인 확인 절차</h2>
                                <p className="text-gray-400 text-sm font-medium">안전한 계정 찾기를 위해 본인인증이 필요합니다.</p>
                            </div>
                            <AgeVerificationBox onVerifySuccess={handleVerifySuccess} />
                        </div>
                    )}

                    {step === 3 && mode === 'FIND_ID' && (
                        <div className="space-y-8 animate-in fade-in scale-95 duration-500">
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-xl font-bold text-gray-800">아이디를 찾았습니다!</h2>
                                    <p className="text-gray-400 text-sm font-medium mt-1">보안을 위해 일부 정보가 마스킹 되었습니다.</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50/80 p-8 rounded-3xl border border-gray-100 text-center">
                                <span className="text-xs font-extrabold text-purple-600 uppercase tracking-widest block mb-2">찾으시는 아이디</span>
                                <span className="text-3xl font-black text-gray-800 tracking-tight italic">{foundId}</span>
                            </div>

                            <Button onClick={() => router.push('/login')} className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 text-lg">
                                로그인 화면으로 이동
                            </Button>
                        </div>
                    )}

                    {step === 3 && mode === 'RESET_PW' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center space-y-2 mb-8">
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight">비밀번호 재설정</h2>
                                <p className="text-gray-400 text-sm font-medium">정보 보호를 위해 새로운 비밀번호를 입력해 주세요.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black text-gray-500 uppercase ml-1">아이디 확인</Label>
                                    <Input 
                                        placeholder="본인의 아이디를 입력하세요" 
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        className="h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-purple-500/20 px-6 text-sm font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black text-gray-500 uppercase ml-1">새 비밀번호</Label>
                                        <Input 
                                            type="password"
                                            placeholder="변경할 비밀번호" 
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-purple-500/20 px-6 text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-black text-gray-500 uppercase ml-1">새 비밀번호 확인</Label>
                                        <Input 
                                            type="password"
                                            placeholder="비밀번호 다시 입력" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-14 bg-gray-50/50 border-gray-100 rounded-2xl focus:ring-purple-500/20 px-6 text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-xs font-bold animate-in shake duration-500">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <Button 
                                onClick={handleResetPassword}
                                disabled={isLoading}
                                className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 text-lg"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : '비밀번호 변경 완료'}
                            </Button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in scale-95 duration-500">
                            <div className="flex flex-col items-center gap-4 py-8 text-center">
                                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center border-4 border-purple-100">
                                    <CheckCircle2 className="w-10 h-10 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight">비밀번호가 안전하게<br/>변경되었습니다!</h2>
                                <p className="text-gray-400 text-sm font-medium">새로운 비밀번호로 다시 로그인 해주시기 바랍니다.</p>
                            </div>

                            <Button onClick={() => router.push('/login')} className="w-full h-14 bg-gray-800 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all text-lg">
                                로그인 하러 가기
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function FindAccountPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-purple-600">불로오기 중...</div>}>
            <FindAccountContent />
        </Suspense>
    );
}
