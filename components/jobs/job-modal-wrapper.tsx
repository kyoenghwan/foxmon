'use client';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { JobDetailContent } from "./job-detail-content";

export function JobModalWrapper({ job }: { job: any }) {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      router.replace(`/jobs?${currentParams.toString()}`, { scroll: false });
    } else {
      router.back();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        handleClose();
        queueMicrotask(() => router.refresh());
      }
    }}>
      <DialogContent 
        className="max-w-[1000px] w-[95vw] sm:w-[90vw] p-0 overflow-hidden border-none bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl focus:outline-none max-h-[90vh] flex flex-col" 
        showCloseButton={false}
      >
         <DialogTitle className="sr-only">채용 상세 정보</DialogTitle>
         <JobDetailContent job={job} isModal={true} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  )
}
