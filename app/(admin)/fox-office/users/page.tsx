'use client';

import { useState, useEffect } from 'react';
import { adminUserAction, adminEmployerAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, Users, ShieldCheck, User, Coins, RefreshCw, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdminPointHistoryModal } from '@/components/admin/points/AdminPointHistoryModal';
import { OA_ADMIN_UPDATE_USER_PROFILE } from '@/src/atoms/oa/admin/OA_ADMIN_UPDATE_USER_PROFILE';

export default function UsersManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // 포인트 제어 모달 상태
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [pointAmount, setPointAmount] = useState<number | ''>('');
    const [pointType, setPointType] = useState<'PAID' | 'BONUS' | 'ACTIVITY'>('PAID');
    const [pointDesc, setPointDesc] = useState('');
    const [isSubmittingPoint, setIsSubmittingPoint] = useState(false);

    // 포인트 내역 모달 상태
    const [historyModalUser, setHistoryModalUser] = useState<any | null>(null);

    // 필터 조건 상태
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [filterTier, setFilterTier] = useState<string>('ALL');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    // 회원 수정 모달 상태
    const [editUser, setEditUser] = useState<any | null>(null);
    const [editName, setEditName] = useState('');
    const [editNickname, setEditNickname] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editRole, setEditRole] = useState<'GENERAL' | 'EMPLOYER' | 'ADMIN' | 'SUPER_ADMIN' | 'VIEWER'>('GENERAL');
    const [editTier, setEditTier] = useState<'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP'>('NORMAL');
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    // 수정 모달 시작 핸들러
    const handleStartEdit = (user: any) => {
        setEditUser(user);
        setEditName(user.name || '');
        setEditNickname(user.nickname || '');
        setEditPhone(user.phone_number || '');
        setEditRole(user.role || 'GENERAL');
        setEditTier(user.merchant_tier || 'NORMAL');
    };

    // 회원 정보 수정 완료 핸들러
    const handleUpdateUser = async () => {
        if (!editUser) return;
        setIsSubmittingEdit(true);
        try {
            const res = await OA_ADMIN_UPDATE_USER_PROFILE({
                targetUserId: editUser.id,
                name: editName,
                nickname: editNickname,
                phone_number: editPhone,
                role: editRole,
                merchant_tier: editTier
            });

            if (res.success) {
                alert(res.message);
                setEditUser(null);
                fetchUsers();
            } else {
                alert(res.message);
            }
        } catch (e) {
            alert('회원 정보 수정 중 오류가 발생했습니다.');
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminUserAction('GET_LIST');
            if (res.success && 'data' in res) {
                setUsers((res as any).data);
            }
        } catch (error) {
            console.error('사용자 목록을 불러오는 중 오류 발생:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // 포인트 제어 모달 오픈 시 타입 리셋
    useEffect(() => {
        if (selectedUser) {
            if (selectedUser.role === 'EMPLOYER') {
                setPointType('PAID');
            } else {
                setPointType('ACTIVITY');
            }
        }
    }, [selectedUser]);

    const handleGivePoints = async () => {
        if (!selectedUser || typeof pointAmount !== 'number' || pointAmount === 0 || !pointDesc.trim()) {
            alert('금액과 지급 사유를 정확히 입력해주세요.');
            return;
        }

        const isEmp = selectedUser.role === 'EMPLOYER';
        const typeLabel = pointType === 'PAID' ? '유료 포인트' : pointType === 'BONUS' ? '보너스 포인트' : '활동 포인트';
        
        if (!confirm(`[${selectedUser.name || selectedUser.login_id}]님에게 ${pointAmount.toLocaleString()} P (${typeLabel})를 지급/차감 하시겠습니까?`)) {
            return;
        }

        setIsSubmittingPoint(true);
        try {
            let res;
            if (isEmp) {
                // 업체회원용 유료/보너스 포인트
                res = await adminEmployerAction({
                    actionType: 'GIVE_POINTS',
                    targetUserId: selectedUser.id,
                    paidPointsDiff: pointType === 'PAID' ? pointAmount : 0,
                    bonusPointsDiff: pointType === 'BONUS' ? pointAmount : 0,
                    description: pointDesc
                });
            } else {
                // 일반회원용 활동 포인트
                res = await adminUserAction('GIVE_ACTIVITY_POINTS', {
                    targetUserId: selectedUser.id,
                    amountDiff: pointAmount,
                    description: pointDesc
                });
            }

            if (res.success) {
                alert('포인트 지급 처리가 완료되었습니다.');
                setSelectedUser(null);
                setPointAmount('');
                setPointDesc('');
                fetchUsers(); // 업데이트된 잔액 반영
            } else {
                alert(`지급 실패: ${res.message || '알 수 없는 오류'}`);
            }
        } catch (e) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsSubmittingPoint(false);
        }
    };

    const searchFiltered = users.filter(user => {
        // 1. 키워드 검색
        const matchesSearch = !searchTerm ||
            (user.name && user.name.includes(searchTerm)) ||
            (user.nickname && user.nickname.includes(searchTerm)) ||
            (user.login_id && user.login_id.includes(searchTerm)) ||
            (user.phone_number && user.phone_number.includes(searchTerm));
        if (!matchesSearch) return false;

        // 2. 권한(role) 필터
        if (filterRole !== 'ALL') {
            if (filterRole === 'ADMIN_ALL') {
                if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') return false;
            } else {
                if (user.role !== filterRole) return false;
            }
        }

        // 3. 업체 등급(merchant_tier) 필터
        if (filterTier !== 'ALL') {
            const userTier = user.merchant_tier || 'NORMAL';
            if (userTier !== filterTier) return false;
        }

        // 4. 가입일 범위 필터
        if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0, 0, 0, 0);
            if (new Date(user.created_at) < start) return false;
        }
        if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            if (new Date(user.created_at) > end) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        회원 관리
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        전체 회원의 정보를 조회하고 계정 상태 및 포인트를 직접 제어합니다.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchUsers} 
                        disabled={loading}
                        className="h-9 px-3 gap-1 bg-white font-bold"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        새로고침
                    </Button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="이름, 아이디, 닉네임 검색..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] w-[260px] focus:outline-none focus:border-primary font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* 필터 제어 패널 */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-wrap gap-4 items-center text-xs shadow-sm">
                <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-gray-500">회원 유형</span>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="h-9 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-bold bg-white text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">전체 권한</option>
                        <option value="GENERAL">일반회원</option>
                        <option value="EMPLOYER">업체회원</option>
                        <option value="ADMIN_ALL">관리자 (전체)</option>
                        <option value="VIEWER">뷰어 (VIEWER)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-gray-500">업체 등급</span>
                    <select
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value)}
                        className="h-9 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-bold bg-white text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">전체 등급</option>
                        <option value="NORMAL">일반</option>
                        <option value="VIP">우수 (VIP)</option>
                        <option value="VVIP">으뜸 (VVIP)</option>
                        <option value="VVVIP">명가 (VVVIP)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-gray-500">가입일 범위</span>
                    <div className="flex items-center gap-1.5">
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="h-9 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-bold text-gray-700 font-sans"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="h-9 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-bold text-gray-700 font-sans"
                        />
                    </div>
                </div>

                <div className="flex items-end h-full pt-5">
                    {(filterRole !== 'ALL' || filterTier !== 'ALL' || filterStartDate || filterEndDate || searchTerm) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setFilterRole('ALL');
                                setFilterTier('ALL');
                                setFilterStartDate('');
                                setFilterEndDate('');
                                setSearchTerm('');
                            }}
                            className="h-9 text-gray-500 font-bold hover:text-red-500"
                        >
                            필터 초기화
                        </Button>
                    )}
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
                                <th className="p-4 text-center">보유 포인트</th>
                                <th className="p-4 text-center">가입일</th>
                                <th className="p-4 text-right">관리 액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[13px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="p-12 text-center text-gray-500 font-medium">
                                        회원 목록을 불러오는 중입니다...
                                    </td>
                                </tr>
                            ) : searchFiltered.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-12 text-center text-gray-500 font-medium">
                                        조회된 회원이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                searchFiltered.map((user: any, idx: number) => (
                                    <tr key={user.id} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="p-4 text-center font-medium text-gray-500">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{user.login_id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-gray-900">{user.name || '-'}</span>
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
                                        <td className="p-4 font-medium text-gray-600">
                                            {user.phone_number || '-'}
                                        </td>
                                        <td className="p-4">
                                            {user.is_age_verified ? (
                                                <span className="text-green-600 font-bold text-[12px] bg-green-50 px-2 py-1 rounded">인증됨</span>
                                            ) : (
                                                <span className="text-gray-400 font-medium text-[12px]">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {user.role === 'EMPLOYER' ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-blue-600">{Number(user.paid_points || 0).toLocaleString()} P</span>
                                                    <span className="text-[10px] text-green-600 font-bold">+{Number(user.bonus_points || 0).toLocaleString()} P</span>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-purple-600">{Number(user.activity_points || 0).toLocaleString()} p</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center text-gray-500 font-medium">
                                            {format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <Dialog open={selectedUser?.id === user.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedUser(user)}
                                                            className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-xs"
                                                        >
                                                            <Coins className="w-3.5 h-3.5 mr-1" />
                                                            포인트 제어
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl">
                                                        <div className="p-4">
                                                            <h3 className="font-black text-lg mb-1 flex items-center gap-2">
                                                                <Coins className="text-blue-500" /> 포인트 수동 제어
                                                            </h3>
                                                            <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                                                                <strong className="text-gray-900">{user.name || user.login_id}</strong>님({user.role === 'EMPLOYER' ? '업체회원' : '일반회원'})에게 포인트를 지급하거나 차감합니다. (마이너스 입력 시 차감)
                                                            </p>
                                                            
                                                            <div className="space-y-4">
                                                                {user.role === 'EMPLOYER' ? (
                                                                    <div>
                                                                        <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">포인트 유형</label>
                                                                        <div className="flex gap-2">
                                                                            <Button 
                                                                                type="button"
                                                                                variant={pointType === 'PAID' ? 'default' : 'outline'}
                                                                                onClick={() => setPointType('PAID')}
                                                                                className="flex-1 font-bold h-9 text-xs"
                                                                            >유료 포인트</Button>
                                                                            <Button 
                                                                                type="button"
                                                                                variant={pointType === 'BONUS' ? 'default' : 'outline'}
                                                                                onClick={() => setPointType('BONUS')}
                                                                                className="flex-1 font-bold h-9 text-xs"
                                                                            >보너스 포인트</Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">포인트 유형</label>
                                                                        <Button 
                                                                            type="button"
                                                                            variant="default"
                                                                            className="w-full font-bold h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white cursor-default"
                                                                        >일반 활동 포인트 (Activity)</Button>
                                                                    </div>
                                                                )}
                                                                
                                                                <div>
                                                                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">금액 (P)</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={pointAmount}
                                                                        onChange={e => setPointAmount(Number(e.target.value) || '')}
                                                                        placeholder="예: 50000 또는 -50000"
                                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary font-mono text-[15px] font-bold"
                                                                    />
                                                                </div>
                                                                
                                                                <div>
                                                                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">지급/차감 사유 (필수)</label>
                                                                    <input 
                                                                        type="text" 
                                                                        value={pointDesc}
                                                                        onChange={e => setPointDesc(e.target.value)}
                                                                        placeholder="예: 추천인 보상 지급"
                                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-[14px]"
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
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleStartEdit(user)}
                                                    className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 font-bold"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                                                    수정
                                                </Button>

                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setHistoryModalUser(user)}
                                                    className="h-8 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 bg-white font-bold"
                                                >
                                                    내역 보기
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

            {/* 포인트 내역 및 정합성 검사 모달 */}
            <AdminPointHistoryModal 
                isOpen={!!historyModalUser} 
                onClose={() => setHistoryModalUser(null)} 
                employer={historyModalUser} 
            />

            {/* 회원 정보 수정 모달 */}
            <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
                <DialogContent className="sm:max-w-[450px] bg-white rounded-2xl">
                    <div className="p-4">
                        <h3 className="font-black text-lg mb-1 flex items-center gap-2">
                            👤 회원 정보 수정
                        </h3>
                        <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                            <strong className="text-gray-900">{editUser?.login_id}</strong> 회원의 권한, 등급 및 기본 프로필 정보를 변경합니다.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">실명 (이름)</label>
                                <input 
                                    type="text" 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="실명 입력"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">닉네임</label>
                                <input 
                                    type="text" 
                                    value={editNickname}
                                    onChange={e => setEditNickname(e.target.value)}
                                    placeholder="닉네임 입력"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-[14px]"
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">휴대폰 번호</label>
                                <input 
                                    type="text" 
                                    value={editPhone}
                                    onChange={e => setEditPhone(e.target.value)}
                                    placeholder="예: 01012345678"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-[14px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">회원 권한 (Role)</label>
                                    <select
                                        value={editRole}
                                        onChange={e => setEditRole(e.target.value as any)}
                                        className="w-full h-10 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-bold bg-white text-gray-700 text-xs cursor-pointer"
                                    >
                                        <option value="GENERAL">일반회원 (GENERAL)</option>
                                        <option value="EMPLOYER">업체회원 (EMPLOYER)</option>
                                        <option value="ADMIN">관리자 (ADMIN)</option>
                                        <option value="SUPER_ADMIN">최고 관리자</option>
                                        <option value="VIEWER">뷰어 (VIEWER)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[12px] font-bold text-gray-700 mb-1.5 block">업체 등급 (Tier)</label>
                                    <select
                                        value={editTier}
                                        onChange={e => setEditTier(e.target.value as any)}
                                        className="w-full h-10 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-bold bg-white text-gray-700 text-xs cursor-pointer"
                                    >
                                        <option value="NORMAL">일반 (NORMAL)</option>
                                        <option value="VIP">우수 (VIP)</option>
                                        <option value="VVIP">으뜸 (VVIP)</option>
                                        <option value="VVVIP">명가 (VVVIP)</option>
                                    </select>
                                </div>
                            </div>

                            <Button 
                                onClick={handleUpdateUser}
                                disabled={isSubmittingEdit}
                                className="w-full mt-4 font-black h-12 bg-primary hover:bg-orange-600 text-white"
                            >
                                {isSubmittingEdit ? '수정 중...' : '회원 정보 저장하기'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
