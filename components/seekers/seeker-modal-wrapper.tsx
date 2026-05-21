'use client';
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

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
        queueMicrotask(() => router.refresh());
      }
    }}>
      <DialogContent 
        className="max-w-[800px] w-[95vw] sm:w-[90vw] p-0 overflow-hidden border-none bg-transparent shadow-none" 
        showCloseButton={false}
      >
         <DialogTitle className="sr-only">인재 상세 정보</DialogTitle>
         <div className="relative w-full max-h-[90vh] overflow-y-auto bg-white sm:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col scrollbar-hide">
            {displaySeeker && <SeekerDetailContent job={displaySeeker} isModal={true} onClose={handleClose} />}
         </div>
      </DialogContent>
    </Dialog>
  )
}
