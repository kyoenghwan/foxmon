'use client';

import { useState, useEffect } from 'react';
import { adminEmployerAction } from '@/lib/actions';
import { Search, Building2, CheckCircle2, XCircle, FileImage, ExternalLink, Coins, Plus } from 'lucide-react';
import { EmployerListItem } from '@/src/atoms/qa/admin/QA_GET_EMPLOYER_LIST';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AdminPointHistoryModal } from '@/components/admin/points/AdminPointHistoryModal';

export default function EmployersManagementPage() {
    const [employers, setEmployers] = useState<EmployerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

    // 포인트 지급 모달 상태
    const [selectedEmployer, setSelectedEmployer] = useState<EmployerListItem | null>(null);
    const [pointAmount, setPointAmount] = useState<number | ''>('');
    const [pointType, setPointType] = useState<'PAID' | 'BONUS'>('PAID');
    const [pointDesc, setPointDesc] = useState('');
    const [isSubmittingPoint, setIsSubmittingPoint] = useState(false);

    // 포인트 내역 모달 상태
    const [historyModalEmployer, setHistoryModalEmployer] = useState<EmployerListItem | null>(null);

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
            ? '정말 이 업체의 2차 인증(사업자등록증)을 해제(반려)하시겠습니까? 해당 업체의 광고 노출이 제한될 수 있습니다.' 
            : '이 업체의 사업자등록증을 확인하셨으며, 2차 인증을 승인하시겠습니까?';
        
        if (!confirm(confirmMsg)) return;

        try {
            const res = await adminEmployerAction({
                actionType: 'TOGGLE_VERIFY',
                targetUserId: userId,
                isVerified: !currentStatus
            });
            if (res.success) {
                setEmployers(prev => prev.map(emp => 
                    emp.id === userId ? { ...emp, is_cert_verified: !currentStatus } : emp
                ));
            } else {
                const errorMsg = 'message' in res ? res.message : ('error' in res ? res.error : '알 수 없는 오류');
                alert(`오류 발생: ${errorMsg}`);
            }
        } catch (error) {
            alert('시스템 오류가 발생했습니다.');
        }
    };

    const handleGivePoints = async () => {
        if (!selectedEmployer || typeof pointAmount !== 'number' || pointAmount === 0 || !pointDesc.trim()) {
            alert('금액과 지급 사유를 정확히 입력해주세요.');
            return;
        }

        if (!confirm(`[${selectedEmployer.verified_business_name || selectedEmployer.email}]님에게 ${pointAmount.toLocaleString()} P를 지급/차감 하시겠습니까?`)) {
            return;
        }

        setIsSubmittingPoint(true);
        try {
            const res = await adminEmployerAction({
                actionType: 'GIVE_POINTS',
                targetUserId: selectedEmployer.id,
                paidPointsDiff: pointType === 'PAID' ? pointAmount : 0,
                bonusPointsDiff: pointType === 'BONUS' ? pointAmount : 0,
                description: pointDesc
            });

            if (res.success) {
                alert('포인트 지급 처리가 완료되었습니다.');
                setSelectedEmployer(null);
                setPointAmount('');
                setPointDesc('');
                fetchEmployers(); // 새 잔액 반영
            } else {
                alert(`지급 실패: ${'message' in res ? res.message : '알 수 없는 오류'}`);
            }
        } catch (e) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmittingPoint(false);
        }
    };

    const searchFiltered = employers.filter(emp => {
        const matchesSearch = !searchTerm ||
            (emp.verified_business_name && emp.verified_business_name.includes(searchTerm)) ||
            (emp.verified_ceo_name && emp.verified_ceo_name.includes(searchTerm)) ||
            (emp.business_registration_number && emp.business_registration_number.includes(searchTerm)) ||
            (emp.email && emp.email.includes(searchTerm));
        
        if (!matchesSearch) return false;

        if (filterType === 'VERIFIED') return emp.is_cert_verified;
        if (filterType === 'UNVERIFIED') return !emp.is_cert_verified;
        return true;
    });

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
                        사업자등록증 업로드 내역을 확인하고 유흥업종 여부를 2차 검수합니다. 포인트 지급도 가능합니다.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-[300px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="상호명, 대표자명, 이메일 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-[14px] font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-2 text-[13px] font-bold">
                    <button 
                        onClick={() => setFilterType('ALL')}
                        className={`px-4 py-2 rounded-xl transition-all ${filterType === 'ALL' ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        전체 {employers.length}개
                    </button>
                    <button 
                        onClick={() => setFilterType('VERIFIED')}
                        className={`px-4 py-2 rounded-xl transition-all ${filterType === 'VERIFIED' ? 'bg-green-600 text-white shadow-md' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                        2차 승인 {employers.filter(e => e.is_cert_verified).length}개
                    </button>
                    <button 
                        onClick={() => setFilterType('UNVERIFIED')}
                        className={`px-4 py-2 rounded-xl transition-all ${filterType === 'UNVERIFIED' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                    >
                        승인 대기/미인증 {employers.filter(e => !e.is_cert_verified).length}개
                    </button>
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
                                <th className="py-4 px-6 font-medium">사업자/아이디</th>
                                <th className="py-4 px-6 font-medium text-center">보유 포인트</th>
                                <th className="py-4 px-6 font-medium text-center">등록증 (2차 검수)</th>
                                <th className="py-4 px-6 font-medium text-center">인증 상태</th>
                                <th className="py-4 px-6 font-medium text-right">관리 액션</th>
                            </tr>
                        </thead>
                        <tbody className="text-[14px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                                        데이터를 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : searchFiltered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                                        조회된 업체가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                searchFiltered.map((emp) => (
                                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 text-gray-500 text-[12px] font-medium whitespace-nowrap">
                                            {format(new Date(emp.created_at), 'yyyy-MM-dd HH:mm')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-900">{emp.verified_business_name || '미기재'}</div>
                                            <div className="text-[12px] text-gray-500">{emp.verified_ceo_name || '미기재'}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-mono text-[13px] text-gray-600">
                                                {emp.business_registration_number 
                                                    ? emp.business_registration_number.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
                                                    : '미기재'}
                                            </div>
                                            <div className="text-[12px] text-gray-400 font-bold mt-1">ID: {emp.login_id || '알 수 없음'}</div>
                                            {emp.email && <div className="text-[11px] text-gray-400">{emp.email}</div>}
                                        </td>
                                        <td className="py-4 px-6 text-center align-top">
                                            <div className="font-black text-blue-600">{Number(emp.paid_points || 0).toLocaleString()}P</div>
                                            <div className="text-[11px] text-green-600 font-bold mb-1">+{Number(emp.bonus_points || 0).toLocaleString()}P</div>
                                            {emp.admin_memo && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-block mt-1">
                                                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] cursor-help px-1.5 py-0">⚠️ 데이터 이상</Badge>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] text-[12px] bg-red-600 text-white border-red-700">
                                                            {emp.admin_memo}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <div className="mt-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 text-[11px] text-gray-500 hover:text-blue-600 border border-gray-200"
                                                    onClick={() => setHistoryModalEmployer(emp)}
                                                >
                                                    내역 보기
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {(emp.business_cert_image_url || emp.verification_doc_url) ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12px] font-bold">
                                                            <FileImage className="w-3.5 h-3.5" />
                                                            {emp.business_type === '사업자' ? '등록증 보기' : '신분증 보기'}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl bg-white p-2 border-0 overflow-hidden shadow-2xl rounded-2xl">
                                                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                                            <h3 className="font-bold text-[15px]">
                                                                {emp.business_type === '사업자' 
                                                                    ? `${emp.verified_business_name || emp.nickname || '업체'} 등록증 원본` 
                                                                    : `${emp.nickname || '일반업자'} 신분증 원본`
                                                                }
                                                            </h3>
                                                            <a href={emp.business_cert_image_url || emp.verification_doc_url || undefined} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[12px] font-bold flex items-center gap-1">
                                                                새 창으로 열기 <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                        <div className="w-full bg-black/5 flex items-center justify-center p-4">
                                                            <img 
                                                                src={emp.business_cert_image_url || emp.verification_doc_url || undefined} 
                                                                alt="Verification Document" 
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
                                            {emp.is_cert_verified ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-bold">
                                                    <CheckCircle2 className="w-3 h-3" /> 2차 승인됨
                                                </Badge>
                                            ) : emp.is_business_verified ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 font-bold">
                                                    <CheckCircle2 className="w-3 h-3" /> 1차 완료 (서류 대기)
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 gap-1 font-bold">
                                                    <XCircle className="w-3 h-3" /> 미인증
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={selectedEmployer?.id === emp.id} onOpenChange={(open) => !open && setSelectedEmployer(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedEmployer(emp)}
                                                            className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold"
                                                        >
                                                            <Coins className="w-3.5 h-3.5 mr-1" />
                                                            포인트 제어
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <div className="p-4">
                                                            <h3 className="font-black text-lg mb-1 flex items-center gap-2">
                                                                <Coins className="text-blue-500" /> 포인트 수동 제어
                                                            </h3>
                                                            <p className="text-[13px] text-gray-500 mb-6">
                                                                <strong className="text-gray-900">{emp.verified_business_name || emp.email}</strong> 업체에게 포인트를 지급하거나 차감합니다. (마이너스 입력 시 차감)
                                                            </p>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">포인트 유형</label>
                                                                    <div className="flex gap-2">
                                                                        <Button 
                                                                            variant={pointType === 'PAID' ? 'default' : 'outline'}
                                                                            onClick={() => setPointType('PAID')}
                                                                            className="flex-1 font-bold"
                                                                        >유료 포인트</Button>
                                                                        <Button 
                                                                            variant={pointType === 'BONUS' ? 'default' : 'outline'}
                                                                            onClick={() => setPointType('BONUS')}
                                                                            className="flex-1 font-bold"
                                                                        >보너스 포인트</Button>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">금액 (P)</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={pointAmount}
                                                                        onChange={e => setPointAmount(Number(e.target.value) || '')}
                                                                        placeholder="예: 50000 또는 -50000"
                                                                        className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary font-mono text-[15px]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">지급/차감 사유 (필수)</label>
                                                                    <input 
                                                                        type="text" 
                                                                        value={pointDesc}
                                                                        onChange={e => setPointDesc(e.target.value)}
                                                                        placeholder="예: 무통장입금 확인 (10만)"
                                                                        className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary text-[14px]"
                                                                    />
                                                                </div>
                                                                <Button 
                                                                    onClick={handleGivePoints}
                                                                    disabled={isSubmittingPoint}
                                                                    className="w-full mt-4 font-black h-12"
                                                                >
                                                                    {isSubmittingPoint ? '처리중...' : '포인트 적용하기'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button
                                                    onClick={() => toggleVerification(emp.id, emp.is_cert_verified)}
                                                    variant={emp.is_cert_verified ? "outline" : "default"}
                                                    size="sm"
                                                    className={`h-8 px-3 text-[12px] font-bold ${
                                                        emp.is_cert_verified 
                                                        ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700' 
                                                        : 'bg-primary hover:bg-primary/90 text-white'
                                                    }`}
                                                >
                                                    {emp.is_cert_verified ? '승인 취소' : '수동 승인'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 포인트 내역 및 검증 모달 */}
            <AdminPointHistoryModal 
                isOpen={!!historyModalEmployer} 
                onClose={() => setHistoryModalEmployer(null)} 
                employer={historyModalEmployer} 
            />
        </div>
    );
}
