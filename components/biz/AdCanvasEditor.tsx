'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Image as ImageIcon, Type, Trash2, Download, Plus, Move, RotateCcw,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Palette, Layers, Copy, ChevronUp, ChevronDown, Square, AlignHorizontalSpaceAround,
    Crown, Paintbrush
} from 'lucide-react';

// Fabric.js v6: named imports
import { Canvas, FabricText, Textbox, FabricImage, Rect, Pattern, Shadow } from 'fabric';

// ─── 타입 ───
interface AdCanvasEditorProps {
    value?: string;            // JSON 직렬화된 캔버스 데이터
    onChange?: (json: string) => void;
    bgImage?: string;          // 배경 이미지 URL
    onBgImageChange?: (url: string) => void;
    width?: number;
    height?: number;
}

// ─── 구글 폰트 목록 ───
const FONT_LIST = [
    'Noto Sans KR', 'Nanum Gothic', 'Nanum Myeongjo', 'Nanum Pen Script',
    'Black Han Sans', 'Do Hyeon', 'Jua', 'Gaegu', 'Gothic A1',
    'Inter', 'Roboto', 'Poppins', 'Montserrat',
];

// ─── 색상 팔레트 ───
const TEXT_COLORS = [
    '#FFFFFF', '#000000', '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1',
];

