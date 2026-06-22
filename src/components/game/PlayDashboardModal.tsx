'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import PlayDashboardClient from '@/app/(dashboard)/job-seeker/play/PlayDashboardClient';
import { X } from 'lucide-react';

export function PlayDashboardModal() {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      window.dispatchEvent(new Event('play-modal-closed'));
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
    };
    const handleClose = () => {
      setOpen(false);
    };

    window.addEventListener('open_play_modal', handleOpen);
    window.addEventListener('close_play_modal', handleClose);
    return () => {
      window.removeEventListener('open_play_modal', handleOpen);
      window.removeEventListener('close_play_modal', handleClose);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto bg-gray-950 border border-gray-800 text-white rounded-3xl p-5 md:p-8 scrollbar-hide">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          <DialogHeader className="relative pr-8">
            <DialogTitle className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent w-fit">
              여우들의 놀이터 🎮
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs md:text-sm mt-1.5 font-semibold text-left">
              매일 주어지는 무료 기회로 대박 포인트를 노려보세요! 쌓인 포인트는 상품권으로 즉시 교환하실 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {/* 놀이터 클라이언트 대시보드 렌더링 */}
          <div className="w-full">
            <PlayDashboardClient />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
