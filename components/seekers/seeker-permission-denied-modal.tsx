'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export function SeekerPermissionDeniedModal() {
  const router = useRouter();
  const [activeOpen, setActiveOpen] = useState(true);

  const handleClose = () => {
    setActiveOpen(false);
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.replace('/seekers');
    }
  };

  return (
    <Dialog open={activeOpen} preventPopState={true} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent 
        className="max-w-[420px] w-[90vw] p-8 border-none bg-white rounded-3xl shadow-2xl focus:outline-none flex flex-col items-center text-center gap-6"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">인재 정보 열람 제한</DialogTitle>
        
        <div className="w-16 h-16 bg-orange-50 text-primary rounded-full flex items-center justify-center text-2xl">
          🔒
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900">인재 정보 열람 제한</h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            인재정보는 구인정보에 최소 1개 이상의 구인 공고를 등록하신 구인 업체 회원만 열람하실 수 있습니다. 구인 공고를 먼저 등록해 주세요.
          </p>
        </div>
        
        <div className="flex flex-col gap-2 w-full">
          <Link href="/biz/ads/new" className="w-full" onClick={() => setActiveOpen(false)}>
            <Button className="w-full font-black bg-primary hover:bg-orange-600">
              구인 공고 등록하기
            </Button>
          </Link>
          <Button variant="outline" className="w-full font-bold" onClick={handleClose}>
            돌아가기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
