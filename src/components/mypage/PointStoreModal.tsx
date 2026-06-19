'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Wallet, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  onRedeemSuccess?: (newBalance: number) => void;
}

type GiftCardType = 'CULTURE_LAND' | 'HAPPY_MONEY' | 'GOOGLE_PLAY';

const GIFT_CARDS = [
  { id: 'CULTURE_LAND' as GiftCardType, name: '컬쳐랜드 문화상품권', desc: '온·오프라인 도서, 쇼핑 등 범용 사용 가능', bg: 'from-orange-50 to-orange-100/30', border: 'border-orange-200/50', text: 'text-orange-600', iconBg: 'bg-orange-100' },
  { id: 'HAPPY_MONEY' as GiftCardType, name: '해피머니 상품권', desc: '게임, 외식, 도서 등 다양한 사용처 제공', bg: 'from-yellow-50 to-yellow-100/30', border: 'border-yellow-200/50', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
  { id: 'GOOGLE_PLAY' as GiftCardType, name: '구글플레이 기프트카드', desc: '모바일 앱, 게임, 인앱 결제에 특화', bg: 'from-green-50 to-green-100/30', border: 'border-green-200/50', text: 'text-green-600', iconBg: 'bg-green-100' }
];

const AMOUNTS = [
  { label: '5,000 원', value: 5000 },
  { label: '10,000 원', value: 10000 },
  { label: '30,000 원', value: 30000 },
  { label: '50,000 원', value: 50000 },
];

export function PointStoreModal({ isOpen, onClose, currentPoints, onRedeemSuccess }: PointStoreModalProps) {
  const [selectedCard, setSelectedCard] = useState<GiftCardType>('CULTURE_LAND');
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExchange = async () => {
    if (currentPoints < selectedAmount) {
      alert('보유 포인트가 부족합니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/point-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftCardType: selectedCard,
          amount: selectedAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        if (onRedeemSuccess && data.balanceAfter !== undefined) {
          onRedeemSuccess(data.balanceAfter);
        }
      } else {
        alert(data.message || '교환 신청 중 오류가 발생했습니다.');
      }
    } catch (e) {
      alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setSelectedCard('CULTURE_LAND');
    setSelectedAmount(5000);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if (!val) handleReset(); }}>
      <DialogContent className="max-w-[90vw] md:max-w-xl p-0 overflow-hidden rounded-[2.5rem] border border-gray-100 shadow-2xl bg-white flex flex-col max-h-[90vh]">
        
        {/* Header - Symmetrical & Elegant */}
        <DialogHeader className="px-6 pt-8 pb-5 border-b border-gray-50 bg-gradient-to-b from-purple-50/50 to-white flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-[-40%] w-48 h-48 bg-purple-100/50 rounded-full filter blur-2xl opacity-70" />
          <div className="w-12 h-12 bg-purple-100/80 rounded-2xl flex items-center justify-center text-purple-600 mb-3 relative z-10 shadow-inner">
            <Gift className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-gray-900 leading-tight relative z-10">
            활동 포인트 상점
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 font-semibold mt-1 relative z-10 flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm">
            <Wallet className="w-3.5 h-3.5 text-purple-600" /> 
            보유 활동 포인트: <span className="text-purple-700 font-extrabold">{currentPoints.toLocaleString()}p</span>
          </DialogDescription>
        </DialogHeader>

        {success ? (
          // Success State
          <div className="p-8 flex flex-col items-center text-center space-y-5 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-8 border-green-100">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h4 className="text-lg font-black text-gray-900">상품권 신청이 접수되었습니다!</h4>
              <p className="text-sm text-gray-500 leading-relaxed font-semibold mt-2 break-keep">
                포인트 차감 및 신청이 완료되었습니다.<br />
                관리자 심사 후 가입 시 등록된 이메일 또는 연락처로 기프티콘 정보가 발송됩니다. (영업일 기준 1~3일 소요)
              </p>
            </div>
            <Button
              onClick={handleReset}
              className="w-full max-w-xs h-13 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-sm transition-all"
            >
              상점으로 돌아가기
            </Button>
          </div>
        ) : (
          // Main Form State
          <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
            
            {/* 1. Select Gift Card */}
            <div className="space-y-3">
              <label className="text-[13px] font-black text-gray-700 tracking-wider">1. 상품권 종류 선택</label>
              <div className="grid grid-cols-1 gap-2.5">
                {GIFT_CARDS.map((card) => {
                  const isSelected = selectedCard === card.id;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card.id)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all hover:scale-[1.01] active:scale-[0.99]",
                        isSelected 
                          ? `bg-gradient-to-r ${card.bg} border-purple-500 shadow-md ring-1 ring-purple-500/20`
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", card.iconBg)}>
                        <Gift className={cn("w-5 h-5", card.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-gray-900">{card.name}</div>
                        <div className="text-[11px] text-gray-400 font-semibold mt-0.5">{card.desc}</div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                        isSelected ? "border-purple-600 bg-purple-600 text-white" : "border-gray-200"
                      )}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Select Amount */}
            <div className="space-y-3">
              <label className="text-[13px] font-black text-gray-700 tracking-wider">2. 교환 금액 선택</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AMOUNTS.map((amt) => {
                  const isSelected = selectedAmount === amt.value;
                  const isInsufficient = currentPoints < amt.value;
                  return (
                    <button
                      key={amt.value}
                      disabled={isInsufficient}
                      onClick={() => setSelectedAmount(amt.value)}
                      className={cn(
                        "py-3.5 rounded-xl border text-center transition-all text-xs font-black select-none cursor-pointer flex flex-col gap-1",
                        isInsufficient
                          ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50"
                          : isSelected
                            ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/20"
                            : "bg-white border-gray-100 hover:border-gray-200 text-gray-700"
                      )}
                    >
                      <span>{amt.label}</span>
                      <span className={cn(
                        "text-[9px] font-medium block",
                        isSelected ? "text-purple-200" : isInsufficient ? "text-gray-300" : "text-purple-600"
                      )}>
                        {amt.value.toLocaleString()}p
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary Detail */}
            <div className="p-4 bg-purple-50/30 border border-purple-100/50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-500 font-medium">
                <span>차감 예정 포인트</span>
                <span className="font-bold text-gray-700">-{selectedAmount.toLocaleString()}p</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 font-medium border-t border-purple-100/30 pt-2">
                <span>교환 후 잔여 포인트</span>
                <span className={cn(
                  "font-bold",
                  currentPoints - selectedAmount < 0 ? "text-red-500" : "text-purple-700"
                )}>
                  {Math.max(0, currentPoints - selectedAmount).toLocaleString()}p
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="h-13 font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 flex-1 rounded-2xl"
              >
                취소
              </Button>
              <Button
                type="button"
                disabled={currentPoints < selectedAmount || loading}
                onClick={handleExchange}
                className="flex-[2] h-13 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    신청하기 <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
