import { Building2 } from 'lucide-react';
import BizProfileForm from './BizProfileForm';

export default async function BizProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> 업체 정보
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">업체 상호명, 사업자 정보, 연락처를 관리합니다.</p>
            </div>

            <BizProfileForm />
        </div>
    );
}
