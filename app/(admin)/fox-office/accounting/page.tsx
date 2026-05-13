'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Plus, ArrowUpRight, ArrowDownRight, DollarSign, Download, Trash2 } from 'lucide-react';
import { getAccountingRecords, addAccountingRecord, deleteAccountingRecord, AccountingRecord } from '@/lib/accounting-service';

export default function AccountingDashboardPage() {
    const [records, setRecords] = useState<AccountingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    
    // YYYY-MM
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        category: '서버비',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().slice(0, 10)
    });

    const loadRecords = async () => {
        setLoading(true);
        const data = await getAccountingRecords(selectedMonth);
        setRecords(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRecords();
    }, [selectedMonth]);

    const totalIncome = records.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpense;
    // 1구좌(200만)당 1% 배당금
    const dividendPerUnit = netProfit > 0 ? Math.floor(netProfit * 0.01) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await addAccountingRecord({
            type: formData.type,
            category: formData.category,
            amount: Number(formData.amount.replace(/,/g, '')),
            description: formData.description,
            transaction_date: formData.transaction_date
        });
        if (success) {
            setIsModalOpen(false);
            setFormData({ ...formData, amount: '', description: '' });
            loadRecords();
        } else {
            alert('등록에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('이 내역을 삭제하시겠습니까?')) {
            const success = await deleteAccountingRecord(id);
            if (success) {
                loadRecords();
            } else {
                alert('삭제에 실패했습니다.');
            }
        }
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-7 h-7 text-primary" />
                        회계/정산 관리
                    </h1>
                    <p className="text-sm text-gray-500">매월 수입과 지출을 기록하고 투자자들에게 공유할 순수익과 배당금을 산출합니다.</p>
                </div>
                
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-10 px-4 rounded-lg border border-gray-200 text-[14px] font-bold text-gray-900 focus:outline-none focus:border-primary"
                />
            </div>

            {/* Summary Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                    <div className="text-[13px] font-bold text-gray-500 flex items-center gap-1">
                        <ArrowUpRight className="w-4 h-4 text-blue-500" /> 총 매출 (수입)
                    </div>
                    <div className="text-2xl font-black text-gray-900">{totalIncome.toLocaleString()}원</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                    <div className="text-[13px] font-bold text-gray-500 flex items-center gap-1">
                        <ArrowDownRight className="w-4 h-4 text-red-500" /> 총 지출
                    </div>
                    <div className="text-2xl font-black text-gray-900">{totalExpense.toLocaleString()}원</div>
                </div>
                <div className="bg-gray-900 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                    <div className="text-[13px] font-bold text-gray-400 flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-400" /> 이번 달 순수익
                    </div>
                    <div className="text-2xl font-black text-white">{netProfit.toLocaleString()}원</div>
                </div>
                <div className="bg-primary/10 p-6 rounded-2xl shadow-sm border border-primary/20 flex flex-col gap-2">
                    <div className="text-[13px] font-bold text-primary flex items-center gap-1">
                        1구좌(200만) 예상 배당금 (1%)
                    </div>
                    <div className="text-2xl font-black text-primary">{dividendPerUnit.toLocaleString()}원</div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">거래 내역</h2>
                    <div className="flex gap-2">
                        <button className="h-9 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-[13px] font-bold transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" /> 엑셀 다운로드
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="h-9 px-4 bg-primary text-white hover:bg-orange-600 rounded-lg text-[13px] font-bold transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> 내역 추가
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="p-4 text-[13px] font-black text-gray-400 w-32">거래일자</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-24 text-center">유형</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-32 text-center">분류</th>
                                <th className="p-4 text-[13px] font-black text-gray-400">상세 설명</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-40 text-right">금액</th>
                                <th className="p-4 text-[13px] font-black text-gray-400 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">로딩 중...</td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">기록된 내역이 없습니다.</td>
                                </tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-[13px] font-medium text-gray-600">{r.transaction_date}</td>
                                        <td className="p-4 text-center">
                                            {r.type === 'INCOME' ? (
                                                <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">수입</span>
                                            ) : (
                                                <span className="text-[11px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded">지출</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center text-[13px] font-bold text-gray-700">{r.category}</td>
                                        <td className="p-4 text-[13px] text-gray-600">{r.description}</td>
                                        <td className={`p-4 text-[14px] font-black text-right ${r.type === 'INCOME' ? 'text-blue-600' : 'text-red-600'}`}>
                                            {r.type === 'INCOME' ? '+' : '-'}{r.amount.toLocaleString()}원
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Record Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900">수입/지출 내역 추가</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-bold text-gray-500">유형</label>
                                    <select 
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                                        className="h-10 px-3 rounded-lg border border-gray-200 text-[14px] focus:outline-none focus:border-primary"
                                    >
                                        <option value="INCOME">수입 (매출 등)</option>
                                        <option value="EXPENSE">지출 (비용 등)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-bold text-gray-500">거래 일자</label>
                                    <input 
                                        type="date" 
                                        value={formData.transaction_date}
                                        onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                                        required
                                        className="h-10 px-3 rounded-lg border border-gray-200 text-[14px] focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-gray-500">분류 카테고리</label>
                                <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="h-10 px-3 rounded-lg border border-gray-200 text-[14px] focus:outline-none focus:border-primary"
                                >
                                    {formData.type === 'INCOME' ? (
                                        <>
                                            <option value="광고매출">광고 매출</option>
                                            <option value="일반구인매출">일반 구인 매출</option>
                                            <option value="기타수입">기타 수입</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="서버비">서버/인프라비</option>
                                            <option value="마케팅비">마케팅/문자발송비</option>
                                            <option value="인건비">인건비(급여)</option>
                                            <option value="운영비">사무실/운영비</option>
                                            <option value="기타지출">기타 지출</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-gray-500">금액 (원)</label>
                                <input 
                                    type="number" 
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="예: 50000"
                                    required
                                    min="0"
                                    className="h-10 px-3 rounded-lg border border-gray-200 text-[14px] font-bold focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-bold text-gray-500">상세 설명</label>
                                <input 
                                    type="text" 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="내역에 대한 상세 설명을 적어주세요"
                                    required
                                    className="h-10 px-3 rounded-lg border border-gray-200 text-[14px] focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-bold hover:bg-gray-200 transition-colors"
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 h-11 bg-primary text-white rounded-lg text-[14px] font-bold hover:bg-orange-600 transition-colors"
                                >
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
