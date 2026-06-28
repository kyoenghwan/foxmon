import { QA_GET_JOB_BY_ID } from '@/src/atoms/qa/auth/QA_GET_JOB_BY_ID';
import EditBannerForm from './EditBannerForm';

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    const result = await QA_GET_JOB_BY_ID(id);
    
    if (!result.success || !result.data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold text-gray-800 mb-2">배너를 찾을 수 없습니다.</h2>
                <p className="text-gray-500">삭제되었거나 접근 권한이 없는 배너 템플릿입니다.</p>
            </div>
        );
    }

    return <EditBannerForm initialData={result.data} adId={id} />;
}
