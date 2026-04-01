'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Calendar, Save, Calculator } from 'lucide-react';

interface PolicyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: any) => void;
}

/**
 * [Admin Component] PolicyFormModal
 * 신규 정책(보너스, 수수료 등)을 예약 등록하거나 즉시 적용하는 관리자 전용 팝업입니다.
 */
export function PolicyFormModal({ isOpen, onClose, onSave }: PolicyFormModalProps) {
  const [configKey, setConfigKey] = useState('FIRST_CHARGE_BONUS_RATIO');
  const [configValue, setConfigValue] = useState('');
  const [startAt, setStartAt] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!configKey || !configValue || (!startAt && !isOverride)) {
      alert('필수 정보를 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    // 💡 OA_EXECUTE_POLICY_UPSERT 연동 지점
    setTimeout(() => {
      onSave({ configKey, configValue, startAt, isOverride });
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2 italic">
            <Calculator className="h-5 w-5 text-primary" />
            신규 포인트 정책 예약/등록
          </DialogTitle>
          <DialogDescription>
            시스템 전체의 보너스 비율 또는 수수료 정책을 새롭게 정의합니다. 🦊
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. 정책 키 선택 */}
          <div className="grid gap-2">
            <Label htmlFor="key" className="font-bold">정책 항목 선택</Label>
            <Select value={configKey} onValueChange={setConfigKey}>
              <SelectTrigger id="key" className="h-10">
                <SelectValue placeholder="항목 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIRST_CHARGE_BONUS_RATIO">첫 충전 보너스 비율 (예: 0.5)</SelectItem>
                <SelectItem value="MAX_FIRST_CHARGE_BONUS">첫 충전 보너스 상한액 (원)</SelectItem>
                <SelectItem value="REFUND_FEE_RATIO">환불 수수료 비율 (예: 0.1)</SelectItem>
                <SelectItem value="REFUND_DIVISOR">환불 배수 정산 기준 (예: 1.5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. 설정 값 입력 */}
          <div className="grid gap-2">
            <Label htmlFor="value" className="font-bold">설정 수치 (숫자)</Label>
            <Input 
              id="value" 
              type="number"
              placeholder="예: 0.5 (50%), 300000 (30만P)" 
              value={configValue}
              onChange={(e) => setConfigValue(e.target.value)}
              className="h-10"
            />
          </div>

          {/* 3. 예약 시간 설정 */}
          <div className="grid gap-2 opacity-100 transition-opacity">
            <Label htmlFor="startAt" className="font-bold">적용 시작 일시 (예약)</Label>
            <div className="relative">
               <Input 
                id="startAt" 
                type="datetime-local"
                value={startAt}
                disabled={isOverride}
                onChange={(e) => setStartAt(e.target.value)}
                className="h-10 pl-10"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground italic">지정하지 않으면 '즉시 적용' 옵션에 따라 달라집니다.</p>
          </div>

          {/* 4. 즉시 적용 옵션 (Override) */}
          <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
            <Checkbox 
              id="modal-override" 
              checked={isOverride}
              onCheckedChange={(checked) => setIsOverride(checked as boolean)}
              className="border-red-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" 
            />
            <div className="space-y-0.5">
              <label htmlFor="modal-override" className="text-[13px] font-black text-red-700 dark:text-red-400 cursor-pointer">기존 정책 즉시 종료 및 강제 적용</label>
              <p className="text-[11px] text-red-600/70 dark:text-red-400/60 leading-tight">선택 시 예약 기능을 무시하고 지금 즉시 시스템에 배포됩니다. ⚠️</p>
            </div>
          </div>
        </div>

        <Alert variant="default" className="bg-blue-50 border-blue-100 text-blue-700 py-2">
           <AlertTriangle className="h-4 w-4 text-blue-500" />
           <AlertDescription className="text-xs font-medium">정책 변경 내용은 로그로 보관되며, 사환 및 차감 로직에 즉각 반영됩니다.</AlertDescription>
        </Alert>

        <DialogFooter className="gap-2 sm:gap-0 font-bold">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>취소</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="bg-black text-white hover:bg-gray-800 flex-1 shadow-lg shadow-black/10"
          >
            {isSubmitting ? '정책 배포 중...' : (isOverride ? '즉시 강제 적용' : '정책 예약 완료')}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
