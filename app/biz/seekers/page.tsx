import { Users, FileText } from 'lucide-react';

export default function BizSeekersPage() {
    // 추후 QA_GET_APPLICANTS 연동 예정
    const applicants: any[] = [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> 지원자 관리
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                    내 광고에 지원한 구직자 목록을 확인하고 이력서를 검토하세요.
                </p>
            </div>

            {applicants.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-gray-800">아직 지원자가 없습니다</h3>
                        <p className="text-[13px] font-medium text-gray-500 mt-1 max-w-sm">
                            광고를 등록하면 구직자들이 지원할 수 있습니다.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {applicants.map((app: any) => (
                        <div key={app.id} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                {app.photo_url
                                    ? <img src={app.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                                    : <Users className="w-6 h-6 text-gray-400" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[15px] text-gray-900">{app.nickname}</p>
                                <p className="text-[12px] text-gray-500">{app.ad_title} 지원 · {new Date(app.applied_at).toLocaleDateString()}</p>
                            </div>
                            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-[12px] font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                                <FileText className="w-3.5 h-3.5" /> 이력서 보기
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
