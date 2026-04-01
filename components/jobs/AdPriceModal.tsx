'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle, Info, CheckCircle2 } from 'lucide-react';

interface AdPriceModalProps {
  type: 'premium' | 'special' | 'line';
  title: string;
}

const PRICE_DATA = {
  premium: [
    { period: '1일', price: '10,000원', desc: '최상단 랜덤 노출' },
    { period: '7일', price: '50,000원', desc: '최상단 랜덤 노출 (개별 구매 대비 1.5만 할인)', hot: true },
    { period: '30일', price: '150,000원', desc: '최상단 고정 노출 + 모바일 동시 노출' },
  ],
  special: [
    { period: '1일', price: '5,000원', desc: '프리미엄 하단 노출' },
    { period: '7일', price: '30,000원', desc: '프리미엄 하단 노출 (5,000원 할인)', hot: true },
    { period: '30일', price: '100,000원', desc: '프리미엄 하단 노출 + 리스트 강조 효과' },
  ],
  line: [
    { period: '1일', price: '1,000원', desc: '일반 리스트 상단 강조' },
    { period: '30일', price: '20,000원', desc: '일반 리스트 상단 강조 + 굵은 글씨 효과', hot: true },
  ]
};

export function AdPriceModal({ type, title }: AdPriceModalProps) {
  const data = PRICE_DATA[type];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 group">
          <HelpCircle className="w-4 h-4" />
          <span className="text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">가격안내</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative">
          <div className="absolute top-6 right-8 opacity-10">
            <Info size={80} strokeWidth={1} />
          </div>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-2">
            <Info className="text-primary" /> {title} Ad Rates
          </DialogTitle>
          <p className="text-gray-400 text-[13px] font-bold mt-1">폭스알바의 강력한 광고 상품으로 채용 효율을 높이세요.</p>
        </DialogHeader>

        <div className="p-8 space-y-4">
          {data.map((item, index) => (
            <div 
              key={index} 
              className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                item.hot ? 'border-primary bg-orange-50/30' : 'border-gray-50 hover:border-gray-100 bg-white'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{item.period}</span>
                  {item.hot && (
                    <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase italic">HOT</span>
                  )}
                </div>
                <div className="text-xl font-black text-gray-900 tracking-tighter">{item.price}</div>
              </div>
              <div className="text-right">
                <p className={`text-[12px] font-bold ${item.hot ? 'text-primary' : 'text-gray-500'}`}>{item.desc}</p>
                <div className="flex items-center justify-end gap-1 mt-1 text-gray-300">
                  <CheckCircle2 size={12} />
                  <span className="text-[10px] font-black uppercase italic">Selection</span>
                </div>
              </div>
            </div>
          ))}
          
          <p className="text-center text-[11px] text-gray-400 font-bold pt-2">
            * 모든 광고 비용은 부가세(VAT) 별도 금액입니다.
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 flex justify-end">
          <button className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-[13px] font-black hover:bg-black transition-all">
            광고 문의하기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
