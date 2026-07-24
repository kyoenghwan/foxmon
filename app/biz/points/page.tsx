import { auth } from '@/auth';
import { Coins, Plus, ArrowDownLeft, ArrowUpRight, Clock, Info } from 'lucide-react';
import { PointRechargeForm } from '@/components/biz/PointRechargeForm';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BizPointsPage() {
    const session = await auth();
    const user = session?.user as any;
    
    // DB에서 실시간 포인트 및 사업자 인증 정보, 대표자 실명 조회
    const { data: userData } = await supabase.from('users').select('paid_points, bonus_points, business_number, is_business_verified, representative_name, name, nickname').eq('id', user.id).single();
    const paidPoints = userData?.paid_points ?? 0;
    const bonusPoints = userData?.bonus_points ?? 0;
    const realName = userData?.representative_name || userData?.name || userData?.nickname || '';

    // 거래 내역 조회
    const { data: txData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
    const transactions = txData || [];

    // DB에서 입금 계좌 설정 조회
    const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key_name, key_value')
        .in('key_name', ['bank_name', 'account_number', 'account_holder']);

    const settingsMap = (settingsData || []).reduce((acc, row) => {
        acc[row.key_name] = row.key_value;
        return acc;
    }, {} as Record<string, string>);

    const bankName = settingsMap['bank_name'] || '국민은행';
    const accountNumber = settingsMap['account_number'] || '123456-78-901234';
    const accountHolder = settingsMap['account_holder'] || '폭스몬 주식회사';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary" /> 포인트 관리
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">포인트 잔액 확인, 충전 신청, 거래 내역을 관리하세요.</p>
            </div>

            {/* 포인트 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-200">
                    <p className="text-[13px] font-bold opacity-80">총 보유 포인트</p>
                    <p className="text-4xl font-black mt-2">{(paidPoints + bonusPoints).toLocaleString()}P</p>
                    <p className="text-[12px] opacity-70 mt-3">광고 등록 및 등급 업그레이드에 사용</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <p className="text-[13px] font-bold text-gray-500">유료 포인트</p>
                    <p className="text-3xl font-black text-blue-600 mt-2">{paidPoints.toLocaleString()}P</p>
                    <p className="text-[12px] text-gray-400 mt-2">환불 가능한 포인트</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <p className="text-[13px] font-bold text-gray-500">보너스 포인트</p>
                    <p className="text-3xl font-black text-green-600 mt-2">{bonusPoints.toLocaleString()}P</p>
                    <p className="text-[12px] text-gray-400 mt-2">충전 보너스 (환불 불가)</p>
                </div>
            </div>

            {/* 충전 안내 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-black text-[16px] text-gray-900 mb-5 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" /> 포인트 충전 신청
                </h3>
                <PointRechargeForm 
                    isBusinessVerified={(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') || !!userData?.is_business_verified} 
                    defaultDepositorName={realName}
                />
            </div>

            {/* 거래 내역 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-black text-[16px] text-gray-900 mb-5">거래 내역</h3>
                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="font-bold">아직 거래 내역이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx: any) => {
                            const isDeduction = tx.type === 'DEDUCTION' || tx.type === 'SPEND' || tx.type === 'EXPIRE' || tx.amount < 0;
                            const displayAmount = Math.abs(tx.amount);
                            return (
                                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        {isDeduction 
                                            ? <ArrowUpRight className="w-5 h-5 text-red-400 shrink-0" />
                                            : <ArrowDownLeft className="w-5 h-5 text-green-500 shrink-0" />
                                        }
                                        <div>
                                            <p className="font-bold text-[14px] text-gray-800">{tx.description}</p>
                                            <p className="text-[12px] text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-[15px] ${isDeduction ? 'text-red-500' : 'text-green-600'}`}>
                                            {isDeduction ? '-' : '+'}{displayAmount.toLocaleString()}P
                                        </p>
                                        <p className="text-[12px] text-gray-400">잔액 {tx.balance_after?.toLocaleString()}P</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
