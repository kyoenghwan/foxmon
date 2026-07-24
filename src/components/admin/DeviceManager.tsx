'use client';

import { useTransition, useState } from 'react';
import { approveDevice, rejectDevice, deleteDevice } from '@/lib/actions/admin-devices';
import { useRouter } from 'next/navigation';
import { Laptop, Check, X, Trash2, Loader2, ShieldCheck } from 'lucide-react';

interface Device {
  id: string;
  device_token: string;
  device_name: string;
  status: string;
  created_at: string;
}

interface DeviceManagerProps {
  devices: Device[];
}

export default function DeviceManager({ devices }: DeviceManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    if (!confirm('해당 CS 단말 기기 승인을 완료하시겠습니까?')) return;
    setLoadingId(id);
    startTransition(async () => {
      const res = await approveDevice(id);
      setLoadingId(null);
      if (res.success) {
        alert(res.message);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  const handleReject = (id: string) => {
    if (!confirm('해당 CS 단말 기기 등록을 반려하시겠습니까?')) return;
    setLoadingId(id);
    startTransition(async () => {
      const res = await rejectDevice(id);
      setLoadingId(null);
      if (res.success) {
        alert(res.message);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('이 기기 정보를 정말로 삭제하시겠습니까?\n삭제 즉시 해당 기기의 CS 페이지 접근이 차단됩니다.')) return;
    setLoadingId(id);
    startTransition(async () => {
      const res = await deleteDevice(id);
      setLoadingId(null);
      if (res.success) {
        alert(res.message);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Laptop className="w-5 h-5 text-primary" />
        <h3 className="font-black text-gray-900">CS 전용 기기 승인 관리</h3>
      </div>
      <p className="text-[12px] text-gray-500 font-medium -mt-1">
        등록 신청된 모바일 기기 및 PC 브라우저를 확인하고 승인/반려합니다. 승인 완료된 기기에서만 실시간 CS 대시보드 접근이 허용됩니다.
      </p>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[12px] font-bold text-gray-600">
            <tr>
              <th className="p-3">기기 설명 (별칭)</th>
              <th className="p-3">기기 고유 토큰 (Token)</th>
              <th className="p-3">상태</th>
              <th className="p-3">신청일</th>
              <th className="p-3 text-center">승인 관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700">
            {devices.map((dev) => {
              const isLoading = loadingId === dev.id;

              return (
                <tr key={dev.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3">
                    <span className="font-black text-gray-900 text-[13px]">
                      {dev.device_name}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[10px] text-gray-400 select-all max-w-[200px] truncate" title={dev.device_token}>
                    {dev.device_token}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-black ${
                      dev.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                      dev.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {dev.status === 'APPROVED' ? '승인 완료' :
                       dev.status === 'PENDING' ? '승인 대기' : '반려됨'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 font-medium">
                    {new Date(dev.created_at).toLocaleString('ko-KR', { hour12: false })}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      {/* 승인 단추 */}
                      {dev.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(dev.id)}
                          disabled={isLoading}
                          className="h-8 px-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-bold rounded-lg transition-all flex items-center gap-1 text-[11px]"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          승인
                        </button>
                      )}

                      {/* 반려 단추 */}
                      {dev.status === 'PENDING' && (
                        <button
                          onClick={() => handleReject(dev.id)}
                          disabled={isLoading}
                          className="h-8 px-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 text-white font-bold rounded-lg transition-all flex items-center gap-1 text-[11px]"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          반려
                        </button>
                      )}

                      {/* 삭제 단추 */}
                      <button
                        onClick={() => handleDelete(dev.id)}
                        disabled={isLoading}
                        className="h-8 w-8 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 font-bold rounded-lg transition-all flex items-center justify-center border border-gray-200"
                        title="기기 정보 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {devices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500 font-medium">
                  등록 신청된 CS 기기가 존재하지 않습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
