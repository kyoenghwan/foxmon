'use client';

import { ShieldCheck, User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  selectedRole: 'EMPLOYER' | 'GENERAL' | null;
  onSelect: (role: 'EMPLOYER' | 'GENERAL') => void;
}

export function RoleSelector({ selectedRole, onSelect }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* General User Card */}
      <button
        type="button"
        onClick={() => onSelect('GENERAL')}
        className={cn(
          "relative group p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-4 text-center",
          selectedRole === 'GENERAL'
            ? "bg-purple-50 border-purple-500 shadow-md shadow-purple-500/20"
            : "bg-gray-50/50 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-sm"
        )}
      >
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
          selectedRole === 'GENERAL' ? "bg-purple-600 text-white shadow-sm shadow-purple-600/40" : "bg-gray-100 text-gray-400 group-hover:text-purple-600 group-hover:bg-purple-100/50"
        )}>
          <User size={28} />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">일반 회원</h3>
          <p className="text-gray-500 text-xs font-medium">일자리를 찾는 구직자</p>
        </div>
        {selectedRole === 'GENERAL' && (
          <ShieldCheck className="absolute top-3 right-3 text-purple-600" size={20} strokeWidth={2.5} />
        )}
      </button>

      {/* Employer Card */}
      <button
        type="button"
        onClick={() => onSelect('EMPLOYER')}
        className={cn(
          "relative group p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-4 text-center",
          selectedRole === 'EMPLOYER'
            ? "bg-purple-50 border-purple-500 shadow-md shadow-purple-500/20"
            : "bg-gray-50/50 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-sm"
        )}
      >
        <div className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
          selectedRole === 'EMPLOYER' ? "bg-purple-600 text-white shadow-sm shadow-purple-600/40" : "bg-gray-100 text-gray-400 group-hover:text-purple-600 group-hover:bg-purple-100/50"
        )}>
          <Building2 size={28} />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 mb-1">업체 회원</h3>
          <p className="text-gray-500 text-xs font-medium">모델을 채용하려는 업체</p>
        </div>
        {selectedRole === 'EMPLOYER' && (
          <ShieldCheck className="absolute top-3 right-3 text-purple-600" size={20} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}
