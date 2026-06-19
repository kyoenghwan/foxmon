import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { adminEmployerAction, adminUserAction } from '@/lib/actions';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

const ACTIVITY_TYPE_MAP: Record<string, { label: string; bg: string; text: string }> = {
  POST: { label: '글 작성', bg: 'bg-green-50 text-green-700 border-green-100', text: 'text-green-600' },
  COMMENT: { label: '댓글 작성', bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'text-blue-600' },
  ATTENDANCE: { label: '출석체크', bg: 'bg-yellow-50 text-yellow-700 border-yellow-100', text: 'text-yellow-600' },
  REFERRAL_SIGNUP: { label: '추천 가입', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', text: 'text-indigo-600' },
  REFERRAL_BONUS: { label: '추천 보너스', bg: 'bg-purple-50 text-purple-700 border-purple-100', text: 'text-purple-600' },
  GIFT_CARD_REQUEST: { label: '상품권 교환', bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-600' },
  ADMIN_ADJUST: { label: '포인트 조정', bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'text-gray-600' }
};

export function AdminPointHistoryModal({ isOpen, onClose, employer }: any) {
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const isEmp = employer?.role === 'EMPLOYER';

    useEffect(() => {
        if (isOpen && employer) {
            setLoading(true);
            const fetchAction = isEmp 
                ? adminEmployerAction({ actionType: 'GET_POINT_HISTORY', targetUserId: employer.id })
                : adminUserAction('GET_ACTIVITY_POINT_HISTORY', { targetUserId: employer.id });

            fetchAction.then(res => {
                if (res.success && 'data' in res) setHistory((res as any).data);
                setLoading(false);
            });
        } else {
            setHistory(null);
        }
    }, [isOpen, employer, isEmp]);

    const totalRecharge = isEmp 
        ? (history?.recharges?.reduce((acc: number, r: any) => acc + Number(r.remained_point), 0) || 0)
        : 0;
    const isMatching = isEmp 
        ? (employer ? totalRecharge === Number(employer.paid_points || 0) : true)
        : true;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                        <Coins className="text-primary w-5 h-5" /> 
                        포인트 내역 점검 ({employer?.name || employer?.verified_business_name || employer?.email})
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 font-medium">
                        {isEmp 
                            ? '유저의 유료/보너스 포인트 거래 로그와 현재 사용 가능한 입금 영수증 현황을 교차 검증합니다.'
                            : '유저의 일반 활동 포인트 적립 및 사용 거래 내역을 조회합니다.'
                        }
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 text-center text-gray-500 font-bold text-sm">데이터를 불러오는 중...</div>
                ) : (
                    <div className="space-y-6 mt-4">
                        {/* Summary */}
                        {isEmp ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-xs font-bold text-gray-500 mb-1">현재 유료 포인트 (DB)</div>
                                    <div className="text-xl font-black text-blue-600">{Number(employer?.paid_points || 0).toLocaleString()} P</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-xs font-bold text-gray-500 mb-1">남은 영수증 총합 (DB)</div>
                                    <div className="text-xl font-black text-gray-900">{totalRecharge.toLocaleString()} P</div>
                                </div>
                                <div className={`p-4 rounded-xl border ${isMatching ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className={`text-xs font-bold mb-1 ${isMatching ? 'text-green-700' : 'text-red-700'}`}>데이터 정합성 검사</div>
                                    <div className="text-lg font-black flex items-center gap-2">
                                        {isMatching ? (
                                            <Badge className="bg-green-600 text-white font-bold text-[11px] px-2 py-0.5">✅ 일치함 (정상)</Badge>
                                        ) : (
                                            <Badge className="bg-red-600 text-white font-bold text-[11px] px-2 py-0.5">⚠️ 불일치 (결제불가)</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100/50 flex justify-between items-center">
                                    <div>
                                        <div className="text-[11px] font-bold text-purple-600 mb-1 uppercase tracking-wider">현재 활동 포인트 잔액</div>
                                        <div className="text-2xl font-black text-purple-700">{Number(employer?.activity_points || 0).toLocaleString()} P</div>
                                    </div>
                                    <Coins className="w-8 h-8 text-purple-300" />
                                </div>
                            </div>
                        )}

                        {isEmp ? (
                            <Tabs defaultValue="tx">
                                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4 h-auto">
                                    <TabsTrigger value="tx" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-black text-xs text-gray-500">
                                        거래 내역 (Transactions)
                                    </TabsTrigger>
                                    <TabsTrigger value="receipt" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-black text-xs text-gray-500">
                                        남은 영수증 이력 (Recharges)
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="tx">
                                    <div className="border rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-gray-50/50 border-b text-[11px] font-bold text-gray-500">
                                                <tr>
                                                    <th className="p-4 font-semibold">일시</th>
                                                    <th className="p-4 font-semibold">구분</th>
                                                    <th className="p-4 font-semibold text-right">금액</th>
                                                    <th className="p-4 font-semibold text-right">거래 후 잔액</th>
                                                    <th className="p-4 font-semibold">내용</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history?.transactions?.length === 0 ? (
                                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">거래 내역이 없습니다.</td></tr>
                                                ) : history?.transactions?.map((tx: any) => (
                                                    <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-4 text-gray-400 font-mono">{format(new Date(tx.created_at), 'yy-MM-dd HH:mm')}</td>
                                                        <td className="p-4">
                                                            <Badge variant="outline" className={tx.type === 'CHARGE' ? 'text-blue-600 border-blue-200 bg-blue-50 font-bold text-[10px]' : 'text-red-600 border-red-200 bg-red-50 font-bold text-[10px]'}>
                                                                {tx.type}
                                                            </Badge>
                                                        </td>
                                                        <td className={`p-4 text-right font-bold ${tx.type === 'CHARGE' ? 'text-blue-600' : 'text-red-600'}`}>
                                                            {tx.type === 'CHARGE' ? '+' : '-'}{Number(tx.amount).toLocaleString()} P
                                                        </td>
                                                        <td className="p-4 text-right font-bold text-gray-700">{Number(tx.balance_after).toLocaleString()} P</td>
                                                        <td className="p-4 text-gray-600 font-medium">{tx.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                                <TabsContent value="receipt">
                                    <div className="border rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-gray-50/50 border-b text-[11px] font-bold text-gray-500">
                                                <tr>
                                                    <th className="p-4 font-semibold">생성일</th>
                                                    <th className="p-4 font-semibold text-right">최초 충전액</th>
                                                    <th className="p-4 font-semibold text-right">남은 잔액 (결제가능)</th>
                                                    <th className="p-4 font-semibold text-center">보너스 비율</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history?.recharges?.length === 0 ? (
                                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold">남은 영수증이 없습니다.</td></tr>
                                                ) : history?.recharges?.map((rc: any) => (
                                                    <tr key={rc.id} className={`border-b last:border-0 hover:bg-gray-50/50 transition-colors ${Number(rc.remained_point) === 0 ? 'opacity-50' : ''}`}>
                                                        <td className="p-4 text-gray-400 font-mono">{format(new Date(rc.created_at), 'yy-MM-dd HH:mm')}</td>
                                                        <td className="p-4 text-right text-gray-500">{Number(rc.point_amount || 0).toLocaleString()} P</td>
                                                        <td className="p-4 text-right font-black text-gray-900">{Number(rc.remained_point).toLocaleString()} P</td>
                                                        <td className="p-4 text-center">
                                                            <Badge variant="secondary" className="text-[10px] font-bold">{(rc.bonus_ratio || 0) * 100}%</Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-500">활동 포인트 거래 내역 (최근 순)</h4>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="bg-gray-50/50 border-b text-[11px] font-bold text-gray-500">
                                            <tr>
                                                <th className="p-4 font-semibold">일시</th>
                                                <th className="p-4 font-semibold">구분</th>
                                                <th className="p-4 font-semibold text-right">변동 금액</th>
                                                <th className="p-4 font-semibold text-right">거래 후 잔액</th>
                                                <th className="p-4 font-semibold">내용</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history?.transactions?.length === 0 ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold">활동 포인트 거래 이력이 없습니다.</td></tr>
                                            ) : history?.transactions?.map((tx: any) => {
                                                const typeInfo = ACTIVITY_TYPE_MAP[tx.type] || { label: tx.type, bg: 'bg-gray-50 text-gray-600 border-gray-200' };
                                                const isPositive = Number(tx.amount) >= 0;
                                                return (
                                                    <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-4 text-gray-400 font-mono">{format(new Date(tx.created_at), 'yy-MM-dd HH:mm')}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 text-[9px] font-black border rounded-md ${typeInfo.bg}`}>
                                                                {typeInfo.label}
                                                            </span>
                                                        </td>
                                                        <td className={`p-4 text-right font-bold ${isPositive ? 'text-purple-600' : 'text-red-500'}`}>
                                                            {isPositive ? '+' : ''}{Number(tx.amount).toLocaleString()} P
                                                        </td>
                                                        <td className="p-4 text-right font-bold text-gray-700">{Number(tx.balance_after).toLocaleString()} P</td>
                                                        <td className="p-4 text-gray-600 font-medium">{tx.description}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
