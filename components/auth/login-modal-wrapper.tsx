'use client';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { X } from "lucide-react";

export function LoginModalWrapper() {
  const router = useRouter();

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        router.back();
      }
    }}>
      <DialogContent 
        className="max-w-[450px] w-[95vw] p-0 overflow-hidden border-none bg-transparent shadow-none" 
      >
         <DialogTitle className="sr-only">회원 로그인</DialogTitle>
         <div className="relative w-full overflow-hidden bg-white rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col">
            <button 
                onClick={() => router.back()}
                className="absolute top-6 right-6 z-50 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all active:scale-95"
            >
                <X className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="bg-gradient-to-b from-purple-100 via-purple-50/50 to-white px-8 pt-10 pb-8 flex flex-col items-center gap-2 border-b border-gray-100 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                <h1 className="text-[32px] font-extrabold tracking-tighter text-purple-900 italic relative z-10 drop-shadow-sm">FOXMON</h1>
                <p className="text-purple-600 text-[11px] font-black tracking-widest uppercase relative z-10">신뢰할 수 있는 구인구직</p>
            </div>

            <div className="p-8 space-y-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-purple-600 rounded-full shadow-sm shadow-purple-600/20" />
                    <h2 className="text-lg font-black text-purple-900 italic tracking-tight">회원로그인</h2>
                </div>
                <LoginForm />
            </div>
         </div>
      </DialogContent>
    </Dialog>
  )
}
