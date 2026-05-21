# 이미지 자동 WebP 최적화 변환 지침 (v1.0)

## 📌 개요
폭스몬 플랫폼의 웹 성능 극대화 및 스토리지 비용 절감을 위해, **플랫폼 내 모든 이미지 업로드 및 저장 양식(Form)에는 업로드된 이미지를 WebP 형식으로 변환하여 저장**해야 합니다.

## ⚠️ 이미지 최적화 필수 규칙

### 1. 전역 WebP 변환 원칙
- JPG, JPEG, PNG, HEIC 등 모든 정적 이미지는 서버/스토리지 저장 전에 **WebP 포맷으로 자동 변환**합니다.
- 변환 시 기본 압축 품질(Quality)은 **`80`**을 유지하여 화질 대비 용량 효율을 최적화합니다.

### 2. 애니메이션 이미지 (GIF 등) 감지 및 보존 규칙
- 움직이는 이미지(GIF 등)를 단순 변환하면 단일 프레임 정지 이미지로 열화되므로, **반드시 애니메이션 여부를 자동 판별**해야 합니다.
- **판별 기준**: 이미지 메타데이터의 프레임 수(Pages)가 2개 이상(`pages > 1`)인 경우 움직이는 이미지로 간주합니다.
- **변환 방식**: 애니메이션이 감지된 경우, 변환 라이브러리(Sharp 등)에 `{ animated: true }` 옵션을 부여하여 움직임 프레임과 지연 시간을 보존한 **Animated WebP**로 변환하여 저장합니다.

### 3. 미디어 타입별 예외 처리
- PDF 등 이미지가 아닌 증빙 서류 파일의 경우 변환 처리를 생략하고 원본 그대로 업로드합니다.

---

## 🛠️ 핵심 구현 코드 스펙 (`lib/image-optimizer.ts`)

```typescript
import sharp from 'sharp';

export async function optimizeToWebp(buffer: Buffer) {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // 2개 이상의 프레임을 가진 애니메이션 이미지 판별
    const isAnimated = (metadata.pages && metadata.pages > 1) || false;
    
    let processed = sharp(buffer, isAnimated ? { animated: true } : undefined);
    
    const webpBuffer = await processed
        .toFormat('webp', {
            quality: 80,
            effort: 4,
        })
        .toBuffer();
        
    return {
        buffer: webpBuffer,
        contentType: 'image/webp',
        ext: 'webp'
    };
}
```

## 🔄 업로드 핸들러 적용 대상
1. **고객센터/FAQ 첨부 이미지**: `lib/actions/help-upload.ts` (적용 완료)
2. **기업 인증서류 첨부 이미지**: `lib/actions/upload.ts` (적용 완료)
3. **향후 추가되는 모든 이미지 저장/수정 폼**: 상기 이미지 최적화 규칙을 준수하여 작성할 것.
