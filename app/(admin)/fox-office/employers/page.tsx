'use client';

import { useState, useEffect } from 'react';
import { adminEmployerAction } from '@/lib/actions';
import { Search, Building2, CheckCircle2, XCircle, FileImage, ExternalLink } from 'lucide-react';
import { EmployerListItem } from '@/src/atoms/qa/admin/QA_GET_EMPLOYER_LIST';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function EmployersManagementPage() {
    const [employers, setEmployers] = useState<EmployerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEmployers = async () => {
        setLoading(true);
        try {
            const res = await adminEmployerAction({ actionType: 'GET_LIST' });
            if (res.success && 'data' in res && res.data) {
                setEmployers(res.data as EmployerListItem[]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployers();
    }, []);

    const toggleVerification = async (userId: string, currentStatus: boolean) => {
        const confirmMsg = currentStatus 
            ? '정말 이 업체의 인증을 해제(반려)하시겠습니까? 해당 업체의 광고 노출이 제한될 수 있습니다.' 
            : '이 업체의 사업자등록증을 확인하셨으며, 인증을 승인하시겠습니까?';
        
        if (!confirm(confirmMsg)) return;

        try {
            const res = await adminEmployerAction({
                actionType: 'TOGGLE_VERIFY',
                targetUserId: userId,
                isVerified: !currentStatus
            });
            if (res.success) {
                setEmployers(prev => prev.map(emp => 
                    emp.id === userId ? { ...emp, is_business_verified: !currentStatus } : emp
                ));
            } else {
                const errorMsg = 'message' in res ? res.message : ('error' in res ? res.error : '알 수 없는 오류');
                alert(`오류 발생: ${errorMsg}`);
            }
        } catch (error) {
            alert('시스템 오류가 발생했습니다.');
        }
    };

    const filteredEmployers = employers.filter(emp => 
        (emp.verified_business_name && emp.verified_business_name.includes(searchTerm)) ||
        (emp.verified_ceo_name && emp.verified_ceo_name.includes(searchTerm)) ||
        (emp.business_registration_number && emp.business_registration_number.includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-[24px] font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-primary" />
                        업체/인증 관리
                    </h1>
                    <p className="text-[14px] text-gray-500 font-medium mt-1">
                        사업자등록증 업로드 내역을 확인하고 유흥업종 여부를 2차 검수합니다.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative w-[300px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="상호명, 대표자명, 사업자번호 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-[14px] font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg">전체 {employers.length}개</span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">인증 {employers.filter(e => e.is_business_verified).length}개</span>
                    <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg">미인증 {employers.filter(e => !e.is_business_verified).length}개</span>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[12px] text-gray-500 font-bold">
                                <th className="py-4 px-6 font-medium">가입/인증일</th>
                                <th className="py-4 px-6 font-medium">상호명 / 대표자명</th>
                                <th className="py-4 px-6 font-medium">사업자등록번호</th>
                                <th className="py-4 px-6 font-medium text-center">등록증 (2차 검수)</th>
                                <th className="py-4 px-6 font-medium text-center">현재 상태</th>
                                <th className="py-4 px-6 font-medium text-center">액션</th>
                            </tr>
                        </thead>
                        <tbody className="text-[14px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                                        데이터를 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : filteredEmployers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500 font-medium">
                                        조회된 업체가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployers.map((emp) => (
                                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 text-gray-500 text-[12px] font-medium">
                                            {format(new Date(emp.created_at), 'yyyy-MM-dd HH:mm')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-900">{emp.verified_business_name || '미기재'}</div>
                                            <div className="text-[12px] text-gray-500">{emp.verified_ceo_name || '미기재'}</div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-[13px] text-gray-600">
                                            {emp.business_registration_number 
                                                ? emp.business_registration_number.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
                                                : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {emp.business_cert_image_url ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px] font-bold">
                                                            <FileImage className="w-3.5 h-3.5" />
                                                            사진 보기
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl bg-white p-2 border-0 overflow-hidden shadow-2xl rounded-2xl">
                                                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                                            <h3 className="font-bold text-[15px]">{emp.verified_business_name} 등록증 원본</h3>
                                                            <a href={emp.business_cert_image_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[12px] font-bold flex items-center gap-1">
                                                                새 창으로 열기 <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                        <div className="w-full bg-black/5 flex items-center justify-center p-4">
                                                            <img 
                                                                src={emp.business_cert_image_url} 
                                                                alt="Certificate" 
                                                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm border bg-white" 
                                                            />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <span className="text-[12px] text-gray-400 font-medium">미제출</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {emp.is_business_verified ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 font-bold">
                                                    <CheckCircle2 className="w-3 h-3" /> 1차 승인됨
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 gap-1 font-bold">
                                                    <XCircle className="w-3 h-3" /> 대기/반려
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <Button
                                                onClick={() => toggleVerification(emp.id, emp.is_business_verified)}
                                                variant={emp.is_business_verified ? "outline" : "default"}
                                                className={`h-8 px-4 text-[12px] font-bold ${
                                                    emp.is_business_verified 
                                                    ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700' 
                                                    : 'bg-primary hover:bg-primary/90 text-white'
                                                }`}
                                            >
                                                {emp.is_business_verified ? '승인 취소 (반려)' : '수동 승인하기'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
