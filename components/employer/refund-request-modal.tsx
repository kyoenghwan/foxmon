'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Landmark, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundAmount: number;
}

/**
 * [Component] RefundRequestModal
 * 사장님의 계좌 정보를 입력받아 최종 환불 신청을 진행하는 모달입니다.
 * 계좌번호는 숫자만 입력 가능하도록 정규식 마스킹을 적용합니다.
 */
export function RefundRequestModal({ isOpen, onClose, refundAmount }: RefundRequestModalProps) {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 💡 계좌 번호 숫자만 허용 (0-9 이외 제거)
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAccountNumber(value);
  };

  const handleSubmit = async () => {
    if (!bankName || !accountNumber || !accountHolder) {
      alert('모든 정보를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    // 💡 실제 FA_REQUEST_REFUND_FLOW 호출 로직 연동 지점
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] text-center py-10">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">환불 신청 완료</DialogTitle>
            <DialogDescription className="text-base pt-2">
              정상적으로 접수되었습니다.<br />
              **영업일 기준 3일 이내**에 입금됩니다.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose} className="mt-6 w-full py-6 font-bold text-lg">확인</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            환불 계좌 정보 입력
          </DialogTitle>
          <DialogDescription>
            신청 시 보유한 모든 보너스 포인트는 즉시 소멸됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg text-center border">
            <p className="text-xs text-muted-foreground mb-1">최종 환불 예정액</p>
            <p className="text-2xl font-black text-red-600">{refundAmount.toLocaleString()} 원</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bank">환불 은행</Label>
            <Select onValueChange={setBankName}>
              <SelectTrigger id="bank">
                <SelectValue placeholder="은행 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KB">국민은행</SelectItem>
                <SelectItem value="SHINHAN">신한은행</SelectItem>
                <SelectItem value="WOORI">우리은행</SelectItem>
                <SelectItem value="HANA">하나은행</SelectItem>
                <SelectItem value="KAKAO">카카오뱅크</SelectItem>
                <SelectItem value="TOSS">토스뱅크</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account">계좌 번호</Label>
            <Input 
              id="account" 
              placeholder="'-' 없이 숫자만 입력" 
              value={accountNumber}
              onChange={handleAccountChange}
              className="font-mono text-lg"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="holder">예금주</Label>
            <Input 
              id="holder" 
              placeholder="성함 또는 상호명" 
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>
        </div>

        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs leading-relaxed font-bold">
            신청 후에는 취소가 불가능하며, 영업일 기준 3일 이내에 입금됩니다.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>취소</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="flex-1 font-bold"
          >
            {isSubmitting ? '처리 중...' : '환불 신청 완료'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
