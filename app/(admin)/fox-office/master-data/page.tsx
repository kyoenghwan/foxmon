'use client';

import React, { useState, useEffect } from 'react';
import { QA_GET_COMMON_CODES, CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';
import { OA_UPSERT_COMMON_CODE } from '@/src/atoms/oa/master/OA_UPSERT_COMMON_CODE';
import { OA_DELETE_COMMON_CODE } from '@/src/atoms/oa/master/OA_DELETE_COMMON_CODE';
import { Plus, Trash2, Edit2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function MasterDataPage() {
    const [codes, setCodes] = useState<CodeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [metaListTypes, setMetaListTypes] = useState<CodeItem[]>([]);
    const [selectedType, setSelectedType] = useState<string>('SYSTEM_LIST_TYPES');

    // Form states for new/editing
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [formVal, setFormVal] = useState({ code_value: '', code_name: '', sort_order: 0, description: '' });
    
    const [newFormOpen, setNewFormOpen] = useState(false);
    const [newFormVal, setNewFormVal] = useState({ code_value: '', code_name: '', sort_order: 0, description: '' });

    const loadData = async () => {
        setLoading(true);
        // Fetch ALL codes including inactive
        const res = await QA_GET_COMMON_CODES(undefined, false);
        if (res.success && res.data) {
            setCodes(res.data);
            const systemMetas = res.data.filter(c => c.list_type === 'SYSTEM_LIST_TYPES').sort((a,b) => a.sort_order - b.sort_order);
            setMetaListTypes(systemMetas);
            // If the selectedType is not found in systemMetas or is not SYSTEM_LIST_TYPES
            if (!systemMetas.find(m => m.code_value === selectedType) && selectedType !== 'SYSTEM_LIST_TYPES') {
                if (systemMetas.length > 0) setSelectedType('SYSTEM_LIST_TYPES');
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const typedCodes = codes.filter(c => c.list_type === selectedType).sort((a,b) => a.sort_order - b.sort_order);

    const handleToggleActive = async (code: CodeItem) => {
        await OA_UPSERT_COMMON_CODE({
            list_type: code.list_type,
            code_value: code.code_value,
            code_name: code.code_name,
            is_active: !code.is_active,
            sort_order: code.sort_order,
            description: code.description || undefined
        });
        loadData();
    };

    const handleDelete = async (code: CodeItem) => {
        if (!confirm('정말로 해당 코드를 완전 삭제하시겠습니까? (보통 비활성화를 권장합니다)')) return;
        await OA_DELETE_COMMON_CODE(code.list_type, code.code_value);
        loadData();
    };

    const startEdit = (code: CodeItem) => {
        setEditingKey(`${code.list_type}_${code.code_value}`);
        setFormVal({
            code_value: code.code_value,
            code_name: code.code_name,
            sort_order: code.sort_order,
            description: code.description || ''
        });
    };

    const saveEdit = async (code: CodeItem) => {
        const res = await OA_UPSERT_COMMON_CODE({
            list_type: code.list_type,
            code_value: formVal.code_value,
            code_name: formVal.code_name,
            sort_order: formVal.sort_order,
            description: formVal.description,
            is_active: code.is_active
        });
        if (res.success) {
            setEditingKey(null);
            loadData();
        } else {
            alert('저장 실패: ' + res.error);
        }
    };

    const saveNew = async () => {
        if (!newFormVal.code_value || !newFormVal.code_name) return alert('코드값과 표시명칭을 입력하세요.');
        const res = await OA_UPSERT_COMMON_CODE({
            list_type: selectedType,
            code_value: newFormVal.code_value,
            code_name: newFormVal.code_name,
            sort_order: newFormVal.sort_order,
            description: newFormVal.description,
            is_active: true
        });
        if (res.success) {
            setNewFormOpen(false);
            setNewFormVal({ code_value: '', code_name: '', sort_order: 0, description: '' });
            loadData();
        } else {
            alert('생성 실패: ' + res.error);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">공통코드/마스터 관리</h1>
                <p className="text-gray-500 font-medium mt-2">시스템 전반의 콤보박스 및 옵션 리스트 데이터를 통합 관리합니다.</p>
            </div>

            <div className="flex gap-8 items-start">
                {/* 왼쪽 사이드바 (리스트 타입 선택) */}
                <div className="w-64 bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0 shadow-sm">
                    <div className="p-4 bg-gray-50 border-b font-bold text-gray-700">분류 (List Type)</div>
                    <div className="flex flex-col divide-y divide-gray-100">
                        {/* 최상위 그룹 메타 관리 탭 */}
                        <button
                            onClick={() => setSelectedType('SYSTEM_LIST_TYPES')}
                            className={`text-left px-5 py-3 transition-colors text-[14px] font-bold ${selectedType === 'SYSTEM_LIST_TYPES' ? 'bg-primary/20 text-primary border-l-4 border-primary' : 'hover:bg-gray-50 bg-white text-gray-800 border-l-4 border-transparent'}`}
                        >
                            <div className="flex items-center gap-2">⚙️ 시스템 기초 리스트 그룹</div>
                            <div className={`text-[11px] mt-0.5 ${selectedType === 'SYSTEM_LIST_TYPES' ? 'text-primary/70' : 'text-gray-400 font-medium'}`}>SYSTEM_LIST_TYPES</div>
                        </button>
                        
                        {metaListTypes.map(meta => (
                            <button
                                key={meta.code_value}
                                onClick={() => setSelectedType(meta.code_value)}
                                className={`text-left px-5 py-3 transition-colors text-[14px] font-bold ${selectedType === meta.code_value ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'hover:bg-gray-50 bg-white text-gray-600 border-l-4 border-transparent'}`}
                            >
                                <div>{meta.code_name}</div>
                                <div className={`text-[11px] mt-0.5 ${selectedType === meta.code_value ? 'text-primary/70' : 'text-gray-400 font-medium'}`}>{meta.code_value}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 우측 메인 영역 (항목 리스트) */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
                    <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
                            <span className="text-primary">{selectedType === 'SYSTEM_LIST_TYPES' ? '⚙️ 시스템 기초 리스트 그룹' : metaListTypes.find(m => m.code_value === selectedType)?.code_name || selectedType}</span> <span className="text-sm font-medium text-gray-500 ml-1">항목 리스트</span>
                        </h2>
                        {!newFormOpen && (
                            <button 
                                onClick={() => setNewFormOpen(true)}
                                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-black transition-colors"
                            >
                                <Plus size={16} /> 신규 항목 추가
                            </button>
                        )}
                    </div>

                    <div className="p-0">
                        {loading ? (
                            <div className="p-10 text-center text-gray-400 font-bold">데이터를 불러오는 중입니다...</div>
                        ) : (
                            <table className="w-full text-left text-[14px]">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-[12px] uppercase">
                                    <tr>
                                        <th className="px-5 py-3 border-b">순서</th>
                                        <th className="px-5 py-3 border-b">코드값 (code_value)</th>
                                        <th className="px-5 py-3 border-b">표시명칭 (code_name)</th>
                                        <th className="px-5 py-3 border-b">활성</th>
                                        <th className="px-5 py-3 border-b">설명</th>
                                        <th className="px-5 py-3 border-b text-right">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 신규 등록 폼 */}
                                    {newFormOpen && (
                                        <tr className="bg-orange-50/50 border-b border-gray-200">
                                            <td className="px-5 py-3">
                                                <input type="number" value={newFormVal.sort_order} onChange={e=>setNewFormVal({...newFormVal, sort_order: Number(e.target.value)})} className="w-16 p-1.5 border rounded text-center font-bold" />
                                            </td>
                                            <td className="px-5 py-3">
                                                <input type="text" placeholder="예: SEOUL" value={newFormVal.code_value} onChange={e=>setNewFormVal({...newFormVal, code_value: e.target.value})} className="w-full p-1.5 border rounded font-bold uppercase" />
                                            </td>
                                            <td className="px-5 py-3">
                                                <input type="text" placeholder="예: 서울" value={newFormVal.code_name} onChange={e=>setNewFormVal({...newFormVal, code_name: e.target.value})} className="w-full p-1.5 border rounded font-bold" />
                                            </td>
                                            <td className="px-5 py-3 font-bold text-green-600">활성</td>
                                            <td className="px-5 py-3">
                                                <input type="text" placeholder="설명(선택)" value={newFormVal.description} onChange={e=>setNewFormVal({...newFormVal, description: e.target.value})} className="w-full p-1.5 border rounded text-xs" />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={saveNew} className="p-1.5 bg-primary text-white rounded hover:bg-orange-600"><Save size={16} /></button>
                                                    <button onClick={()=>setNewFormOpen(false)} className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"><X size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {typedCodes.length === 0 && !newFormOpen ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-gray-400 font-bold">
                                                등록된 항목이 없습니다.
                                            </td>
                                        </tr>
                                    ) : typedCodes.map(code => {
                                        const isEditing = editingKey === `${code.list_type}_${code.code_value}`;
                                        return (
                                            <tr key={`${code.list_type}_${code.code_value}`} className={`border-b border-gray-100 transition-colors ${!code.is_active ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                                                {isEditing ? (
                                                    <>
                                                        <td className="px-5 py-3"><input type="number" value={formVal.sort_order} onChange={e=>setFormVal({...formVal, sort_order: Number(e.target.value)})} className="w-16 p-1.5 border rounded text-center font-bold" /></td>
                                                        <td className="px-5 py-3"><input type="text" value={formVal.code_value} onChange={e=>setFormVal({...formVal, code_value: e.target.value})} className="w-full p-1.5 border rounded font-bold" /></td>
                                                        <td className="px-5 py-3"><input type="text" value={formVal.code_name} onChange={e=>setFormVal({...formVal, code_name: e.target.value})} className="w-full p-1.5 border rounded font-bold" /></td>
                                                        <td className="px-5 py-3 text-gray-500 font-bold">{code.is_active ? 'ON' : 'OFF'}</td>
                                                        <td className="px-5 py-3"><input type="text" value={formVal.description} onChange={e=>setFormVal({...formVal, description: e.target.value})} className="w-full p-1.5 border rounded text-xs" /></td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <button onClick={()=>saveEdit(code)} className="p-1.5 bg-primary text-white rounded hover:bg-orange-600"><Save size={16} /></button>
                                                                <button onClick={()=>setEditingKey(null)} className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"><X size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-5 py-3 font-bold text-gray-500">{code.sort_order}</td>
                                                        <td className="px-5 py-3 font-black text-gray-700">{code.code_value}</td>
                                                        <td className="px-5 py-3 font-bold text-gray-900">{code.code_name}</td>
                                                        <td className="px-5 py-3">
                                                            <button onClick={() => handleToggleActive(code)} className="transition-colors">
                                                                {code.is_active ? <ToggleRight size={24} className="text-primary" /> : <ToggleLeft size={24} className="text-gray-300" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-5 py-3 text-xs text-gray-500 truncate max-w-[150px]">{code.description || '-'}</td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex justify-end gap-2 text-gray-400">
                                                                <button onClick={()=>startEdit(code)} className="hover:text-primary transition-colors"><Edit2 size={16} /></button>
                                                                <button onClick={()=>handleDelete(code)} className="hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
