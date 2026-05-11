'use client';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SeekerDetailContent } from "./seeker-detail-content";

interface SeekerModalWrapperProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
}

export function SeekerModalWrapper({ job, isOpen, onClose }: SeekerModalWrapperProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent 
        className="max-w-[800px] w-[95vw] sm:w-[90vw] p-0 overflow-hidden border-none bg-transparent shadow-none" 
      >
         <DialogTitle className="sr-only">인재 상세 정보</DialogTitle>
         <div className="relative w-full max-h-[90vh] overflow-y-auto bg-white sm:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col scrollbar-hide">
            {job && <SeekerDetailContent job={job} isModal={true} onClose={onClose} />}
         </div>
      </DialogContent>
    </Dialog>
  )
}
