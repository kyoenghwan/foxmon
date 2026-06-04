'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { JobDetailContent } from "./job-detail-content";
import { useJobModal } from "@/hooks/use-job-modal";

export function JobGlobalModal() {
  const { isOpen, jobData, closeModal } = useJobModal();

  if (!isOpen || !jobData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        closeModal();
      }
    }}>
      <DialogContent 
        className="max-w-[800px] w-[95vw] sm:w-[85vw] p-0 overflow-hidden border-none bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl focus:outline-none max-h-[90vh] flex flex-col z-[100]" 
        showCloseButton={false}
      >
         <DialogTitle className="sr-only">채용 상세 정보</DialogTitle>
         <JobDetailContent job={jobData} isModal={true} onClose={closeModal} />
      </DialogContent>
    </Dialog>
  );
}
