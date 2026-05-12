import { auth } from '@/auth';
import { Building2 } from 'lucide-react';
import BizProfileForm from './BizProfileForm';
import { createClient } from '@/utils/supabase/server';

export default async function BizProfilePage() {
    const session = await auth();
    const supabase = await createClient();
    
    let userProfile = session?.user as any;
    if (session?.user?.id) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (data) {
            userProfile = data;
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> 업체 정보
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">업체 상호명, 사업자 정보, 연락처를 관리합니다.</p>
            </div>

            <BizProfileForm user={userProfile} />
        </div>
    );
}
