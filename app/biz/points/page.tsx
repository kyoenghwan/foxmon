import { auth } from '@/auth';
import { Coins, Plus, ArrowDownLeft, ArrowUpRight, Clock, Info } from 'lucide-react';
import { PointRechargeForm } from '@/components/biz/PointRechargeForm';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export default async function BizPointsPage() {
    const session = await auth();
    const user = session?.user as any;
    
    // DB에서 실시간 포인트 조회
    const { data: userData } = await supabase.from('users').select('paid_points, bonus_points').eq('id', user.id).single();
    const paidPoints = userData?.paid_points ?? 0;
    const bonusPoints = userData?.bonus_points ?? 0;

    // 거래 내역 조회
    const { data: txData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
    const transactions = txData || [];

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
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-[14px] text-blue-800">무통장 입금 방식 안내</p>
                        <p className="text-[13px] text-blue-700 mt-1 leading-relaxed">
                            아래 계좌로 입금 후 신청서를 제출해주세요.<br />
                            영업일 기준 <strong>1일 이내</strong>에 담당자가 확인 후 포인트를 지급해드립니다.
                        </p>
                        <div className="mt-3 bg-white rounded-lg p-3 border border-blue-100">
                            <p className="text-[13px] font-bold text-gray-800">입금 계좌</p>
                            <p className="text-[15px] font-black text-gray-900 mt-1">국민은행 123456-78-901234</p>
                            <p className="text-[12px] text-gray-500">(예금주: 폭스몬 주식회사)</p>
                        </div>
                    </div>
                </div>

                <PointRechargeForm />
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
                        {transactions.map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                                <div className="flex items-center gap-3">
                                    {tx.amount > 0 
                                        ? <ArrowDownLeft className="w-5 h-5 text-green-500 shrink-0" />
                                        : <ArrowUpRight className="w-5 h-5 text-red-400 shrink-0" />
                                    }
                                    <div>
                                        <p className="font-bold text-[14px] text-gray-800">{tx.description}</p>
                                        <p className="text-[12px] text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-[15px] ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}P
                                    </p>
                                    <p className="text-[12px] text-gray-400">잔액 {tx.balance_after?.toLocaleString()}P</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
