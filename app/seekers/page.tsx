import SubPageLayout from '@/components/layout/sub-page-layout';
import { SeekersListContent } from './seekers-list-content';
import { auth } from '@/auth';

export default async function SeekersPage() {
    const session = await auth();
    const isEmployer = (session?.user as any)?.role === 'EMPLOYER';

    return (
        <SubPageLayout
            title="인재정보"
            description="우리 매장에 딱 맞는 인재를 찾아보세요."
            hideSearch={true}
        >
            <SeekersListContent isEmployer={isEmployer} />
        </SubPageLayout>
    );
}
