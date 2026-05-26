'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Key, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { claimBizAdByCodeAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface ClaimAdModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ClaimAdModal({ isOpen, onClose }: ClaimAdModalProps) {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedCode) {
            setStatus({ type: 'error', message: '핀코드를 입력해주세요.' });
            return;
        }

        setLoading(true);
        setStatus({ type: null, message: '' });

        try {
            const res = await claimBizAdByCodeAction(trimmedCode);
            if (res.success) {
                setStatus({ type: 'success', message: res.message || '소유권이 이전되었습니다!' });
                setCode('');
                setTimeout(() => {
                    onClose();
                    setStatus({ type: null, message: '' });
                    router.refresh();
                    window.location.reload(); // 리스트 갱신 유도
                }, 2000);
            } else {
                setStatus({ type: 'error', message: res.message || '인증에 실패했습니다.' });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: '서버 통신 중 오류가 발생했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border border-gray-100">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                            <Key className="w-4 h-4 text-primary" />
                        </div>
                        대행 광고 소유권 수령 (Claim)
                    </DialogTitle>
                    <DialogDescription className="text-[12px] font-medium text-gray-500 leading-relaxed">
                        대행 계정에서 임시로 제작 및 게시해둔 광고의 **6자리 핀코드(Claim Code)**를 입력해 주세요. 인증이 완료되면 즉시 본인의 광고 관리 목록으로 이전됩니다.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-3">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            소유권 이전 핀코드 입력
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            disabled={loading || status.type === 'success'}
                            className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-center text-lg font-black outline-none focus:border-primary focus:bg-orange-50/10 uppercase tracking-widest transition-all bg-gray-50/50"
                            placeholder="EX: FX99AA"
                            maxLength={10}
                            autoFocus
                        />
                    </div>

                    {status.message && (
                        <div className={`flex items-start gap-2 p-3.5 rounded-xl border text-[12px] font-bold ${
                            status.type === 'success' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                : 'bg-red-50 border-red-100 text-red-700'
                        }`}>
                            {status.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                            )}
                            <div className="leading-snug">{status.message}</div>
                        </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 text-[13px] font-black rounded-xl border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-gray-700 h-auto"
                        >
                            닫기
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !code || status.type === 'success'}
                            className="flex-1 py-3 text-[13px] font-black text-white bg-primary hover:bg-orange-600 rounded-xl active:scale-95 transition-all shadow-md h-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                    조회 중...
                                </>
                            ) : (
                                '소유권 가져오기'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
