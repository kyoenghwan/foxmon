import { QA_GET_ALL_USERS } from '@/src/atoms/qa/admin/QA_GET_ALL_USERS';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, Users, ShieldCheck, User } from 'lucide-react';

export default async function UsersManagementPage() {
    const res = await QA_GET_ALL_USERS();
    const users = res.success && res.data ? res.data : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        회원 관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        전체 회원의 정보를 조회하고 계정 상태를 관리합니다.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="이름, 아이디, 닉네임 검색..." 
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] w-[260px] focus:outline-none focus:border-primary font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[12px] font-bold text-gray-600">
                            <tr>
                                <th className="p-4 w-12 text-center">No</th>
                                <th className="p-4">유저 아이디</th>
                                <th className="p-4">이름 / 닉네임</th>
                                <th className="p-4">권한</th>
                                <th className="p-4">업체 등급</th>
                                <th className="p-4">휴대폰 번호</th>
                                <th className="p-4">성인인증</th>
                                <th className="p-4 text-center">가입일</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user: any, idx: number) => (
                                <tr key={user.id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="p-4 text-center font-medium text-gray-500 text-[13px]">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 text-[13px]">{user.login_id}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-gray-900 text-[13px]">{user.name || '-'}</span>
                                            <span className="text-[11px] text-gray-500 font-medium">{user.nickname || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
                                            <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[11px] px-2 py-0.5"><ShieldCheck className="w-3 h-3 mr-1" /> 관리자</Badge>
                                        ) : user.role === 'EMPLOYER' ? (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-[11px] px-2 py-0.5">업체회원</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-600 border-gray-200 text-[11px] px-2 py-0.5"><User className="w-3 h-3 mr-1" /> 일반회원</Badge>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {user.merchant_tier === 'VIP' ? (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] px-2 py-0.5">🎖️ 우수</Badge>
                                        ) : user.merchant_tier === 'VVIP' ? (
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] px-2 py-0.5">🏆 으뜸</Badge>
                                        ) : user.merchant_tier === 'VVVIP' ? (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[11px] px-2 py-0.5">👑 명가</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-400 border-gray-200 text-[11px] px-2 py-0.5">일반</Badge>
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-gray-600 text-[13px]">
                                        {user.phone_number || '-'}
                                    </td>
                                    <td className="p-4">
                                        {user.is_age_verified ? (
                                            <span className="text-green-600 font-bold text-[12px] bg-green-50 px-2 py-1 rounded">인증됨</span>
                                        ) : (
                                            <span className="text-gray-400 font-medium text-[12px]">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center text-gray-500 font-medium text-[13px]">
                                        {format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-500 font-medium">
                                        조회된 회원이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
