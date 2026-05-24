'use client';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { SeekerDetailContent } from "./seeker-detail-content";

export function SeekerModalWrapper({ 
  seeker, 
  isOpen = true, 
  onClose, 
  job 
}: { 
  seeker?: any; 
  isOpen?: boolean; 
  onClose?: () => void; 
  job?: any;
}) {
  const router = useRouter();
  const displaySeeker = seeker || job;
  const [activeOpen, setActiveOpen] = useState(isOpen);
  const isClosingRef = useRef(false);

  useEffect(() => {
    setActiveOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setActiveOpen(false);
    
    if (onClose) {
      onClose();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      router.replace(`/seekers?${currentParams.toString()}`, { scroll: false });
    } else {
      router.back();
    }
  };

  return (
    <Dialog open={activeOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
        queueMicrotask(() => router.refresh());
      }
    }}>
      <DialogContent 
        className="max-w-[800px] w-[95vw] sm:w-[90vw] p-0 overflow-hidden border-none bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl focus:outline-none max-h-[90vh] flex flex-col" 
        showCloseButton={false}
      >
         <DialogTitle className="sr-only">인재 상세 정보</DialogTitle>
         {displaySeeker && <SeekerDetailContent job={displaySeeker} isModal={true} onClose={handleClose} />}
      </DialogContent>
    </Dialog>
  )
}
