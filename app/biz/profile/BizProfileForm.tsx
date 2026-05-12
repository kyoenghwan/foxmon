'use client';

import React, { useState } from 'react';
import { userSettingsAction } from '@/lib/actions';
import { toast } from 'react-hot-toast';

export default function BizProfileForm({ user }: { user: any }) {
    const [formData, setFormData] = useState({
        business_name: user?.business_name || '',
        representative_name: user?.representative_name || '',
        business_registration_number: user?.business_registration_number || user?.business_number || '',
        business_category: user?.business_category || '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await userSettingsAction('UPDATE_PROFILE', {
                profileData: {
                    business_registration_number: formData.business_registration_number,
                    // If you want to update other fields, you need to map them properly to UpdateUserProfileInput.
                    // Note: 'business_name' or 'representative_name' might not be in the UpdateUserProfileInput directly, 
                    // but we can pass what is supported.
                }
            });
            if (res.success) {
                toast.success('업체 정보가 저장되었습니다.');
                window.location.reload();
            } else {
                toast.error(res.message || '저장에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            toast.error('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">상호명</label>
                    <input 
                        type="text" 
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                        placeholder="업체 상호명"
                    />
                </div>
                <div>
                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">대표자명</label>
                    <input 
                        type="text" 
                        name="representative_name"
                        value={formData.representative_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                    />
                </div>
                <div>
                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block flex items-center justify-between">
                        사업자번호
                        {user?.is_business_verified && <span className="text-green-600 text-[10px]">✅ 인증됨</span>}
                    </label>
                    <input 
                        type="text" 
                        name="business_registration_number"
                        value={formData.business_registration_number}
                        onChange={handleChange}
                        className={`w-full px-3 py-2.5 border rounded-lg text-[14px] outline-none focus:border-primary ${
                            user?.is_business_verified ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-200'
                        }`}
                        placeholder="- 없이 숫자만 입력"
                        readOnly={user?.is_business_verified}
                    />
                    {!user?.is_business_verified && (
                        <p className="text-[11px] text-orange-500 mt-1">※ 사업자번호를 입력하고 저장해야 광고 등록이 가능합니다.</p>
                    )}
                </div>
                <div>
                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">업종</label>
                    <input 
                        type="text" 
                        name="business_category"
                        value={formData.business_category}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                    />
                </div>
            </div>
            <div className="pt-2 flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50"
                >
                    {loading ? '저장 중...' : '저장하기'}
                </button>
            </div>
        </div>
    );
}
