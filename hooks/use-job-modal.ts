import { create } from 'zustand';

interface JobModalState {
    isOpen: boolean;
    jobData: any | null;
    openModal: (jobData: any) => void;
    closeModal: () => void;
}

export const useJobModal = create<JobModalState>((set) => ({
    isOpen: false,
    jobData: null,
    openModal: (jobData) => set({ isOpen: true, jobData }),
    closeModal: () => set({ isOpen: false, jobData: null }),
}));
