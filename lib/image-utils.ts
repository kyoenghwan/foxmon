/**
 * 클라이언트 측 이미지 압축 유틸리티
 */

interface CompressOptions {
    maxWidthOrHeight?: number; // 최대 가로/세로 길이 (기본: 1200)
    quality?: number; // 압축 퀄리티 0~1 (기본: 0.8)
    format?: 'image/jpeg' | 'image/png' | 'image/webp'; // 출력 포맷 (기본: 원본에 따라 자동 또는 webp)
}

export async function compressImageFile(file: File, options: CompressOptions = {}): Promise<string> {
    const { 
        maxWidthOrHeight = 1200, 
        quality = 0.8,
        format = file.type === 'image/png' ? 'image/png' : 'image/webp'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // 비율 유지하며 사이즈 줄이기
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = Math.round((height * maxWidthOrHeight) / width);
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = Math.round((width * maxWidthOrHeight) / height);
                        height = maxWidthOrHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // 이미지 그리기 (리사이징)
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // 압축 후 Base64 반환 (로고 PNG의 경우 품질 손실 없이 반환될 수 있음)
                const dataUrl = canvas.toDataURL(format, quality);
                resolve(dataUrl);
            };
            
            img.onerror = (error) => reject(error);
        };
        
        reader.onerror = (error) => reject(error);
    });
}
