'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, Plus, Users, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OA_INSERT_CHAT_ROOM } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_ROOM';
import { OA_INSERT_CHAT_PARTICIPANT } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_PARTICIPANT';
import { OA_INSERT_CHAT_MESSAGE } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_MESSAGE';
import { QA_GET_CHAT_ROOMS } from '@/src/atoms/qa/foxtalk/QA_GET_CHAT_ROOMS';
import { QA_GET_CHAT_MESSAGES } from '@/src/atoms/qa/foxtalk/QA_GET_CHAT_MESSAGES';

type AppState = 'CLOSED' | 'SETUP' | 'LOBBY' | 'CREATE_ROOM' | 'ROOM';

interface Profile {
    sessionId: string;
    nickname: string;
    avatarType: string;
}

export function FoxTalkWidget() {
    const [appState, setAppState] = useState<AppState>('CLOSED');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [currentRoom, setCurrentRoom] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Setup Form State
    const [setupNick, setSetupNick] = useState('');
    const [setupAv, setSetupAv] = useState('fox1');

    // Create Room State
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState<'OPEN' | 'SECRET'>('OPEN');
    const [newPass, setNewPass] = useState('');

    useEffect(() => {
        // Init profile from localStorage
        const saved = localStorage.getItem('foxtalk_profile');
        if (saved) {
            setProfile(JSON.parse(saved));
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (appState === 'ROOM') {
            scrollToBottom();
        }
    }, [messages, appState]);

    // Handle Open Widget
    const handleOpen = () => {
        if (!profile) setAppState('SETUP');
        else {
            setAppState('LOBBY');
            loadRooms();
        }
    };

    const loadRooms = async () => {
        const res = await QA_GET_CHAT_ROOMS();
        if (res.success) setRooms(res.data || []);
    };

    // Save Profile
    const saveProfile = () => {
        if (!setupNick) return;
        const newProfile = {
            sessionId: crypto.randomUUID(),
            nickname: setupNick,
            avatarType: setupAv
        };
        localStorage.setItem('foxtalk_profile', JSON.stringify(newProfile));
        setProfile(newProfile);
        setAppState('LOBBY');
        loadRooms();
    };

    // Create Room
    const handleCreateRoom = async () => {
        if (!newTitle || !profile) return;
        const res = await OA_INSERT_CHAT_ROOM({
            title: newTitle,
            type: newType,
            password_hash: newPass || undefined,
            room_code: newType === 'SECRET' ? crypto.randomUUID().split('-')[0] : undefined,
            max_participants: 100,
            created_by: profile.sessionId
        });
        if (res.success) {
            setNewTitle('');
            joinRoom(res.data);
        } else {
            alert('방 생성 실패!');
        }
    };

    // Join Room
    const joinRoom = async (room: any) => {
        if (!profile) return;
        if (room.type === 'SECRET' && room.created_by !== profile.sessionId) {
            const pass = prompt('비밀방입니다. 비밀번호를 입력해주세요.');
            // (간단 데모용 평문 비교. 실제론 해시 비교 필요)
            if (pass !== room.password_hash) {
                alert('비밀번호가 틀렸습니다.');
                return;
            }
        }
        
        // 참여자 등록
        await OA_INSERT_CHAT_PARTICIPANT({
            room_id: room.id,
            session_id: profile.sessionId,
            nickname: profile.nickname,
            avatar_type: profile.avatarType
        });

        setCurrentRoom(room);
        setAppState('ROOM');
        loadMessages(room.id);

        // 시스템 메시지 발송 (입장)
        await OA_INSERT_CHAT_MESSAGE({
            room_id: room.id,
            content: `${profile.nickname}님이 입장하셨습니다.`,
            message_type: 'SYSTEM_JOIN'
        });
    };

    const loadMessages = async (roomId: string) => {
        const res = await QA_GET_CHAT_MESSAGES(roomId);
        if (res.success) {
            setMessages(res.data || []);
        }
    };

    // Supabase Realtime Subscription
    useEffect(() => {
        if (appState !== 'ROOM' || !currentRoom) return;
        
        const channel = supabase.channel(`room:${currentRoom.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'foxtalk_messages', filter: `room_id=eq.${currentRoom.id}` }, async (payload) => {
                const newMessage = payload.new;
                // 작성자 정보 가져오기 (단순 처리를 위해 여기선 간단히 덧붙임, 완벽히 하려면 QA_ATOM 활용)
                if (newMessage.participant_id && profile && newMessage.participant_id !== profile.sessionId) {
                     const {data: p} = await supabase.from('foxtalk_participants').select('*').eq('id', newMessage.participant_id).single();
                     setMessages(prev => [...prev, {...newMessage, participant: p}]);
                } else {
                    setMessages(prev => [...prev, newMessage]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [appState, currentRoom, profile]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgInput.trim() || !currentRoom || !profile) return;

        // 먼저 내 세션에 연결된 참여자 ID 가져오기 (원래는 전역 관리 필요)
        const { data: p } = await supabase.from('foxtalk_participants').select('id').eq('room_id', currentRoom.id).eq('session_id', profile.sessionId).single();
        if (!p) return;

        await OA_INSERT_CHAT_MESSAGE({
            room_id: currentRoom.id,
            participant_id: p.id,
            content: msgInput
        });
        setMsgInput('');
    };

    // Drag Handlers
    const [pos, setPos] = useState({ right: 24, bottom: 24 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, right: 0, bottom: 0 });
    const isDragMoved = useRef(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        isDragMoved.current = false;
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            right: pos.right,
            bottom: pos.bottom
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            isDragMoved.current = true;
        }

        let newRight = dragStart.current.right - deltaX;
        let newBottom = dragStart.current.bottom - deltaY;

        // 화면 밖으로 이탈 방지 보정
        if (typeof window !== 'undefined') {
            const boxW = appState === 'CLOSED' ? 64 : Math.min(360, window.innerWidth);
            const boxH = appState === 'CLOSED' ? 64 : Math.min(600, window.innerHeight * 0.8);
            newRight = Math.max(10, Math.min(newRight, window.innerWidth - boxW - 10));
            newBottom = Math.max(10, Math.min(newBottom, window.innerHeight - boxH - 10));
        }

        setPos({ right: newRight, bottom: newBottom });
    };

    // 열릴 때 창 크기가 커지면서 위로 튀어나가는 현상 방지
    useEffect(() => {
        if (appState !== 'CLOSED' && typeof window !== 'undefined') {
            setPos(p => ({
                right: Math.max(10, Math.min(p.right, window.innerWidth - 360 - 10)),
                bottom: Math.max(10, Math.min(p.bottom, window.innerHeight - Math.min(600, window.innerHeight * 0.8) - 10))
            }));
        }
    }, [appState]);

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const onWidgetClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isDragMoved.current) {
            isDragMoved.current = false;
            return;
        }
        handleOpen();
    };

    if (appState === 'CLOSED') {
        return (
            <button 
                onClick={onWidgetClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="fixed w-16 h-16 bg-gradient-to-tr from-primary to-orange-400 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-[9999] group border-2 border-white touch-none"
                style={{ right: `${pos.right}px`, bottom: `${pos.bottom}px` }}
            >
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border border-white"></div>
                <MessageCircle className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
            </button>
        );
    }

    return (
        <div 
            className="fixed w-full max-w-[360px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[9999] border border-gray-100 flex-col animate-in slide-in-from-bottom-10 fade-in duration-300"
            style={{ right: `${pos.right}px`, bottom: `${pos.bottom}px` }}
        >
            {/* Header (Drag Handle) */}
            <div 
                className="bg-gradient-to-r from-primary to-orange-400 p-4 text-white flex items-center justify-between shrink-0 shadow-sm relative z-10 cursor-move touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="flex items-center gap-2">
                    {appState === 'CREATE_ROOM' || appState === 'ROOM' ? (
                        <button onClick={(e) => {
                            e.stopPropagation();
                            if (appState === 'ROOM') {
                                // 향후 나가기 시스템 메시지 추가 가능
                            }
                            setAppState('LOBBY'); 
                            loadRooms();
                            setCurrentRoom(null);
                        }} 
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors mr-1">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                    ) : (
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div>
                        <h2 className="font-black text-[16px] leading-tight">여우토크</h2>
                        <p className="text-[10px] text-white/80 font-medium">실시간 익명 오픈채팅</p>
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setAppState('CLOSED'); }} onPointerDown={(e) => e.stopPropagation()} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
                
                {appState === 'SETUP' && (
                    <div className="p-6 flex flex-col h-full justify-center">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                <span className="text-4xl text-orange-500">🦊</span>
                            </div>
                            <h3 className="font-black text-xl text-gray-900 mb-2">프로필 설정</h3>
                            <p className="text-sm text-gray-500 font-medium">채팅방에서 사용할 나만의 닉네임을 설정해주세요. (완전 익명)</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block">닉네임</label>
                                <input 
                                    type="text" 
                                    value={setupNick}
                                    onChange={(e) => setSetupNick(e.target.value)}
                                    placeholder="멋진 닉네임 입력 (예: 강남여우왕)"
                                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-primary focus:ring-0 outline-none text-sm font-bold"
                                />
                            </div>
                            <button 
                                onClick={saveProfile}
                                disabled={!setupNick}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-black py-3.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                            >
                                여우토크 입장하기
                            </button>
                        </div>
                    </div>
                )}

                {appState === 'LOBBY' && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 bg-white border-b sticky top-0 z-10 flex justify-between items-center shadow-sm">
                            <h3 className="font-black text-gray-800 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-primary" /> 대화방 목록
                            </h3>
                            <button 
                                onClick={() => setAppState('CREATE_ROOM')}
                                className="bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> 방 만들기
                            </button>
                        </div>
                        <ul className="divide-y divide-gray-100 flex-1 p-2">
                            {rooms.length === 0 ? (
                                <li className="text-center text-sm font-bold text-gray-400 py-12 flex flex-col items-center gap-3">
                                    <MessageCircle className="w-8 h-8 opacity-20" />
                                    개설된 방이 없습니다.<br/>첫 대화방을 만들어 보세요!
                                </li>
                            ) : rooms.map(room => (
                                <li key={room.id}>
                                    <button 
                                        onClick={() => joinRoom(room)}
                                        className="w-full text-left p-4 hover:bg-orange-50/50 transition-colors group rounded-xl"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-black text-[14px] text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                {room.type === 'SECRET' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                                                {room.title}
                                            </h4>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                N명 참여
                                            </span>
                                        </div>
                                        {room.type === 'SECRET' && <span className="text-[11px] text-red-500 font-bold block mt-1">비밀방</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {appState === 'CREATE_ROOM' && (
                    <div className="p-5 flex flex-col h-full">
                        <h3 className="font-black text-lg text-gray-900 mb-6 border-b pb-4">새로운 방 만들기</h3>
                        <div className="space-y-5 flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">방 제목</label>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="어떤 주제로 대화할까요?"
                                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-primary focus:ring-0 outline-none text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1.5 block">성격</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button onClick={() => setNewType('OPEN')} className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${newType === 'OPEN' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>오픈방</button>
                                    <button onClick={() => setNewType('SECRET')} className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${newType === 'SECRET' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>비밀방</button>
                                </div>
                            </div>
                            {newType === 'SECRET' && (
                                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                    <label className="text-xs font-bold text-red-500 mb-1.5 block flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> 비밀번호
                                    </label>
                                    <input 
                                        type="password" 
                                        value={newPass}
                                        onChange={(e) => setNewPass(e.target.value)}
                                        placeholder="초대할 사람에게만 알려주세요"
                                        className="w-full border-2 border-red-200 bg-red-50/30 p-3 rounded-xl focus:border-red-400 focus:ring-0 outline-none text-sm font-bold"
                                    />
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleCreateRoom}
                            disabled={!newTitle || (newType === 'SECRET' && !newPass)}
                            className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-xl disabled:opacity-50 transition-colors shadow-sm mt-4"
                        >
                            만들고 입장하기
                        </button>
                    </div>
                )}

                {appState === 'ROOM' && currentRoom && (
                    <div className="flex flex-col h-full bg-[#f8f9fa]">
                        <div className="bg-white px-4 py-2 border-b shadow-sm shrink-0 flex items-center justify-between">
                            <div className="font-black text-[13px] text-gray-800 flex items-center gap-1">
                                {currentRoom.type === 'SECRET' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                                {currentRoom.title}
                            </div>
                            {currentRoom.type === 'SECRET' && (
                                <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">
                                    참여코드: {currentRoom.room_code}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((m, i) => {
                                if (m.message_type?.startsWith('SYSTEM')) {
                                    return (
                                        <div key={m.id || i} className="flex justify-center my-2">
                                            <span className="bg-black/20 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                                {m.content}
                                            </span>
                                        </div>
                                    );
                                }
                                
                                const isMe = m.participant?.nickname === profile?.nickname; // 간단 판별

                                return (
                                    <div key={m.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                        {!isMe && <span className="text-[11px] font-bold text-gray-500 mb-1 ml-1">{m.participant?.nickname || '익명'}</span>}
                                        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-[13px] shadow-sm leading-relaxed ${isMe ? 'bg-primary text-black rounded-tr-sm font-medium' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm font-medium'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-3 bg-white border-t shrink-0">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={msgInput}
                                    onChange={(e) => setMsgInput(e.target.value)}
                                    placeholder="메시지를 입력하세요..."
                                    className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-primary focus:ring-0 rounded-full pl-4 pr-12 py-2.5 text-[13px] font-medium transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!msgInput.trim()}
                                    className="absolute right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-sm"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
