import { Suspense } from 'react';
import SubPageLayout from '@/components/layout/sub-page-layout';
import { SeekersListContent } from './seekers-list-content';
import { Loader2 } from 'lucide-react';

export default function SeekersPage() {
    return (
        <SubPageLayout
            title="인재정보"
            description="우리 매장에 딱 맞는 인재를 찾아보세요."
            hideSearch={true}
        >
            <Suspense fallback={
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="font-bold text-gray-400">인재 정보를 불러오고 있습니다...</p>
                </div>
            }>
                <SeekersListContent />
            </Suspense>
        </SubPageLayout>
    );
}
