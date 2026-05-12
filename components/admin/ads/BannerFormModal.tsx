'use client';

import React, { useState } from 'react';
import { adminSiteBannerAction } from '@/lib/actions';
import { SiteBannerInput } from '@/src/atoms/oa/admin/OA_UPSERT_SITE_BANNER';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Upload, ImageIcon } from 'lucide-react';

interface BannerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    onSuccess?: () => void;
}

export function BannerFormModal({ isOpen, onClose, initialData, onSuccess }: BannerFormModalProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [type, setType] = useState<'POPUP' | 'MAIN_BANNER'>(initialData?.type || 'POPUP');
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
    const [linkUrl, setLinkUrl] = useState(initialData?.link_url || '');
    const [isActive, setIsActive] = useState(initialData ? initialData.is_active : true);
    
    // date inputs as local date string
    const [startDate, setStartDate] = useState(initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '');
    const [endDate, setEndDate] = useState(initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('이미지는 5MB 이하로 업로드해주세요.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Max sizes
                const MAX_WIDTH = 1200;
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    setImageUrl(canvas.toDataURL('image/jpeg', 0.8));
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!title || !imageUrl) {
            setError('제목과 이미지는 필수 항목입니다.');
            return;
        }

        setLoading(true);
        setError('');

        const payload: SiteBannerInput = {
            id: initialData?.id,
            title,
            type,
            image_url: imageUrl,
            link_url: linkUrl || undefined,
            is_active: isActive,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null
        };

        try {
            const result = await adminSiteBannerAction('UPSERT', payload);
            if (result.success) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                setError(result.message);
            }
        } catch (e: any) {
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">
                        {initialData ? '배너 / 팝업 수정' : '새 배너 등록'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 font-medium">
                        팝업 배너 또는 메인 롤링 배너를 등록하고 노출 기간을 설정하세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                    {/* 타입 선택 */}
                    <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                            <input type="radio" name="banner_type" value="POPUP" className="peer sr-only" checked={type === 'POPUP'} onChange={() => setType('POPUP')} />
                            <div className="p-4 border-2 rounded-xl text-center peer-checked:border-primary peer-checked:bg-orange-50 transition-colors">
                                <div className="font-black text-gray-900">이벤트 팝업</div>
                                <div className="text-[11px] text-gray-500 mt-1">앱 접속 시 중앙에 노출</div>
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                            <input type="radio" name="banner_type" value="MAIN_BANNER" className="peer sr-only" checked={type === 'MAIN_BANNER'} onChange={() => setType('MAIN_BANNER')} />
                            <div className="p-4 border-2 rounded-xl text-center peer-checked:border-primary peer-checked:bg-orange-50 transition-colors">
                                <div className="font-black text-gray-900">메인 롤링 배너</div>
                                <div className="text-[11px] text-gray-500 mt-1">홈 화면 최상단에 노출</div>
                            </div>
                        </label>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[12px] font-bold text-gray-600">배너 제목</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-lg mt-1 outline-none focus:border-primary"
                                placeholder="예: 구직자 가입 스벅 100% 이벤트"
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-gray-600">이미지 첨부 (필수)</label>
                            <label className="block w-full h-32 border-2 border-dashed rounded-lg mt-1 cursor-pointer hover:border-primary hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="preview" className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                                        <span className="text-[12px] text-gray-500 font-medium">클릭하여 이미지 업로드</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-gray-600">클릭 시 이동할 링크 URL (선택)</label>
                            <input 
                                type="text" 
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-lg mt-1 outline-none focus:border-primary"
                                placeholder="예: https://foxmon.com/event"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-600">노출 시작 일시 (선택)</label>
                                <input 
                                    type="datetime-local" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg mt-1 outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-gray-600">노출 종료 일시 (선택)</label>
                                <input 
                                    type="datetime-local" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg mt-1 outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400">날짜를 지정하지 않으면 상시 노출로 처리됩니다.</p>

                        <div className="flex items-center gap-2 pt-2 border-t">
                            <input 
                                type="checkbox" 
                                id="isActive" 
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                            />
                            <label htmlFor="isActive" className="text-sm font-bold text-gray-800 cursor-pointer">
                                즉시 노출 활성화 (Active)
                            </label>
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded-lg">{error}</div>}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} disabled={loading} className="font-bold">취소</Button>
                        <Button onClick={handleSave} disabled={loading} className="font-bold bg-primary hover:bg-orange-600 text-white min-w-[80px]">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장하기'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
