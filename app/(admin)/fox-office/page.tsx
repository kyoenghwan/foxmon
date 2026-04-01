'use client';

import React, { useEffect, useState } from 'react';
import { QA_GET_ALL_USERS } from '@/src/atoms/qa/admin/QA_GET_ALL_USERS';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Clock, 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserMinus, 
  FileText, 
  Mail, 
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchUsers() {
            setLoading(true);
            const result = await QA_GET_ALL_USERS();
            if (result.success) {
                setUsers(result.data);
            }
            setLoading(false);
        }
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => 
        user.login_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-[14px] font-black text-gray-400 tracking-tight italic uppercase">Loading System Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-[34px] font-black text-gray-900 tracking-tight italic uppercase leading-tight">
                        Member Dashboard
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            <Clock size={12} strokeWidth={2.5} /> Real-time
                        </div>
                        <p className="text-gray-400 font-bold text-[13px]">여우알바의 모든 사용자 정보를 모니터링하고 관리합니다.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-11 rounded-xl border-gray-200 text-gray-500 font-bold px-4 hover:bg-gray-50 transition-colors">
                        <Filter size={18} className="mr-2" /> 필터링
                    </Button>
                    <Button className="h-11 rounded-xl bg-gray-900 border-none px-6 font-black text-white hover:bg-black transition-all shadow-lg shadow-gray-200">
                        <Users size={18} className="mr-2" /> 전체 메일 발송
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: '전체 사용자', count: users.length, icon: Users, color: 'from-blue-600 to-blue-400', sub: '지난 달 대비 +12%' },
                    { label: '업체 회원', count: users.filter(u => u.role === 'EMPLOYER').length, icon: ShieldCheck, color: 'from-primary to-orange-400', sub: '활성화 업체: 8개' },
                    { label: '인증 완료', count: users.filter(u => u.is_age_verified).length, icon: UserCheck, color: 'from-emerald-600 to-emerald-400', sub: '인증률 100%' },
                    { label: '가입 대기', count: 0, icon: Clock, color: 'from-gray-700 to-gray-500', sub: '최근 24시간 이내' }
                ].map((stat, i) => (
                    <div key={i} className="relative group overflow-hidden">
                        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative z-10">
                            <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-gray-200 group-hover:scale-110 transition-transform duration-500 mb-5`}>
                                <stat.icon size={28} />
                            </div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1">{stat.label}</p>
                            <div className="flex items-end gap-2">
                                <p className="text-[32px] font-black text-gray-900 tracking-tighter leading-none">{stat.count.toLocaleString()}</p>
                                <span className="text-[12px] font-black text-green-500 mb-1 leading-none">{stat.sub}</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-0" />
                    </div>
                ))}
            </div>

            {/* List Section */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        <h3 className="text-xl font-black text-gray-900 italic tracking-tight italic uppercase">User Registry</h3>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border">
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-black bg-white shadow-sm text-gray-900">전체보기</Button>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-black text-gray-400 hover:text-gray-900 transition-colors">미인증</Button>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-black text-gray-400 hover:text-gray-900 transition-colors">탈퇴전</Button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100">
                                <th className="py-5 px-8 font-black w-[100px]">No.</th>
                                <th className="py-5 px-8 font-black">Account Profile</th>
                                <th className="py-5 px-8 font-black">Personal Info</th>
                                <th className="py-5 px-8 font-black">Contact</th>
                                <th className="py-5 px-8 font-black text-center">Status</th>
                                <th className="py-5 px-8 font-black text-center">Join Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((user, idx) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-6 px-8 text-[12px] font-bold text-gray-300 tabular-nums">
                                        {(idx + 1).toString().padStart(3, '0')}
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 font-black">
                                                {user.name?.[0] || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[14px] font-black text-gray-900 tracking-tight">{user.login_id}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black text-white ${
                                                        user.role === 'SUPER_ADMIN' ? 'bg-red-500' : 
                                                        user.role === 'ADMIN' ? 'bg-purple-600' : 
                                                        user.role === 'EMPLOYER' ? 'bg-primary' : 'bg-blue-500'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-gray-400 font-bold group-hover:text-primary transition-colors cursor-pointer">Modify Account</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-black text-gray-800">{user.name}</span>
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold">
                                                <Mail size={12} strokeWidth={2.5} /> {user.email || 'no-email'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 text-[13px] font-bold text-gray-600 tabular-nums">
                                        {user.phone_number || '-'}
                                    </td>
                                    <td className="py-6 px-8 text-center">
                                        {user.is_age_verified ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg ring-1 ring-emerald-100 uppercase italic">
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg ring-1 ring-orange-100 uppercase italic">
                                                Unverified
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-6 px-8 text-center">
                                        <span className="text-[12px] font-bold text-gray-500 tabular-nums">
                                            {new Date(user.created_at).toLocaleDateString('ko-KR')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="py-32 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                            <Search size={32} strokeWidth={2.5} />
                        </div>
                        <p className="text-[15px] font-black text-gray-400 italic uppercase">No Data Found</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-between items-center bg-gray-900 p-8 rounded-[32px] text-white shadow-2xl shadow-gray-200 relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-1">
                    <h4 className="text-xl font-black italic uppercase tracking-tight">System Performance Monitor</h4>
                    <p className="text-gray-400 text-sm font-bold">서버 상태 및 실시간 트래픽을 모니터링합니다.</p>
                </div>
                <div className="relative z-10">
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white font-black h-12 rounded-2xl hover:bg-white hover:text-gray-900 transition-all px-8"> 
                        상태 로그 보기 <TrendingUp size={18} className="ml-2" />
                    </Button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
            </div>
        </div>
    );
}
