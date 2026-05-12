import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { adminEmployerAction } from '@/lib/actions';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

export function AdminPointHistoryModal({ isOpen, onClose, employer }: any) {
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && employer) {
            setLoading(true);
            adminEmployerAction({ actionType: 'GET_POINT_HISTORY', targetUserId: employer.id })
                .then(res => {
                    if (res.success && 'data' in res) setHistory((res as any).data);
                    setLoading(false);
                });
        } else {
            setHistory(null);
        }
    }, [isOpen, employer]);

    const totalRecharge = history?.recharges?.reduce((acc: number, r: any) => acc + Number(r.remained_point), 0) || 0;
    const isMatching = employer ? totalRecharge === Number(employer.paid_points || 0) : true;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Coins className="text-primary w-5 h-5" /> 
                        포인트 내역 및 영수증 점검 ({employer?.verified_business_name || employer?.email})
                    </DialogTitle>
                    <DialogDescription>
                        유저의 포인트 거래 로그와 현재 사용 가능한 입금 영수증 현황을 교차 검증합니다.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 text-center text-gray-500">데이터를 불러오는 중...</div>
                ) : (
                    <div className="space-y-6 mt-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border">
                                <div className="text-xs font-bold text-gray-500 mb-1">현재 유료 포인트 (DB)</div>
                                <div className="text-xl font-black text-blue-600">{Number(employer?.paid_points || 0).toLocaleString()} P</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border">
                                <div className="text-xs font-bold text-gray-500 mb-1">남은 영수증 총합 (DB)</div>
                                <div className="text-xl font-black text-gray-900">{totalRecharge.toLocaleString()} P</div>
                            </div>
                            <div className={`p-4 rounded-xl border ${isMatching ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`text-xs font-bold mb-1 ${isMatching ? 'text-green-700' : 'text-red-700'}`}>데이터 정합성 검사</div>
                                <div className="text-lg font-black flex items-center gap-2">
                                    {isMatching ? (
                                        <Badge className="bg-green-600">✅ 일치함 (정상)</Badge>
                                    ) : (
                                        <Badge className="bg-red-600">⚠️ 불일치 (결제불가)</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="tx">
                            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-4 h-auto">
                                <TabsTrigger value="tx" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold">
                                    거래 내역 (Transactions)
                                </TabsTrigger>
                                <TabsTrigger value="receipt" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-bold">
                                    남은 영수증 이력 (Recharges)
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="tx">
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-3 font-semibold">일시</th>
                                                <th className="p-3 font-semibold">구분</th>
                                                <th className="p-3 font-semibold text-right">금액</th>
                                                <th className="p-3 font-semibold text-right">거래 후 잔액</th>
                                                <th className="p-3 font-semibold">내용</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history?.transactions?.length === 0 ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">거래 내역이 없습니다.</td></tr>
                                            ) : history?.transactions?.map((tx: any) => (
                                                <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                                    <td className="p-3 text-gray-500">{format(new Date(tx.created_at), 'yy-MM-dd HH:mm')}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className={tx.type === 'CHARGE' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-red-600 border-red-200 bg-red-50'}>
                                                            {tx.type}
                                                        </Badge>
                                                    </td>
                                                    <td className={`p-3 text-right font-bold ${tx.type === 'CHARGE' ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {tx.type === 'CHARGE' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 text-right font-bold">{Number(tx.balance_after).toLocaleString()}</td>
                                                    <td className="p-3 text-gray-700">{tx.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                            <TabsContent value="receipt">
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-3 font-semibold">생성일</th>
                                                <th className="p-3 font-semibold text-right">최초 충전액</th>
                                                <th className="p-3 font-semibold text-right">남은 잔액 (결제가능)</th>
                                                <th className="p-3 font-semibold text-center">수단</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history?.recharges?.length === 0 ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">남은 영수증이 없습니다.</td></tr>
                                            ) : history?.recharges?.map((rc: any) => (
                                                <tr key={rc.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${Number(rc.remained_point) === 0 ? 'opacity-50' : ''}`}>
                                                    <td className="p-3 text-gray-500">{format(new Date(rc.created_at), 'yy-MM-dd HH:mm')}</td>
                                                    <td className="p-3 text-right text-gray-500">{Number(rc.amount).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-black text-gray-900">{Number(rc.remained_point).toLocaleString()}</td>
                                                    <td className="p-3 text-center">
                                                        <Badge variant="secondary" className="text-[11px]">{rc.recharge_method}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
