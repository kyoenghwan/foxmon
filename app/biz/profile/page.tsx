import { auth } from '@/auth';
import { Building2 } from 'lucide-react';

export default async function BizProfilePage() {
    const session = await auth();
    const user = session?.user as any;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> 업체 정보
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">업체 상호명, 사업자 정보, 연락처를 관리합니다.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">상호명</label>
                        <input 
                            type="text" defaultValue={user?.business_name || ''} 
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                            placeholder="업체 상호명"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">대표자명</label>
                        <input 
                            type="text" defaultValue={user?.representative_name || ''} 
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">사업자번호</label>
                        <input 
                            type="text" defaultValue={user?.business_number || ''} readOnly
                            className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-[14px] bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">업종</label>
                        <input 
                            type="text" defaultValue={user?.business_category || ''} 
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                        />
                    </div>
                </div>
                <div className="pt-2 flex justify-end">
                    <button className="px-6 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm">
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
