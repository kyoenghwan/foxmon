'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Image as ImageIcon, Type, Trash2, Download, Plus, Move, RotateCcw,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    Palette, Layers, Copy, ChevronUp, ChevronDown, Square
} from 'lucide-react';

// Fabric.js v6: named imports
import { Canvas, FabricText, FabricImage, Rect } from 'fabric';

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
    const [canvasReady, setCanvasReady] = useState(false);

    // ── 텍스트 속성 상태 (선택된 텍스트 오브젝트의 현재 값) ──
    const [textProps, setTextProps] = useState({
        fontFamily: 'Noto Sans KR',
        fontSize: 32,
        fill: '#FFFFFF',
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
            height,
            backgroundColor: '#1a1a2e',
            selection: true,
            preserveObjectStacking: true,
        });

        fabricRef.current = canvas;
        setCanvasReady(true);

        // 선택 이벤트
        canvas.on('selection:created', (e) => handleSelection(e.selected?.[0]));
        canvas.on('selection:updated', (e) => handleSelection(e.selected?.[0]));
        canvas.on('selection:cleared', () => { setActiveObj(null); });

        // 변경 이벤트 → 부모에 JSON 전달
        canvas.on('object:modified', () => emitChange(canvas));
        canvas.on('object:added', () => emitChange(canvas));
        canvas.on('object:removed', () => emitChange(canvas));

        // 기존 데이터 로드
        if (value) {
            try {
                canvas.loadFromJSON(JSON.parse(value)).then(() => {
                    canvas.renderAll();
                });
            } catch { /* 초기 빈 값 */ }
        }

        return () => {
            canvas.dispose();
            fabricRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── 배경 이미지 변경 시 적용 ──
    useEffect(() => {
        if (!fabricRef.current || !canvasReady) return;
        const canvas = fabricRef.current;

        if (bgUrl) {
            FabricImage.fromURL(bgUrl, { crossOrigin: 'anonymous' }).then((img) => {
                if (!img) return;
                // 캔버스에 맞게 스케일
                const scaleX = width / (img.width || 1);
                const scaleY = height / (img.height || 1);
                const scale = Math.max(scaleX, scaleY);
                img.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center' });
                canvas.set('backgroundImage', img);
                canvas.renderAll();
                emitChange(canvas);
            }).catch(() => { /* 이미지 로드 실패 무시 */ });
        } else {
            canvas.set('backgroundImage', undefined);
            canvas.set('backgroundColor', '#1a1a2e');
            canvas.renderAll();
            emitChange(canvas);
        }
    }, [bgUrl, canvasReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── 선택 핸들러 ──
    const handleSelection = (obj: any) => {
        setActiveObj(obj);
        if (obj && obj.type === 'text') {
            setTextProps({
                fontFamily: obj.fontFamily || 'Noto Sans KR',
                fontSize: obj.fontSize || 32,
                fill: (obj.fill as string) || '#FFFFFF',
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
            const json = canvas.toJSON();
            onChange(JSON.stringify(json));
        }
    }, [onChange]);

    // ── 텍스트 추가 ──
    const addText = (preset: 'title' | 'subtitle' | 'body') => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const configs = {
            title: { text: '제목을 입력하세요', fontSize: 42, fontWeight: 'bold' },
            subtitle: { text: '부제목을 입력하세요', fontSize: 28, fontWeight: 'bold' },
            body: { text: '본문 내용을 입력하세요', fontSize: 18, fontWeight: 'normal' },
        };
        const cfg = configs[preset];

        const t = new FabricText(cfg.text, {
            left: width / 2,
            top: height / 2,
            originX: 'center',
            originY: 'center',
            fontFamily: 'Noto Sans KR',
            fontSize: cfg.fontSize,
            fontWeight: cfg.fontWeight,
            fill: '#FFFFFF',
            textAlign: 'center',
            shadow: '2px 2px 4px rgba(0,0,0,0.5)',
            editable: true,
        } as any);

        canvas.add(t);
        canvas.setActiveObject(t);
        canvas.renderAll();
    };

    // ── 도형 추가 ──
    const addShape = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const rect = new Rect({
            left: width / 2 - 75,
            top: height / 2 - 25,
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
        canvas.set('backgroundColor', '#1a1a2e');
        canvas.renderAll();
        emitChange(canvas);
    };

    const isTextSelected = activeObj && activeObj.type === 'text';

    return (
        <div className="space-y-4">
            {/* ─── 상단 툴바 ─── */}
            <div className="bg-gray-900 rounded-2xl p-3 space-y-3">
                {/* Row 1: 요소 추가 */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">요소 추가</span>
                    <button onClick={() => addText('title')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[12px] font-bold transition-all">
                        <Type className="w-3.5 h-3.5" /> 제목
                    </button>
                    <button onClick={() => addText('subtitle')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[12px] font-bold transition-all">
                        <Type className="w-3 h-3" /> 부제목
                    </button>
                    <button onClick={() => addText('body')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-[12px] font-bold transition-all">
                        <Type className="w-2.5 h-2.5" /> 본문
                    </button>
                    <button onClick={addShape}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-[12px] font-bold transition-all">
                        <Square className="w-3.5 h-3.5" /> 박스
                    </button>

                    <div className="flex-1" />

                    {/* 유틸리티 버튼 */}
                    <button onClick={exportAsImage} title="이미지로 다운로드"
                        className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={clearCanvas} title="전체 초기화"
                        className="p-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg transition-all">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* Row 2: 배경 이미지 URL */}
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={bgUrl}
                        onChange={(e) => {
                            setBgUrl(e.target.value);
                            onBgImageChange?.(e.target.value);
                        }}
                        className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[13px] text-white outline-none focus:border-blue-500 placeholder-gray-500"
                        placeholder="배경 이미지 URL을 입력하세요 (예: https://example.com/bg.jpg)"
                    />
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
                                        canvas.set('backgroundColor', '#1a1a2e');
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
                            className="px-2 py-1 rounded-md text-[10px] font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all border border-gray-700"
                            style={preset.value.startsWith('linear') ? { background: preset.value } : preset.value.startsWith('#') ? { backgroundColor: preset.value } : {}}
                        >
                            {!preset.value.startsWith('linear') && !preset.value.startsWith('#') ? preset.label : ''}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── 캔버스 영역 ─── */}
            <div className="relative bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center p-4"
                style={{ minHeight: height + 40 }}>
                <div className="rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                    <canvas ref={canvasRef} />
                </div>
            </div>

            {/* ─── 하단: 선택 오브젝트 속성 패널 ─── */}
            {isTextSelected && (
                <div className="bg-gray-900 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-black text-white flex items-center gap-2">
                            <Palette className="w-4 h-4 text-blue-400" /> 텍스트 속성
                        </h4>
                        <div className="flex items-center gap-1">
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
        </div>
    );
}
