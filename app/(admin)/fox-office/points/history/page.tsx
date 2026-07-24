'use client';

import { useState, useEffect } from 'react';
import { adminUserAction, adminEmployerAction } from '@/lib/actions';
import { format } from 'date-fns';
import { Search, Coins, RefreshCw, ArrowUpRight, ArrowDownRight, User, ShieldCheck, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PointHistoryManagementPage() {
    const [txList, setTxList] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // 검색 및 유저 필터 상태
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // 포인트 제어 폼 상태
    const [pointAmount, setPointAmount] = useState<number | ''>('');
    const [pointType, setPointType] = useState<'PAID' | 'BONUS' | 'ACTIVITY'>('PAID');
    const [pointDesc, setPointDesc] = useState('');
    const [isSubmittingPoint, setIsSubmittingPoint] = useState(false);

    // 1. 최근 통합 거래 이력 패치
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await adminUserAction('GET_ALL_POINT_HISTORY');
                if (res.success && res.data) {
                    setTxList(res.data);
                }
            } catch (e) {
                console.error('포인트 이력을 불러오는 중 오류:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [refreshTrigger]);

    // 2. 검색용 전체 유저 목록 패치
    useEffect(() => {
        const fetchUsersList = async () => {
            setUsersLoading(true);
            try {
                const res = await adminUserAction('GET_LIST');
                if (res.success && res.data) {
                    setUsers(res.data);
                }
            } catch (e) {
                console.error('유저 목록 패치 에러:', e);
            } finally {
                setUsersLoading(false);
            }
        };
        fetchUsersList();
    }, []);

    // 유저 선택 시 포인트 타입 자동 분기
    useEffect(() => {
        if (selectedUser) {
            if (selectedUser.role === 'EMPLOYER') {
                setPointType('PAID');
            } else {
                setPointType('ACTIVITY');
            }
        }
    }, [selectedUser]);

    // 실시간 유저 자동완성 검색 리스트
    const filteredSearchUsers = users.filter(u => {
        if (!userSearchTerm.trim()) return false;
        return (
            (u.name && u.name.includes(userSearchTerm)) ||
            (u.nickname && u.nickname.includes(userSearchTerm)) ||
            (u.login_id && u.login_id.includes(userSearchTerm))
        );
    }).slice(0, 5); // 5개만 노출

    // 포인트 지급/차감 승인 처리
    const handleGivePoints = async () => {
        if (!selectedUser || typeof pointAmount !== 'number' || pointAmount === 0 || !pointDesc.trim()) {
            alert('금액과 사유를 올바르게 작성해주세요.');
            return;
        }

        const isEmp = selectedUser.role === 'EMPLOYER';
        const typeLabel = pointType === 'PAID' ? '유료 포인트' : pointType === 'BONUS' ? '보너스 포인트' : '활동 포인트';

        if (!confirm(`[${selectedUser.name || selectedUser.login_id}]님에게 ${pointAmount.toLocaleString()} P (${typeLabel})를 수동 지급/차감하시겠습니까?`)) {
            return;
        }

        setIsSubmittingPoint(true);
        try {
            let res;
            if (isEmp) {
                res = await adminEmployerAction({
                    actionType: 'GIVE_POINTS',
                    targetUserId: selectedUser.id,
                    paidPointsDiff: pointType === 'PAID' ? pointAmount : 0,
                    bonusPointsDiff: pointType === 'BONUS' ? pointAmount : 0,
                    description: pointDesc
                });
            } else {
                res = await adminUserAction('GIVE_ACTIVITY_POINTS', {
                    targetUserId: selectedUser.id,
                    amountDiff: pointAmount,
                    description: pointDesc
                });
            }

            if (res.success) {
                alert('포인트 제어 처리가 정상 반영되었습니다.');
                setPointAmount('');
                setPointDesc('');
                
                // 선택된 유저의 최신 잔액 정보 업데이트를 위해 유저 목록 및 최근 기록 갱신
                const updatedUsersRes = await adminUserAction('GET_LIST');
                if (updatedUsersRes.success && updatedUsersRes.data) {
                    setUsers(updatedUsersRes.data);
                    const updated = updatedUsersRes.data.find((u: any) => u.id === selectedUser.id);
                    if (updated) setSelectedUser(updated);
                }
                setRefreshTrigger(prev => prev + 1);
            } else {
                alert(`처리 실패: ${res.message || '알 수 없는 오류'}`);
            }
        } catch (e) {
            alert('시스템 오류가 발생했습니다.');
        } finally {
            setIsSubmittingPoint(false);
        }
    };

    // 필터링된 거래 이력
    // 특정 유저를 선택했다면 해당 유저의 이력만 보여주고, 선택하지 않았다면 전체 최신 거래 목록 노출
    const displayedTransactions = selectedUser 
        ? txList.filter(tx => tx.user_id === selectedUser.id)
        : txList;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Coins className="w-6 h-6 text-primary" />
                        포인트 이력관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        전체 회원의 최근 포인트 거래 내역을 모니터링하고, 특정 유저를 지정하여 포인트 수동 제어(지급/차감)를 수행합니다.
                    </p>
                </div>
                
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setRefreshTrigger(prev => prev + 1)} 
                    disabled={loading}
                    className="h-9 px-3 gap-1 bg-white font-bold"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </Button>
            </div>

            {/* 메인 콘텐츠 영역 (유저 검색 + 포인트 제어 폼 / 최근 거래 이력 목록) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* 1. 유저 포인트 검색 및 제어 판넬 (좌측 4컬럼) */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
                        <h3 className="font-black text-md text-gray-900 flex items-center gap-1.5 border-b pb-3">
                            <User className="w-4 h-4 text-primary" /> 유저 포인트 제어
                        </h3>

                        {/* 유저 검색창 */}
                        <div className="space-y-2 relative">
                            <label className="text-[11px] font-bold text-gray-400 block uppercase">회원 검색</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="이름, 아이디, 닉네임 검색..." 
                                    value={userSearchTerm}
                                    onChange={e => setUserSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] font-medium outline-none focus:bg-white focus:border-primary transition-all"
                                />
                                {userSearchTerm && (
                                    <button 
                                        onClick={() => setUserSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* 자동완성 팝오버 결과 */}
                            {filteredSearchUsers.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50 divide-y divide-gray-50">
                                    {filteredSearchUsers.map((u: any) => (
                                        <div 
                                            key={u.id}
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setUserSearchTerm('');
                                            }}
                                            className="p-3 hover:bg-orange-50/40 cursor-pointer flex items-center justify-between transition-colors"
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900 text-[13px]">{u.name || u.login_id}</div>
                                                <div className="text-[11px] text-gray-400">{u.nickname || '-'} / {u.login_id}</div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {u.role === 'EMPLOYER' ? '업체' : '일반'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 선택된 유저 정보 표시 및 제어 폼 */}
                        {selectedUser ? (
                            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 bg-orange-50/40 rounded-xl border border-orange-100/50 relative">
                                    <button 
                                        onClick={() => setSelectedUser(null)}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="text-[10px] font-bold text-orange-600 mb-1">선택된 회원 정보</div>
                                    <div className="font-black text-[15px] text-gray-900 flex items-center gap-1.5">
                                        {selectedUser.name || selectedUser.login_id}
                                        {selectedUser.role === 'EMPLOYER' ? (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 text-[9px] px-1.5 h-4 font-bold">업체회원</Badge>
                                        ) : (
                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 text-[9px] px-1.5 h-4 font-bold">일반회원</Badge>
                                        )}
                                    </div>
                                    <div className="text-[12px] text-gray-500 font-mono mt-0.5">{selectedUser.login_id}</div>
                                    
                                    <div className="border-t border-dashed border-orange-200/50 mt-3 pt-3 flex justify-between items-center text-[12px]">
                                        <span className="font-bold text-gray-500">현재 잔고:</span>
                                        {selectedUser.role === 'EMPLOYER' ? (
                                            <div className="text-right">
                                                <div className="font-black text-blue-600">유료 {Number(selectedUser.paid_points || 0).toLocaleString()} P</div>
                                                <div className="text-[10px] text-green-600 font-bold">보너스 +{Number(selectedUser.bonus_points || 0).toLocaleString()} P</div>
                                            </div>
                                        ) : (
                                            <span className="font-black text-purple-600">{Number(selectedUser.activity_points || 0).toLocaleString()} P (활동)</span>
                                        )}
                                    </div>
                                </div>

                                {/* 포인트 변동 입력 폼 */}
                                <div className="space-y-4 pt-1">
                                    {selectedUser.role === 'EMPLOYER' ? (
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">포인트 구분</label>
                                            <div className="flex gap-2">
                                                <Button 
                                                    type="button"
                                                    variant={pointType === 'PAID' ? 'default' : 'outline'}
                                                    onClick={() => setPointType('PAID')}
                                                    className="flex-1 font-bold h-8 text-[11px]"
                                                >유료</Button>
                                                <Button 
                                                    type="button"
                                                    variant={pointType === 'BONUS' ? 'default' : 'outline'}
                                                    onClick={() => setPointType('BONUS')}
                                                    className="flex-1 font-bold h-8 text-[11px]"
                                                >보너스</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">포인트 구분</label>
                                            <Button 
                                                type="button"
                                                variant="default"
                                                className="w-full font-bold h-8 text-[11px] bg-purple-600 hover:bg-purple-700 text-white cursor-default"
                                            >일반 활동 포인트 (Activity)</Button>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">금액 (P)</label>
                                        <input 
                                            type="number" 
                                            value={pointAmount}
                                            onChange={e => setPointAmount(Number(e.target.value) || '')}
                                            placeholder="예: 10000 또는 -5000 (차감)"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary font-mono text-[14px] font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-gray-400 mb-1.5 block">지급/차감 사유 (필수)</label>
                                        <input 
                                            type="text" 
                                            value={pointDesc}
                                            onChange={e => setPointDesc(e.target.value)}
                                            placeholder="예: 이벤트 당첨 보상"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary text-[12px] font-medium"
                                        />
                                    </div>

                                    <Button 
                                        onClick={handleGivePoints}
                                        disabled={isSubmittingPoint}
                                        className="w-full font-black h-11 text-xs"
                                    >
                                        {isSubmittingPoint ? '반영하는 중...' : '포인트 즉시 적용'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-gray-400 font-medium text-[12px] bg-gray-50/50 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2">
                                <Coins className="w-8 h-8 text-gray-300" />
                                <span>상단의 검색창을 통해 회원을 선택하시면<br/>포인트를 직접 수동 지급/차감할 수 있습니다.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. 포인트 이력 리스트 (우측 8컬럼) */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50/30">
                            <h3 className="font-black text-md text-gray-900 flex items-center gap-1.5">
                                {selectedUser ? (
                                    <>
                                        <span className="text-primary font-black">[{selectedUser.name || selectedUser.login_id}]</span> 님의 포인트 이력
                                    </>
                                ) : (
                                    <>최근 통합 포인트 거래 이력</>
                                )}
                            </h3>
                            {selectedUser && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedUser(null)}
                                    className="h-7 text-[11px] font-bold text-gray-500 hover:text-gray-700 bg-white"
                                >
                                    전체 내역 보기
                                </Button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[11px] font-bold text-gray-500">
                                    <tr>
                                        <th className="p-4 font-semibold">일시</th>
                                        <th className="p-4 font-semibold">회원 정보</th>
                                        <th className="p-4 font-semibold">포인트 분류</th>
                                        <th className="p-4 font-semibold">유형</th>
                                        <th className="p-4 font-semibold text-right">변동 금액</th>
                                        <th className="p-4 font-semibold text-right">거래 후 잔액</th>
                                        <th className="p-4 font-semibold">상세 내용</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[12px] font-medium text-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-gray-400 font-bold text-sm">
                                                이력을 불러오는 중입니다...
                                            </td>
                                        </tr>
                                    ) : displayedTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-gray-400 font-bold text-sm">
                                                조회된 포인트 거래 이력이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedTransactions.map((tx: any) => {
                                            const isDeduction = tx.type === 'DEDUCTION' || tx.type === 'SPEND' || tx.type === 'EXPIRE' || Number(tx.amount) < 0;
                                            const isPositive = !isDeduction;
                                            const pointClassLabel = tx.pointClass === 'BIZ' ? '광고/유료' : '일반활동';
                                            const userObj = tx.user || {};

                                            return (
                                                <tr key={tx.id} className="hover:bg-orange-50/20 transition-colors">
                                                    <td className="p-4 text-gray-400 font-mono">
                                                        {format(new Date(tx.created_at), 'yy-MM-dd HH:mm')}
                                                    </td>
                                                    <td className="p-4">
                                                        <div 
                                                            onClick={() => {
                                                                const matched = users.find(u => u.id === tx.user_id);
                                                                if (matched) setSelectedUser(matched);
                                                            }}
                                                            className="flex flex-col gap-0.5 cursor-pointer hover:underline text-left group"
                                                        >
                                                            <span className="font-bold text-gray-900 group-hover:text-primary">{userObj.name || '-'}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono">{userObj.login_id || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="outline" className={`font-bold text-[10px] ${
                                                            tx.pointClass === 'BIZ' 
                                                            ? 'border-blue-200 bg-blue-50/50 text-blue-700' 
                                                            : 'border-purple-200 bg-purple-50/50 text-purple-700'
                                                        }`}>
                                                            {pointClassLabel}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">
                                                            {tx.type}
                                                        </Badge>
                                                    </td>
                                                    <td className={`p-4 text-right font-black ${isPositive ? 'text-blue-600' : 'text-red-500'}`}>
                                                        {isPositive ? '+' : '-'}{Math.abs(Number(tx.amount)).toLocaleString()} P
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-gray-800">
                                                        {Number(tx.balance_after).toLocaleString()} P
                                                    </td>
                                                    <td className="p-4 max-w-[200px] truncate text-gray-600 font-medium" title={tx.description}>
                                                        {tx.description || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
