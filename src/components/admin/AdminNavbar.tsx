'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Menu,
  ChevronDown
} from 'lucide-react';
import { handleSignOut } from '@/lib/actions';

export function AdminNavbar({ session }: { session: any }) {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/80">
      {/* Search & Breadcrumb */}
      <div className="flex items-center gap-6">
        <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100 focus-within:ring-2 ring-primary/10 transition-all">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="통합 검색..." 
            className="bg-transparent border-none outline-none text-[14px] font-bold text-gray-600 w-64"
          />
        </div>
      </div>

      {/* Right: Notifications & User */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-px h-6 bg-gray-100 mx-2"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[13px] font-black text-gray-900 leading-none">{session?.user?.name || '관리자'}</span>
            <span className={`text-[10px] font-black italic uppercase tracking-wider ${
              session?.user?.role === 'SUPER_ADMIN' ? 'text-red-500' : 'text-purple-600'
            }`}>
              {session?.user?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMINISTRATOR'}
            </span>
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border border-gray-200">
            <User size={22} strokeWidth={2.5} />
          </div>
          
          <form action={handleSignOut}>
            <button 
              type="submit"
              className="p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all group"
              title="로그아웃"
            >
              <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