const BG_PRESETS = [
    { label: '없음', value: '' },
    { label: '그라데이션 1', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { label: '그라데이션 2', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { label: '그라데이션 3', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { label: '다크', value: '#1a1a2e' },
    { label: '화이트', value: '#ffffff' },
    { label: '웜', value: '#ffecd2' },
];

// ─── 메인 컴포넌트 ───
export default function AdCanvasEditor({
    value,
    onChange,
    bgImage,
    onBgImageChange,
    width = 600,
    height = 400,
}: AdCanvasEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const [activeObj, setActiveObj] = useState<any>(null);
    const [bgUrl, setBgUrl] = useState(bgImage || '');
    const [isPattern, setIsPattern] = useState(true); // 배경을 패턴으로 깔지 여부
    const [canvasReady, setCanvasReady] = useState(false);
    const [canvasHeight, setCanvasHeight] = useState(height); // 가변 높이

    // ── 텍스트 속성 상태 (선택된 텍스트 오브젝트의 현재 값) ──
    const [textProps, setTextProps] = useState({
        fontFamily: 'Noto Sans KR',
        fontSize: 32,
        fill: '#000000',
        fontWeight: 'normal' as string,
        fontStyle: 'normal' as string,
        underline: false,
        textAlign: 'center' as string,
        shadow: '',
    });

    // ── 캔버스 초기화 ──
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width,
            height: canvasHeight,
            backgroundColor: '#ffffff',
            selection: true,
            preserveObjectStacking: true,
        });

        fabricRef.current = canvas;
        setCanvasReady(true);

        // 선택 이벤트
        canvas.on('selection:created', (e) => handleSelection(e.selected?.[0]));
        canvas.on('selection:updated', (e) => handleSelection(e.selected?.[0]));
        canvas.on('selection:cleared', () => { setActiveObj(null); });

        // 자석(스냅) 기능: 중앙 근처로 가면 찰칵 붙음
        canvas.on('object:moving', (e) => {
            const obj = e.target;
            if (!obj) return;
            const SNAP_DISTANCE = 20;
            const centerX = width / 2;
            const center = obj.getCenterPoint();
            if (Math.abs(center.x - centerX) < SNAP_DISTANCE) {
                if (obj.originX === 'center') {
                    obj.set({ left: centerX });
                } else if (obj.originX === 'left') {
                    obj.set({ left: centerX - (obj.getScaledWidth() / 2) });
                } else if (obj.originX === 'right') {
                    obj.set({ left: centerX + (obj.getScaledWidth() / 2) });
                }
            }
        });

        // 변경 이벤트 → 부모에 JSON 전달
        canvas.on('object:modified', () => emitChange(canvas));
        canvas.on('object:added', () => emitChange(canvas));
        canvas.on('object:removed', () => emitChange(canvas));

        // 키보드 이벤트 (DEL 삭제)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const active = canvas.getActiveObject() as any;
                if (!active) return;
                
                if (active.isEditing) return; // 텍스트 편집 중이면 삭제 안함
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

                canvas.remove(active);
                canvas.discardActiveObject();
                canvas.renderAll();
                emitChange(canvas);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // 기존 데이터 로드
        if (value) {
            try {
                canvas.loadFromJSON(JSON.parse(value)).then(() => {
                    canvas.renderAll();
                });
            } catch { /* 초기 빈 값 */ }
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            canvas.dispose();
            fabricRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── 캔버스 크기/배경 리렌더링 ──
    useEffect(() => {
        if (!fabricRef.current || !canvasReady) return;
        const canvas = fabricRef.current;

        // 높이 변경 적용
        canvas.setDimensions({ width, height: canvasHeight });

        // 전체 테마 배경(상/중/하)가 있는 경우, 높이 변경에 맞춰 중간 패턴 크기 및 하단 이미지 위치 조정
        const objects = canvas.getObjects() as any[];
        const topBg = objects.find(o => o.id === 'bgTop');
        const middleBg = objects.find(o => o.id === 'bgMiddle');
        const bottomBg = objects.find(o => o.id === 'bgBottom');

        if (topBg && middleBg && bottomBg) {
             const topH = topBg.height! * topBg.scaleY!;
             const botH = bottomBg.height! * bottomBg.scaleY!;
             const midH = Math.max(0, canvasHeight - topH - botH);
             middleBg.set({ height: midH });
             bottomBg.set({ top: canvasHeight - botH });
        }

        if (bgUrl) {
            FabricImage.fromURL(bgUrl, { crossOrigin: 'anonymous' }).then((img) => {
                if (!img) return;
                
                if (isPattern) {
                    // 심리스 패턴으로 설정
                    const pattern = new Pattern({
                        source: img.getElement(),
                        repeat: 'repeat',
                    });
                    canvas.set('backgroundColor', pattern as any);
                    canvas.set('backgroundImage', undefined);
                } else {
                    // 캔버스에 꽉 차게 스케일
                    const scaleX = width / (img.width || 1);
                    const scaleY = canvasHeight / (img.height || 1);
                    const scale = Math.max(scaleX, scaleY);
                    img.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', top: canvasHeight / 2, left: width / 2 });
                    canvas.set('backgroundImage', img);
                    canvas.set('backgroundColor', '#ffffff');
                }
                canvas.renderAll();
                emitChange(canvas);
            }).catch(() => { /* 이미지 로드 실패 무시 */ });
        } else {
            canvas.set('backgroundImage', undefined);
            // 만약 기본 프리셋 색상이라면 그대로 유지 (여기서는 덮어쓰지 않음)
            if (canvas.backgroundColor instanceof Pattern) {
                canvas.set('backgroundColor', '#ffffff');
            }
            canvas.renderAll();
            emitChange(canvas);
        }
    }, [bgUrl, canvasReady, isPattern, canvasHeight, width]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── 선택 핸들러 ──
    const handleSelection = (obj: any) => {
        setActiveObj(obj);
        if (obj && obj.type === 'text') {
            setTextProps({
                fontFamily: obj.fontFamily || 'Noto Sans KR',
                fontSize: obj.fontSize || 32,
                fill: (obj.fill as string) || '#000000',
                fontWeight: obj.fontWeight || 'normal',
                fontStyle: obj.fontStyle || 'normal',
                underline: obj.underline || false,
                textAlign: obj.textAlign || 'center',
                shadow: obj.shadow ? (typeof obj.shadow === 'string' ? obj.shadow : '') : '',
            });
        }
    };

    // ── 부모에 JSON 전달 ──
    const emitChange = useCallback((canvas: Canvas) => {
        if (onChange) {
            const json = (canvas as any).toJSON(['id', 'selectable', 'evented']);
            onChange(JSON.stringify(json));
        }
    }, [onChange]);

    // ── 전체 테마 템플릿 적용 ──
    const applyFullTheme = async (themeName: 'gold_bar' | 'neon_nightclub') => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        if (!confirm('기존 캔버스 내용이 모두 지워지고 새로운 테마로 덮어씌워집니다. 계속하시겠습니까?')) return;

        canvas.clear();
        canvas.set('backgroundColor', '#ffffff');
        canvas.set('backgroundImage', undefined);
        setBgUrl('');
        if (onBgImageChange) onBgImageChange('');

        try {
            const [img1, img2, img3] = await Promise.all([
                new Promise<any>((resolve, reject) => FabricImage.fromURL(`/images/themes/${themeName}_1.png`, { crossOrigin: 'anonymous' }).then(resolve).catch(reject)),
                new Promise<any>((resolve, reject) => FabricImage.fromURL(`/images/themes/${themeName}_2.png`, { crossOrigin: 'anonymous' }).then(resolve).catch(reject)),
                new Promise<any>((resolve, reject) => FabricImage.fromURL(`/images/themes/${themeName}_3.png`, { crossOrigin: 'anonymous' }).then(resolve).catch(reject))
            ]);

            const scale1 = width / img1.width!;
            img1.set({ scaleX: scale1, scaleY: scale1, left: 0, top: 0, originX: 'left', originY: 'top', selectable: false, evented: false, id: 'bgTop' } as any);
            const topH = img1.height! * scale1;

            const scale3 = width / img3.width!;
            img3.set({ scaleX: scale3, scaleY: scale3, left: 0, originX: 'left', originY: 'top', selectable: false, evented: false, id: 'bgBottom' } as any);
            const botH = img3.height! * scale3;

            const patternImg = img2.getElement();
            const pattern = new Pattern({ source: patternImg, repeat: 'repeat' });

            const initialHeight = Math.max(1000, topH + botH + 400);
            
            // 캔버스 크기(높이) 강제 업데이트 - 이후 useEffect 에서 처리됨
            setCanvasHeight(initialHeight);

            const rect = new Rect({
                left: 0, top: topH,
                originX: 'left', originY: 'top',
                width: width, height: initialHeight - topH - botH,
                fill: pattern as any,
                selectable: false, evented: false,
                id: 'bgMiddle'
            } as any);

            img3.set({ top: initialHeight - botH });

            canvas.add(img1, rect, img3);

            // 텍스트 블록 추가
            const titleColor = themeName === 'gold_bar' ? '#FDE047' : '#FFFFFF';
            const titleShadow = themeName === 'gold_bar' ? new Shadow({ color: 'rgba(0,0,0,0.8)', blur: 10, offsetX: 2, offsetY: 2 }) : new Shadow({ color: '#ec4899', blur: 20, offsetX: 0, offsetY: 0 });
            
            const titleText = new FabricText('상호명/제목을 입력하세요', {
                left: width / 2, top: topH / 2,
                originX: 'center', originY: 'center',
                fontFamily: 'Black Han Sans', fontSize: 52, fill: titleColor,
                shadow: titleShadow,
                editable: true
            } as any);

            const bodyBox = new Rect({
                left: width / 2, top: topH + 50,
                originX: 'center', originY: 'top',
                width: 480, height: 280,
                fill: 'rgba(0,0,0,0.75)', rx: 15, ry: 15,
                stroke: themeName === 'gold_bar' ? '#EAB308' : '#3B82F6', strokeWidth: 2,
                shadow: new Shadow({ color: themeName === 'gold_bar' ? '#CA8A04' : '#3B82F6', blur: 15, offsetX: 0, offsetY: 0 })
            });

            const bodyText = new FabricText('✔ 모집부문: 00명\n✔ 급여조건: 월 000만원\n✔ 근무시간: 19:00 ~ 03:00\n✔ 자격요건: 20세 이상 누구나\n\n[더블클릭하여 필수 내용을 수정하세요]', {
                left: width / 2, top: topH + 80,
                originX: 'center', originY: 'top',
                fontFamily: 'Noto Sans KR', fontSize: 24, fill: '#FFFFFF',
                textAlign: 'center', fontWeight: 'bold',
                editable: true
            } as any);

            const footerText = new FabricText('편하게 연락주세요! ☎ 010-0000-0000', {
                left: width / 2, top: initialHeight - (botH / 2),
                originX: 'center', originY: 'center',
                fontFamily: 'Black Han Sans', fontSize: 32, fill: '#FFFFFF',
                shadow: new Shadow({ color: 'rgba(0,0,0,0.9)', blur: 10, offsetX: 2, offsetY: 2 }),
                editable: true
            } as any);

            canvas.add(titleText, bodyBox, bodyText, footerText);
            canvas.renderAll();
            emitChange(canvas);

        } catch (err) {
            alert('테마 이미지를 불러오는데 실패했습니다.');
        }
    };

    // ── 텍스트 추가 (템플릿 기능) ──
    const addTemplate = (preset: 'title' | 'neonBox' | 'goldTitle' | 'body') => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        let obj: any;

        if (preset === 'goldTitle') {
            obj = new FabricText('골드 타이틀', {
                left: width / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Black Han Sans',
                fontSize: 64,
                fontWeight: 'bold',
                fill: '#FDE047', // 노란색 (그라데이션 효과는 텍스트에 적용하기 까다로워 단순 색상과 그림자로 대체)
                stroke: '#854D0E',
                strokeWidth: 2,
                textAlign: 'center',
                shadow: new Shadow({ color: 'rgba(0,0,0,0.8)', blur: 10, offsetX: 3, offsetY: 3 }),
                editable: true,
            } as any);
        } else if (preset === 'neonBox') {
            const rect = new Rect({
                left: width / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                width: 400,
                height: 150,
                fill: 'rgba(0,0,0,0.7)',
                rx: 15, ry: 15,
                stroke: '#3B82F6',
                strokeWidth: 2,
                shadow: new Shadow({ color: '#3B82F6', blur: 15, offsetX: 0, offsetY: 0 }),
            });
            const text = new FabricText('여기를 클릭하여 내용을 입력하세요\n- 조건 1\n- 조건 2\n- 연락처: 010-0000-0000', {
                left: width / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Noto Sans KR',
                fontSize: 24,
                fontWeight: 'bold',
                fill: '#FFFFFF',
                textAlign: 'center',
                editable: true,
            } as any);
            canvas.add(rect, text);
            canvas.setActiveObject(text);
            canvas.renderAll();
            return;
        } else if (preset === 'title') {
            obj = new FabricText('제목을 입력하세요', {
                left: width / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Noto Sans KR',
                fontSize: 42,
                fontWeight: 'bold',
                fill: '#000000',
                textAlign: 'center',
                editable: true,
            } as any);
        } else {
            obj = new FabricText('본문 내용을 입력하세요', {
                left: width / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Noto Sans KR',
                fontSize: 18,
                fontWeight: 'normal',
                fill: '#000000',
                textAlign: 'center',
                editable: true,
            } as any);
        }

        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
    };

    // ── 도형 추가 ──
    const addShape = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const rect = new Rect({
            left: width / 2 - 75,
            top: canvasHeight / 2 - 25,
            width: 150,
            height: 50,
            fill: 'rgba(0,0,0,0.4)',
            rx: 12,
            ry: 12,
            stroke: 'rgba(255,255,255,0.3)',
            strokeWidth: 1,
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
    };

    // ── 선택 객체 속성 변경 ──
    const updateActiveObject = (key: string, val: any) => {
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!canvas || !obj) return;

        obj.set(key as any, val);
        canvas.renderAll();
        emitChange(canvas);

        // 상태 동기화
        if (key in textProps) {
            setTextProps(prev => ({ ...prev, [key]: val }));
        }
    };

    // ── 삭제 ──
    const deleteActive = () => {
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!canvas || !obj) return;
        canvas.remove(obj);
        canvas.discardActiveObject();
        canvas.renderAll();
        setActiveObj(null);
    };

    // ── 복제 ──
    const duplicateActive = () => {
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!canvas || !obj) return;
        obj.clone().then((cloned: any) => {
            cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
        });
    };

    // ── 레이어 순서 ──
    const bringForward = () => {
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!canvas || !obj) return;
        canvas.bringObjectForward(obj);
        canvas.renderAll();
    };

    const sendBackward = () => {
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!canvas || !obj) return;
        canvas.sendObjectBackwards(obj);
        canvas.renderAll();
    };

    // ── 객체 가운데 정렬 ──
    const centerActiveObject = () => {
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!canvas || !obj) return;
        
        // originX 에 따라 left 값 계산
        const centerX = width / 2;
        if (obj.originX === 'center') {
            obj.set({ left: centerX });
        } else if (obj.originX === 'left') {
            obj.set({ left: centerX - (obj.getScaledWidth() / 2) });
        } else if (obj.originX === 'right') {
            obj.set({ left: centerX + (obj.getScaledWidth() / 2) });
        }
        
        obj.setCoords(); // 바운딩 박스 업데이트
        canvas.renderAll();
        emitChange(canvas);
    };

    // ── 캔버스 → 이미지 다운로드 ──
    const exportAsImage = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.discardActiveObject();
        canvas.renderAll();
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 } as any);
        const link = document.createElement('a');
        link.download = 'foxmon-ad-design.png';
        link.href = dataURL;
        link.click();
    };

    // ── 전체 초기화 ──
    const clearCanvas = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        if (!confirm('캔버스의 모든 요소를 초기화 하시겠습니까?')) return;
        canvas.clear();
        canvas.set('backgroundColor', '#ffffff');
        canvas.renderAll();
        emitChange(canvas);
    };

    const isTextSelected = activeObj && activeObj.type === 'text';

    return (
        <div className="space-y-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Do+Hyeon&family=Gaegu&family=Gothic+A1:wght@400;700&family=Inter:wght@400;700&family=Jua&family=Montserrat:wght@400;700&family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@400;700&family=Poppins:wght@400;700&family=Roboto:wght@400;700&display=swap');
            `}</style>
            
            {/* ─── 상단 툴바 ─── */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 space-y-4">
                
                {/* Row 0: 전체 테마 템플릿 */}
                <div className="flex items-center gap-2 flex-wrap border-b border-gray-100 pb-4">
                    <span className="text-[13px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-pink-500 mr-2">👑 풀세트 테마 템플릿</span>
                    <button onClick={() => applyFullTheme('gold_bar')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-lg border border-yellow-500/50">
                        <Crown className="w-4 h-4" /> 골드 바 테마
                    </button>
                    <button onClick={() => applyFullTheme('neon_nightclub')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-800 hover:from-purple-500 hover:to-blue-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-500/50">
                        <Paintbrush className="w-4 h-4" /> 네온 나이트클럽
                    </button>
                    <div className="flex-1" />
                    <button onClick={clearCanvas} title="전체 초기화"
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg transition-all text-[12px] font-bold">
                        <RotateCcw className="w-4 h-4" /> 리셋
                    </button>
                </div>

                {/* Row 1: 템플릿 및 요소 추가 */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">디자인 블록</span>
                    <button onClick={() => addTemplate('goldTitle')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-[12px] font-bold transition-all border border-yellow-400">
                        <Type className="w-3.5 h-3.5" /> 골드 타이틀
                    </button>
                    <button onClick={() => addTemplate('neonBox')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-blue-100 rounded-lg text-[12px] font-bold transition-all border border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                        <Layers className="w-3.5 h-3.5" /> 네온 정보 박스
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button onClick={() => addTemplate('title')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[12px] font-bold transition-all border border-gray-200">
                        <Type className="w-3 h-3" /> 일반 제목
                    </button>
                    <button onClick={() => addTemplate('body')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[12px] font-bold transition-all border border-gray-200">
                        <Type className="w-2.5 h-2.5" /> 일반 본문
                    </button>
                    <button onClick={addShape}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-lg text-[12px] font-bold transition-all">
                        <Square className="w-3.5 h-3.5" /> 빈 박스
                    </button>

                    <div className="flex-1" />

                    {/* 유틸리티 버튼 */}
                    <button onClick={exportAsImage} title="이미지로 다운로드"
                        className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                </div>

                {/* Row 2: 배경 이미지 URL 및 설정 */}
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={bgUrl}
                        onChange={(e) => {
                            setBgUrl(e.target.value);
                            onBgImageChange?.(e.target.value);
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-900 outline-none focus:border-blue-500 placeholder-gray-400"
                        placeholder="배경 이미지 URL (예: 무한 반복용 심리스 패턴 이미지)"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-gray-600 font-medium">
                        <input type="checkbox" checked={isPattern} onChange={e => setIsPattern(e.target.checked)} className="rounded border-gray-300 text-blue-500" />
                        패턴(반복) 모드
                    </label>
                </div>

                {/* 배경 프리셋 */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 mr-1">배경</span>
                    {BG_PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                if (!preset.value) {
                                    setBgUrl('');
                                    onBgImageChange?.('');
                                    const canvas = fabricRef.current;
                                    if (canvas) {
                                        canvas.set('backgroundImage', undefined);
                                        canvas.set('backgroundColor', '#ffffff');
                                        canvas.renderAll();
                                    }
                                } else if (preset.value.startsWith('#')) {
                                    setBgUrl('');
                                    onBgImageChange?.('');
                                    const canvas = fabricRef.current;
                                    if (canvas) {
                                        canvas.set('backgroundImage', undefined);
                                        canvas.set('backgroundColor', preset.value);
                                        canvas.renderAll();
                                    }
                                }
                            }}
                            className="px-2 py-1 rounded-md text-[10px] font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all border border-gray-200 shadow-sm"
                            style={preset.value.startsWith('linear') ? { background: preset.value } : preset.value.startsWith('#') ? { backgroundColor: preset.value, color: preset.label === '다크' ? '#fff' : '#000' } : {}}
                        >
                            {!preset.value.startsWith('linear') && !preset.value.startsWith('#') ? preset.label : ''}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── 선택 오브젝트 속성 패널 (캔버스 위로 이동) ─── */}
            {isTextSelected && (
                <div className="bg-gray-900 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-black text-white flex items-center gap-2">
                            <Palette className="w-4 h-4 text-blue-400" /> 텍스트 속성
                        </h4>
                        <div className="flex items-center gap-1">
                            <button onClick={centerActiveObject} title="가운데 정렬" className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-all border border-gray-700 mr-2"><AlignHorizontalSpaceAround className="w-3.5 h-3.5" /> 중앙 배치</button>
                            <button onClick={duplicateActive} title="복제" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-all"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={bringForward} title="앞으로" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-all"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={sendBackward} title="뒤로" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-all"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={deleteActive} title="삭제" className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-md transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>

                    {/* 폰트 & 크기 */}
                    <div className="flex gap-2">
                        <select
                            value={textProps.fontFamily}
                            onChange={(e) => updateActiveObject('fontFamily', e.target.value)}
                            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[12px] text-white outline-none"
                        >
                            {FONT_LIST.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                        </select>
                        <input
                            type="number"
                            value={textProps.fontSize}
                            onChange={(e) => updateActiveObject('fontSize', parseInt(e.target.value) || 16)}
                            className="w-16 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[12px] text-white text-center outline-none"
                            min={8} max={120}
                        />
                    </div>

                    {/* 스타일 토글 */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => updateActiveObject('fontWeight', textProps.fontWeight === 'bold' ? 'normal' : 'bold')}
                            className={`p-2 rounded-lg transition-all ${textProps.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        ><Bold className="w-3.5 h-3.5" /></button>
                        <button
                            onClick={() => updateActiveObject('fontStyle', textProps.fontStyle === 'italic' ? 'normal' : 'italic')}
                            className={`p-2 rounded-lg transition-all ${textProps.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        ><Italic className="w-3.5 h-3.5" /></button>
                        <button
                            onClick={() => updateActiveObject('underline', !textProps.underline)}
                            className={`p-2 rounded-lg transition-all ${textProps.underline ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        ><Underline className="w-3.5 h-3.5" /></button>

                        <div className="w-px h-6 bg-gray-700 mx-1" />

                        <button onClick={() => updateActiveObject('textAlign', 'left')}
                            className={`p-2 rounded-lg transition-all ${textProps.textAlign === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        ><AlignLeft className="w-3.5 h-3.5" /></button>
                        <button onClick={() => updateActiveObject('textAlign', 'center')}
                            className={`p-2 rounded-lg transition-all ${textProps.textAlign === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        ><AlignCenter className="w-3.5 h-3.5" /></button>
                        <button onClick={() => updateActiveObject('textAlign', 'right')}
                            className={`p-2 rounded-lg transition-all ${textProps.textAlign === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        ><AlignRight className="w-3.5 h-3.5" /></button>

                        <div className="w-px h-6 bg-gray-700 mx-1" />

                        {/* 그림자 토글 */}
                        <button
                            onClick={() => updateActiveObject('shadow', textProps.shadow ? '' : '2px 2px 6px rgba(0,0,0,0.7)')}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${textProps.shadow ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >그림자</button>
                    </div>

                    {/* 색상 선택 */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-500 mr-1">색상</span>
                        {TEXT_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => updateActiveObject('fill', color)}
                                className={`w-6 h-6 rounded-full transition-all border-2 ${textProps.fill === color ? 'border-blue-400 scale-125' : 'border-gray-600 hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 선택된 도형일 때 */}
            {activeObj && activeObj.type !== 'text' && (
                <div className="bg-gray-900 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-black text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-400" /> 도형 속성
                        </h4>
                        <div className="flex items-center gap-1">
                            <button onClick={centerActiveObject} title="가운데 정렬" className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-all border border-gray-700 mr-2"><AlignHorizontalSpaceAround className="w-3.5 h-3.5" /> 중앙 배치</button>
                            <button onClick={duplicateActive} title="복제" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-all"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={bringForward} title="앞으로" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-all"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={sendBackward} title="뒤로" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-all"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={deleteActive} title="삭제" className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/40 rounded-md transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500">배경색</span>
                        {['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)', '#FF6B35', '#3B82F6', '#8B5CF6', '#EF4444'].map(c => (
                            <button key={c} onClick={() => updateActiveObject('fill', c)}
                                className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-all"
                                style={{ backgroundColor: c }} />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500">투명도</span>
                        <input type="range" min={0} max={100} value={(activeObj?.opacity || 1) * 100}
                            onChange={(e) => updateActiveObject('opacity', parseInt(e.target.value) / 100)}
                            className="flex-1 h-1.5 accent-blue-500" />
                        <span className="text-[11px] text-gray-400 w-8 text-right">{Math.round((activeObj?.opacity || 1) * 100)}%</span>
                    </div>
                </div>
            )}

            {/* 안내 */}
            {!activeObj && (
                <p className="text-[11px] text-gray-400 text-center py-2">
                    📌 캔버스 위의 요소를 <strong className="text-gray-300">클릭</strong>하여 선택하고, <strong className="text-gray-300">드래그</strong>하여 이동시키세요. 텍스트를 <strong className="text-gray-300">더블클릭</strong>하면 내용을 편집할 수 있습니다.
                </p>
            )}

            {/* ─── 캔버스 높이 조절 ─── */}
            <div className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-t-xl border border-gray-200 mt-2">
                <span className="text-[12px] font-bold text-gray-600">광고 세로 길이 조절 (현재: {canvasHeight}px)</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCanvasHeight(h => Math.max(200, h - 200))} className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-[11px]">-200px</button>
                    <button onClick={() => setCanvasHeight(h => h + 200)} className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-[11px]">+200px</button>
                    <button onClick={() => setCanvasHeight(h => h + 500)} className="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded text-[11px]">+500px</button>
                </div>
            </div>

            {/* ─── 캔버스 영역 ─── */}
            <div className="relative bg-white rounded-b-2xl overflow-hidden flex flex-col items-center p-4 border-b border-l border-r border-gray-200 shadow-sm">
                <div className="rounded-lg overflow-hidden ring-1 ring-black/5 shadow-md" style={{ height: canvasHeight, width }}>
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}
