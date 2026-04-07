'use client';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { JobDetailContent } from "./job-detail-content";

export function JobModalWrapper({ job }: { job: any }) {
  const router = useRouter();

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        router.back();
      }
    }}>
      <DialogContent 
        className="max-w-[1000px] w-[95vw] sm:w-[90vw] p-0 overflow-hidden border-none bg-transparent shadow-none" 
      >
         <DialogTitle className="sr-only">채용 상세 정보</DialogTitle>
         <div className="relative w-full max-h-[90vh] overflow-hidden bg-white sm:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col">
            <JobDetailContent job={job} isModal={true} onClose={() => router.back()} />
         </div>
      </DialogContent>
    </Dialog>
  )
}
