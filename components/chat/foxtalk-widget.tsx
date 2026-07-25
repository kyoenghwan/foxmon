'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { X, MessageCircle, Send, Plus, Users, Shield, ArrowLeft, Headset, LogOut, MoreVertical, Radio, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OA_INSERT_CHAT_ROOM } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_ROOM';
import { OA_INSERT_CHAT_PARTICIPANT } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_PARTICIPANT';
import { OA_UPDATE_PARTICIPANT_READ } from '@/src/atoms/oa/foxtalk/OA_UPDATE_PARTICIPANT_READ';
import { OA_INSERT_CHAT_MESSAGE } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_MESSAGE';
import { OA_LEAVE_CHAT_ROOM } from '@/src/atoms/oa/foxtalk/OA_LEAVE_CHAT_ROOM';
import { QA_GET_CHAT_ROOMS } from '@/src/atoms/qa/foxtalk/QA_GET_CHAT_ROOMS';
import { QA_GET_CHAT_MESSAGES } from '@/src/atoms/qa/foxtalk/QA_GET_CHAT_MESSAGES';
import { QA_GET_LIVE_CHAT_ROOM } from '@/src/atoms/qa/foxtalk/QA_GET_LIVE_CHAT_ROOM';
import { QA_GET_CHAT_PROFILE } from '@/src/atoms/qa/foxtalk/QA_GET_CHAT_PROFILE';
import { OA_UPSERT_CHAT_PROFILE } from '@/src/atoms/oa/foxtalk/OA_UPSERT_CHAT_PROFILE';
import { FA_CS_CHAT_FLOW } from '@/src/atoms/fa/support/FA_CS_CHAT_FLOW';
import { QA_GET_CS_MESSAGES } from '@/src/atoms/qa/support/QA_GET_CS_MESSAGES';
import { OA_INSERT_CS_MESSAGE } from '@/src/atoms/oa/support/OA_INSERT_CS_MESSAGE';
import { QA_GET_USER_GENDER } from '@/src/atoms/qa/auth/QA_GET_USER_GENDER';
import { playNotificationSound, showBrowserNotification } from '@/lib/notification-sound';
import { QA_SEARCH_USERS_FOR_DM } from '@/src/atoms/qa/foxtalk/QA_SEARCH_USERS_FOR_DM';
import { OA_CREATE_DM_ROOM } from '@/src/atoms/oa/foxtalk/OA_CREATE_DM_ROOM';
import { QA_GET_WIDGET_UNREAD_COUNTS } from '@/src/atoms/qa/foxtalk/QA_GET_WIDGET_UNREAD_COUNTS';

type AppState = 'CLOSED' | 'MENU' | 'SETUP' | 'LOBBY' | 'CREATE_ROOM' | 'ROOM' | 'CS_SETUP' | 'CS_CHAT' | 'LIVE_CHAT';

interface Profile {
    sessionId: string;
    nickname: string;
    avatarType: string;
}

export function FoxTalkWidget() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (usePathname().startsWith('/cs') || usePathname().startsWith('/fox-office')) {
        return null;
    }

    const [appState, setAppState] = useState<AppState>('CLOSED');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [currentRoom, setCurrentRoom] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const [lobbyTab, setLobbyTab] = useState<'1ON1' | 'OPEN'>('1ON1');
    const [showRoomMenu, setShowRoomMenu] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [participantsMap, setParticipantsMap] = useState<Record<string, any>>({});
    const participantsMapRef = useRef<Record<string, any>>({});
    const [myParticipant, setMyParticipant] = useState<any | null>(null);
    const [isSending, setIsSending] = useState(false);

    // DM 검색 관련 상태
    const [dmSearchKeyword, setDmSearchKeyword] = useState('');
    const [dmSearchResults, setDmSearchResults] = useState<any[]>([]);
    const [dmSearching, setDmSearching] = useState(false);
    const [showDmSearch, setShowDmSearch] = useState(false);
    const [dmCreating, setDmCreating] = useState<string | null>(null);
    const dmSearchTimer = useRef<NodeJS.Timeout | null>(null);

    // 실시간채팅 관련 상태
    const [liveChatNick, setLiveChatNick] = useState('');
    const [liveChatAvatar, setLiveChatAvatar] = useState('fox1');
    const [liveOnlineCount, setLiveOnlineCount] = useState(0);
    const [isJoiningLive, setIsJoiningLive] = useState(false);
    const [liveChatProfileLoaded, setLiveChatProfileLoaded] = useState(false);
    
    useEffect(() => {
        participantsMapRef.current = participantsMap;
    }, [participantsMap]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { data: session } = useSession();

    const getRoomDisplayTitle = (room: any) => {
        const currentUserId = (userId || profile?.sessionId)?.toLowerCase().trim();
        const employerId = room.employer_id?.toLowerCase().trim();
        const seekerId = room.seeker_id?.toLowerCase().trim();

        if (room.type === '1ON1' && currentUserId) {
            if (employerId === currentUserId) {
                return `${room.seeker?.nickname || room.seeker?.name || '구직자'} 님과의 대화방`;
            } else if (seekerId === currentUserId) {
                return `${room.employer?.business_name || room.employer?.nickname || room.employer?.name || '업체'} 님과의 대화방`;
            }
        }
        return room.title;
    };

    // Auth Role State
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    /** 로그인 시 고객센터/폭스톡에 쓸 안정적인 식별자·표시명 (DB session_id = user.id) */
    const [sessionChatUser, setSessionChatUser] = useState<{ id: string; nickname: string } | null>(null);
    /** stale closure 방지: fetchUnreadCounts 등에서 항상 최신 userId를 참조 */
    const resolvedUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        console.log('[BADGE-1] session useEffect 실행:', { hasUser: !!session?.user, userId: session?.user?.id });
        if (session?.user) {
            if ((session.user as any).role) {
                setUserRole((session.user as any).role);
            }
            if (session.user.id) {
                setUserId(session.user.id);
                resolvedUserIdRef.current = session.user.id;
                console.log('[BADGE-2] resolvedUserIdRef 설정:', session.user.id);
                const nick =
                    String((session.user as { nickname?: string }).nickname || '').trim() ||
                    String(session.user.name || '').trim() ||
                    '고객';
                setSessionChatUser({ id: session.user.id, nickname: nick });
                console.log('[BADGE-3] fetchUnreadCounts 호출 시작 (userId:', session.user.id, ')');
                void fetchUnreadCounts(session.user.id);
            } else {
                console.log('[BADGE-ERR] session.user 존재하나 id 없음:', session.user);
            }
        } else {
            console.log('[BADGE-1B] session.user 없음 - 로그아웃 상태');
            setUserRole(null);
            setUserId(null);
            setSessionChatUser(null);
            resolvedUserIdRef.current = null;
        }
    }, [session]);

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

    useEffect(() => {
        if (sessionChatUser) {
            const sid = sessionChatUser.id;
            const nick = sessionChatUser.nickname;
            
            const saved = localStorage.getItem('foxtalk_profile');
            const currentProfile = saved ? JSON.parse(saved) : null;
            
            if (!currentProfile || currentProfile.sessionId !== sid || currentProfile.nickname !== nick) {
                const newProfile = {
                    sessionId: sid,
                    nickname: nick,
                    avatarType: currentProfile?.avatarType || 'fox1'
                };
                localStorage.setItem('foxtalk_profile', JSON.stringify(newProfile));
                setProfile(newProfile);
            }
        }
    }, [sessionChatUser]);

    const [unreadCounts, setUnreadCounts] = useState({ foxTalkUnread: 0, csUnread: 0, totalUnread: 0 });

    const fetchUnreadCounts = async (overrideUserId?: string) => {
        const effectiveUserId = overrideUserId || resolvedUserIdRef.current || sessionChatUser?.id || userId || (session?.user as any)?.id || profile?.sessionId;
        console.log('[BADGE-4] fetchUnreadCounts 진입:', {
            overrideUserId,
            refValue: resolvedUserIdRef.current,
            sessionChatUserId: sessionChatUser?.id,
            userId,
            sessionId: (session?.user as any)?.id,
            profileSessionId: profile?.sessionId,
            '→ effectiveUserId': effectiveUserId
        });
        if (!effectiveUserId) {
            console.log('[BADGE-5-SKIP] effectiveUserId 없음 → 0으로 설정');
            setUnreadCounts({ foxTalkUnread: 0, csUnread: 0, totalUnread: 0 });
            return;
        }
        try {
            console.log('[BADGE-5] 서버 호출 시작: QA_GET_WIDGET_UNREAD_COUNTS(', effectiveUserId, ')');
            const res = await QA_GET_WIDGET_UNREAD_COUNTS(effectiveUserId);
            console.log('[BADGE-6] 서버 응답:', JSON.stringify(res));
            if (res.success && res.data) {
                console.log('[BADGE-7] ✅ setUnreadCounts 호출:', res.data);
                setUnreadCounts(res.data);
            } else {
                console.log('[BADGE-7-FAIL] 서버 응답 실패 또는 data 없음:', res);
            }
        } catch (err) {
            console.error('[BADGE-ERR] fetchUnreadCounts 예외:', err);
        }
    };

    useEffect(() => {
        console.log('[BADGE-8] unread useEffect 실행 (초기 fetch + Realtime 구독)');
        fetchUnreadCounts();
        const handleUnreadChanged = () => {
            console.log('[BADGE-9] foxtalk_unread_changed 이벤트 수신 → fetchUnreadCounts 호출');
            fetchUnreadCounts();
        };
        window.addEventListener('foxtalk_unread_changed', handleUnreadChanged);

        const effectiveUserId = sessionChatUser?.id || userId || (session?.user as any)?.id || profile?.sessionId;
        console.log('[BADGE-10] Realtime 구독용 effectiveUserId:', effectiveUserId);
        let globalChannel: any = null;

        if (effectiveUserId) {
            const normalizedUserId = effectiveUserId.toLowerCase().trim();
            globalChannel = supabase.channel(`widget-unread-realtime:${normalizedUserId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'foxtalk_messages'
                }, () => {
                    fetchUnreadCounts();
                    window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'foxtalk_participants'
                }, () => {
                    fetchUnreadCounts();
                    window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));
                })
                .subscribe();
        }

        return () => {
            window.removeEventListener('foxtalk_unread_changed', handleUnreadChanged);
            if (globalChannel) {
                supabase.removeChannel(globalChannel);
            }
        };
    }, [sessionChatUser?.id, userId, (session?.user as any)?.id, profile?.sessionId]);

    useEffect(() => {
        if (appState === 'LOBBY') {
            loadRooms();
        }
    }, [appState, userId, profile?.sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (appState === 'ROOM' || appState === 'CS_CHAT' || appState === 'LIVE_CHAT') {
            scrollToBottom();
        }
    }, [messages, appState]);

    useEffect(() => {
        if (appState === 'CS_SETUP' && sessionChatUser?.nickname) {
            setSetupNick(sessionChatUser.nickname);
        }
    }, [appState, sessionChatUser]);

    useEffect(() => {
        // 커스텀 이벤트 수신 (다른 컴포넌트에서 폭스톡 열기)
        const handleOpenEvent = async (e: any) => {
            const { roomId } = e.detail || {};
            
            if (roomId) {
                // 특정 방으로 바로 입장 (이미 생성된 방이거나 새로 만든 방) - employer, seeker 정보 조인
                const { data: room } = await supabase
                    .from('foxtalk_rooms')
                    .select(`
                        *,
                        employer:employer_id(id, login_id, nickname, name, business_name),
                        seeker:seeker_id(id, login_id, nickname, name)
                    `)
                    .eq('id', roomId)
                    .single();
                if (room) {
                    // 프로필이 설정되어 있지 않다면 SETUP 화면으로
                    const currentProfile = profile || (localStorage.getItem('foxtalk_profile') ? JSON.parse(localStorage.getItem('foxtalk_profile')!) : null);
                    
                    if (!currentProfile) {
                        setAppState('SETUP');
                        return;
                    }
                    
                    setMessages([]); // 이전 대화 내용 즉시 청소
                    
                    // 최신 프로필 정보로 joinRoom 로직 직접 실행 (Stale Closure 방지)
                    if (room.type === 'SECRET' && room.created_by !== currentProfile.sessionId) {
                        const pass = prompt('비밀방입니다. 비밀번호를 입력해주세요.');
                        if (pass !== room.password_hash) {
                            alert('비밀번호가 틀렸습니다.');
                            return;
                        }
                    }
                    
                    console.log(`[FoxTalk-Event] ===== 이벤트 트리거 대화방 진입 프로세스 시작 (방 ID: ${room.id}) =====`);
                    const tStart = performance.now();

                    // 1. 참여자 등록 시간 측정
                    const t1 = performance.now();
                    await OA_INSERT_CHAT_PARTICIPANT({
                        room_id: room.id,
                        session_id: currentProfile.sessionId,
                        nickname: currentProfile.nickname,
                        avatar_type: currentProfile.avatarType
                    });
                    const t2 = performance.now();
                    console.log(`[FoxTalk-Event] Step 1: 참여자 등록 완료 - 소요 시간: ${(t2 - t1).toFixed(2)}ms`);

                    setCurrentRoom(room);
                    setAppState('ROOM');

                    // 2. 참여자 정보 로딩 시간 측정
                    const t3 = performance.now();
                    await loadParticipants(room.id, currentProfile);
                    const t4 = performance.now();
                    console.log(`[FoxTalk-Event] Step 2: 참여자 캐시 획득 완료 - 소요 시간: ${(t4 - t3).toFixed(2)}ms`);

                    // 3. 메시지 히스토리 조회 시간 측정
                    const t5 = performance.now();
                    await loadMessages(room.id);
                    const t6 = performance.now();
                    console.log(`[FoxTalk-Event] Step 3: 과거 대화 내용 조회 완료 - 소요 시간: ${(t6 - t5).toFixed(2)}ms`);
                    
                    // 4. 읽음 처리 수행 시간 측정
                    const t7 = performance.now();
                    if (currentProfile?.sessionId) {
                        await OA_UPDATE_PARTICIPANT_READ({
                            room_id: room.id,
                            session_id: currentProfile.sessionId
                        });
                    }
                    if (room.type !== '1ON1') {
                        await OA_INSERT_CHAT_MESSAGE({
                            room_id: room.id,
                            content: `${currentProfile.nickname}님이 입장하셨습니다.`,
                            message_type: 'SYSTEM_JOIN'
                        });
                    }
                    const t8 = performance.now();
                    console.log(`[FoxTalk-Event] Step 4: 읽음 및 부가 처리 완료 - 소요 시간: ${(t8 - t7).toFixed(2)}ms`);

                    window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));
                    console.log(`[FoxTalk-Event] ===== 이벤트 트리거 대화방 진입 완료 - 총 소요 시간: ${(performance.now() - tStart).toFixed(2)}ms =====`);
                    return;
                }
            }

            // roomId가 없으면 로비 열기
            setAppState('LOBBY');
            setLobbyTab('1ON1');
        };
        window.addEventListener('open_foxtalk', handleOpenEvent);
        return () => window.removeEventListener('open_foxtalk', handleOpenEvent);
    }, [userRole, userId, profile]);

    // Handle Open Widget
    const handleOpen = () => {
        if (!profile) setAppState('SETUP');
        else {
            setAppState('LOBBY');
        }
    };

    const loadRooms = async () => {
        const res = await QA_GET_CHAT_ROOMS(userId || undefined, userRole || undefined) as any;
        
        if (res.success) {
            setRooms(res.data || []);
        }
    };

    const roomIdsString = rooms.map(r => r.id).join(',');

    // LOBBY 상태에서도 새로운 메시지를 실시간으로 받기 위한 Supabase Subscription
    useEffect(() => {
        if (appState !== 'LOBBY' || !userId) return;

        // 내가 참여한 방들의 ID 목록
        const userRoomIds = rooms.map(r => r.id);
        if (userRoomIds.length === 0) return;

        const channel = supabase.channel(`lobby:${userId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'foxtalk_messages'
            }, async (payload) => {
                const newMessage = payload.new as any;
                if (!newMessage?.room_id) return;

                // 내가 참여 중인 방에 새 메시지가 왔다면 로컬 상태 즉시 갱신 (N+1 쿼리 방지)
                if (userRoomIds.includes(newMessage.room_id)) {
                    setRooms(prev => prev.map(room => {
                        if (room.id === newMessage.room_id) {
                            return {
                                ...room,
                                latest_message: newMessage.content,
                                latest_message_at: newMessage.created_at,
                                unread_count: (room.unread_count || 0) + 1
                            };
                        }
                        return room;
                    }).sort((a, b) => new Date(b.latest_message_at || b.created_at).getTime() - new Date(a.latest_message_at || a.created_at).getTime()));
                    
                    window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));

                    // 알림음 + 브라우저 알림 (내가 보낸 메시지 제외, 설정에서 켠 경우만)
                    if (newMessage.session_id !== userId) {
                        if (localStorage.getItem('foxmon_notif_sound') === '1') {
                            playNotificationSound();
                        }
                        if (document.hidden && localStorage.getItem('foxmon_notif_browser') === '1') {
                            showBrowserNotification('🦊 폭스톡', newMessage.content || '새 메시지가 도착했습니다.');
                        }
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [appState, userId, roomIdsString]);

    // 글로벌 알림 구독 - 폭스톡 위젯 상태와 무관하게 항상 동작
    useEffect(() => {
        if (!sessionChatUser?.id) return;
        const mySessionId = sessionChatUser.id;

        const globalChannel = supabase.channel(`global_notif:${mySessionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'foxtalk_messages'
            }, async (payload) => {
                const msg = payload.new as any;
                if (!msg?.room_id || !msg?.participant_id) return;

                // 시스템 메시지 제외
                if (msg.message_type === 'SYSTEM_JOIN' || msg.message_type === 'SYSTEM_LEAVE') return;

                // 내가 보낸 메시지인지 확인 (participant_id로 조회)
                const { data: participant } = await supabase
                    .from('foxtalk_participants')
                    .select('session_id')
                    .eq('id', msg.participant_id)
                    .single();

                if (participant?.session_id === mySessionId) return; // 내 메시지 제외

                // 알림음 재생
                if (localStorage.getItem('foxmon_notif_sound') === '1') {
                    playNotificationSound();
                }

                // 브라우저 알림
                if (localStorage.getItem('foxmon_notif_browser') === '1') {
                    const senderName = participant?.session_id || '알 수 없음';
                    // 닉네임 조회
                    const { data: pData } = await supabase
                        .from('foxtalk_participants')
                        .select('nickname')
                        .eq('id', msg.participant_id)
                        .single();
                    showBrowserNotification(
                        `🦊 ${pData?.nickname || '폭스톡'}`,
                        msg.content || '새 메시지가 도착했습니다.'
                    );
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(globalChannel);
        };
    }, [sessionChatUser?.id]);

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

    // DM 검색 핸들러
    const handleDmSearch = (keyword: string) => {
        setDmSearchKeyword(keyword);
        if (dmSearchTimer.current) clearTimeout(dmSearchTimer.current);
        
        if (!keyword.trim() || keyword.trim().length < 2) {
            setDmSearchResults([]);
            return;
        }

        dmSearchTimer.current = setTimeout(async () => {
            setDmSearching(true);
            try {
                const res = await QA_SEARCH_USERS_FOR_DM(keyword);
                if (res.success) {
                    setDmSearchResults(res.data);
                } else {
                    setDmSearchResults([]);
                }
            } catch (e) {
                console.error('DM 검색 오류:', e);
                setDmSearchResults([]);
            } finally {
                setDmSearching(false);
            }
        }, 400);
    };

    // DM 방 생성 및 입장 핸들러
    const handleStartDm = async (targetUser: any) => {
        if (!profile || !userId) return;
        setDmCreating(targetUser.id);
        try {
            const res = await OA_CREATE_DM_ROOM(targetUser.id);
            if (res.success && res.data) {
                // 검색 UI 초기화
                setShowDmSearch(false);
                setDmSearchKeyword('');
                setDmSearchResults([]);
                // 방 목록 새로고침 후 입장
                await loadRooms();
                joinRoom(res.data);
            } else {
                alert(res.error || '대화방 생성에 실패했습니다.');
            }
        } catch (e) {
            console.error('DM 방 생성 오류:', e);
            alert('대화방 생성 중 오류가 발생했습니다.');
        } finally {
            setDmCreating(null);
        }
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
        console.log(`[FoxTalk] ===== 대화방 진입 프로세스 시작 (방 ID: ${room.id}) =====`);
        const tStart = performance.now();

        setMessages([]); // 이전 대화 내용 즉시 청소

        if (room.type === 'SECRET' && room.created_by !== profile.sessionId) {
            const pass = prompt('비밀방입니다. 비밀번호를 입력해주세요.');
            // (간단 데모용 평문 비교. 실제론 해시 비교 필요)
            if (pass !== room.password_hash) {
                alert('비밀번호가 틀렸습니다.');
                return;
            }
        }
        
        // 1. 참여자 등록 시간 측정
        const t1 = performance.now();
        await OA_INSERT_CHAT_PARTICIPANT({
            room_id: room.id,
            session_id: profile.sessionId,
            nickname: profile.nickname,
            avatar_type: profile.avatarType
        });
        const t2 = performance.now();
        console.log(`[FoxTalk] Step 1: 참여자 등록 완료 - 소요 시간: ${(t2 - t1).toFixed(2)}ms`);

        setCurrentRoom(room);
        setAppState('ROOM');

        // 2. 참여자 정보 로딩 시간 측정
        const t3 = performance.now();
        await loadParticipants(room.id, profile);
        const t4 = performance.now();
        console.log(`[FoxTalk] Step 2: 참여자 캐시 획득 완료 - 소요 시간: ${(t4 - t3).toFixed(2)}ms`);

        // 3. 메시지 히스토리 조회 시간 측정
        const t5 = performance.now();
        await loadMessages(room.id);
        const t6 = performance.now();
        console.log(`[FoxTalk] Step 3: 과거 대화 내용 조회 완료 - 소요 시간: ${(t6 - t5).toFixed(2)}ms`);

        // 4. 읽음 처리 수행 시간 측정
        const t7 = performance.now();
        if (profile?.sessionId) {
            await OA_UPDATE_PARTICIPANT_READ({
                room_id: room.id,
                session_id: profile.sessionId
            });
        }
        const t8 = performance.now();
        console.log(`[FoxTalk] Step 4: 읽음 상태 갱신 완료 - 소요 시간: ${(t8 - t7).toFixed(2)}ms`);

        window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));

        // 시스템 메시지 발송 (입장) - 1ON1은 제외하여 채팅창 도배 방지
        if (room.type !== '1ON1') {
            await OA_INSERT_CHAT_MESSAGE({
                room_id: room.id,
                content: `${profile.nickname}님이 입장하셨습니다.`,
                message_type: 'SYSTEM_JOIN'
            });
        }
        
        console.log(`[FoxTalk] ===== 대화방 진입 프로세스 완료 - 총 소요 시간: ${(performance.now() - tStart).toFixed(2)}ms =====`);
    };

    const loadParticipants = async (roomId: string, currentProfile?: Profile | null) => {
        const { data: pList } = await supabase
            .from('foxtalk_participants')
            .select('*')
            .eq('room_id', roomId);
        
        if (pList) {
            const pMap: Record<string, any> = {};
            let myP = null;
            const targetProfile = currentProfile || profile;
            pList.forEach(p => {
                pMap[p.id] = p;
                if (targetProfile && p.session_id === targetProfile.sessionId) {
                    myP = p;
                }
            });
            setParticipantsMap(pMap);
            if (myP) setMyParticipant(myP);
            return pMap;
        }
        return {};
    };

    const loadMessages = async (roomId: string) => {
        const res = await QA_GET_CHAT_MESSAGES(roomId);
        if (res.success) {
            setMessages(res.data || []);
        }
    };

    // ===== 여우 실시간채팅 로직 =====
    // OPEN 탭 전환 시 채팅 프로필 로드
    useEffect(() => {
        if (lobbyTab === 'OPEN' && userId && !liveChatProfileLoaded) {
            (async () => {
                const res = await QA_GET_CHAT_PROFILE(userId);
                if (res.success && res.data) {
                    setLiveChatNick(res.data.chat_nickname);
                    setLiveChatAvatar(res.data.avatar_type || 'fox1');
                } else {
                    // 프로필이 없으면 로그인 닉네임을 기본값으로
                    setLiveChatNick(sessionChatUser?.nickname || '');
                }
                setLiveChatProfileLoaded(true);
            })();
        }
    }, [lobbyTab, userId, liveChatProfileLoaded, sessionChatUser]);

    const handleJoinLiveChat = async () => {
        if (!userId || !liveChatNick.trim()) return;
        setIsJoiningLive(true);
        try {
            // 0. 성별 확인 (여성 전용)
            const genderRes = await QA_GET_USER_GENDER(userId);
            if (genderRes.success && genderRes.gender === 'MALE') {
                alert('여성 회원 전용 채팅방입니다.');
                return;
            }
            // 1. 프로필 저장
            await OA_UPSERT_CHAT_PROFILE({
                user_id: userId,
                chat_nickname: liveChatNick.trim(),
                avatar_type: liveChatAvatar
            });

            // 2. LIVE 방 조회
            const roomRes = await QA_GET_LIVE_CHAT_ROOM();
            if (!roomRes.success || !roomRes.data) {
                alert('실시간 채팅방을 찾을 수 없습니다.');
                return;
            }

            const liveRoom = roomRes.data;

            // 3. 참여자 등록
            const currentProfile: Profile = {
                sessionId: userId,
                nickname: liveChatNick.trim(),
                avatarType: liveChatAvatar
            };
            setProfile(currentProfile);
            localStorage.setItem('foxtalk_profile', JSON.stringify(currentProfile));

            await OA_INSERT_CHAT_PARTICIPANT({
                room_id: liveRoom.id,
                session_id: userId,
                nickname: liveChatNick.trim(),
                avatar_type: liveChatAvatar
            });

            setMessages([]);
            setCurrentRoom(liveRoom);
            setAppState('LIVE_CHAT');

            // 4. 참여자 로딩 & 메시지 로딩
            await loadParticipants(liveRoom.id, currentProfile);
            await loadMessages(liveRoom.id);

            // 5. 입장 시스템 메시지
            await OA_INSERT_CHAT_MESSAGE({
                room_id: liveRoom.id,
                content: `${liveChatNick.trim()}님이 입장하셨습니다.`,
                message_type: 'SYSTEM_JOIN'
            });
        } catch (err: any) {
            console.error('[LiveChat] 참여 실패:', err);
            alert('실시간 채팅 참여에 실패했습니다.');
        } finally {
            setIsJoiningLive(false);
        }
    };

    // LIVE_CHAT 상태에서 Supabase Presence로 접속자 수 추적
    useEffect(() => {
        if (appState !== 'LIVE_CHAT' || !currentRoom || !userId) return;

        const presenceChannel = supabase.channel(`live-presence:${currentRoom.id}`, {
            config: { presence: { key: userId } }
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                setLiveOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ user_id: userId, nickname: liveChatNick });
                }
            });

        return () => {
            supabase.removeChannel(presenceChannel);
        };
    }, [appState, currentRoom, userId, liveChatNick]);

    // LIVE_CHAT 상태에서 실시간 메시지 수신 (기존 ROOM과 동일 로직)
    useEffect(() => {
        if (appState !== 'LIVE_CHAT' || !currentRoom?.id) return;

        const targetRoomId = currentRoom.id;
        const channel = supabase.channel(`live-messages:${targetRoomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'foxtalk_messages'
            }, async (payload) => {
                const newMessage = payload.new as any;
                if (!newMessage || newMessage.room_id !== targetRoomId) return;

                let participant = newMessage.participant_id ? participantsMapRef.current[newMessage.participant_id] : null;
                if (!participant && newMessage.participant_id) {
                    const { data: p } = await supabase
                        .from('foxtalk_participants')
                        .select('*')
                        .eq('id', newMessage.participant_id)
                        .maybeSingle();
                    if (p) {
                        setParticipantsMap(prev => ({ ...prev, [p.id]: p }));
                        participant = p;
                    }
                }
                setMessages((prev) => {
                    if (prev.some((m: { id?: string }) => m.id === newMessage.id)) return prev;
                    const filtered = prev.filter(m => !(m.id?.startsWith('temp-') && m.content === newMessage.content));
                    return [...filtered, { ...newMessage, participant }];
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [appState, currentRoom?.id]);

    // CS Chat Methods
    const handleOpenCS = async () => {
        const fromSession =
            sessionChatUser?.id != null
                ? {
                      sessionId: sessionChatUser.id,
                      nickname: sessionChatUser.nickname?.trim() || '고객',
                      avatarType:
                          profile?.sessionId === sessionChatUser.id
                              ? profile.avatarType
                              : 'fox1',
                  }
                : null;
        const fromStorage =
            profile ||
            (typeof window !== 'undefined' && localStorage.getItem('foxtalk_profile')
                ? (JSON.parse(localStorage.getItem('foxtalk_profile')!) as Profile)
                : null);
        const currentProfile = fromSession || fromStorage;
        if (!currentProfile) {
            setAppState('CS_SETUP');
            return;
        }
        setProfile(currentProfile);
        if (typeof window !== 'undefined') {
            localStorage.setItem('foxtalk_profile', JSON.stringify(currentProfile));
        }
        await startCSChat(currentProfile);
    };

    const startCSChat = async (prof: Profile) => {
        console.log(`[FoxTalk-CS] ===== 고객센터 대화방 진입 프로세스 시작 =====`);
        const tStart = performance.now();

        setMessages([]); // 이전 대화 내용 즉시 청소

        // 1. CS 룸 생성/획득 흐름 시간 측정
        const t1 = performance.now();
        const res = await FA_CS_CHAT_FLOW({
            session_id: prof.sessionId,
            nickname: prof.nickname,
            avatar_type: prof.avatarType
        });
        const t2 = performance.now();
        console.log(`[FoxTalk-CS] Step 1: CS 대화방 획득 완료 - 소요 시간: ${(t2 - t1).toFixed(2)}ms`);

        if (res.success && res.data) {
            setCurrentRoom(res.data);
            setAppState('CS_CHAT');

            // 2. 참가자 정보 로딩 시간 측정
            const t3 = performance.now();
            await loadParticipants(res.data.id, prof);
            const t4 = performance.now();
            console.log(`[FoxTalk-CS] Step 2: 참여자 캐시 획득 완료 - 소요 시간: ${(t4 - t3).toFixed(2)}ms`);

            // 3. 메시지 로딩 시간 측정
            const t5 = performance.now();
            await loadCSMessages(res.data.id);
            const t6 = performance.now();
            console.log(`[FoxTalk-CS] Step 3: CS 대화 내역 조회 완료 - 소요 시간: ${(t6 - t5).toFixed(2)}ms`);

            console.log(`[FoxTalk-CS] ===== 고객센터 대화방 진입 프로세스 완료 - 총 소요 시간: ${(performance.now() - tStart).toFixed(2)}ms =====`);
        } else {
            alert('고객센터 연결에 실패했습니다.');
        }
    };

    const loadCSMessages = async (roomId: string) => {
        const res = await QA_GET_CS_MESSAGES(roomId);
        if (res.success) setMessages(res.data || []);
    };

    const saveProfileForCS = () => {
        if (!setupNick.trim()) return;
        const sid = sessionChatUser?.id ?? crypto.randomUUID();
        const newProfile: Profile = {
            sessionId: sid,
            nickname: setupNick.trim(),
            avatarType: setupAv,
        };
        localStorage.setItem('foxtalk_profile', JSON.stringify(newProfile));
        setProfile(newProfile);
        startCSChat(newProfile);
    };

    const sendCSMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgInput.trim() || !currentRoom || !profile || isSending) return;

        setIsSending(true);
        const currentInput = msgInput.trim();
        setMsgInput('');

        const { maskBadWords } = await import('@/lib/utils/bad-words');
        const maskedContent = await maskBadWords(currentInput);

        // 낙관적 업데이트: 임시 CS 메시지 즉시 추가 (0ms 렌더링)
        const tempId = `temp-${crypto.randomUUID()}`;
        const tempMsg = {
            id: tempId,
            room_id: currentRoom.id,
            content: maskedContent,
            created_at: new Date().toISOString(),
            participant_id: profile.sessionId,
            participant: {
                session_id: profile.sessionId,
                nickname: profile.nickname,
                avatar_type: profile.avatarType
            }
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const res = await OA_INSERT_CS_MESSAGE({
                room_id: currentRoom.id,
                participant_id: profile.sessionId, // This acts as session_id for customers, and 'CS_ADMIN' for admins
                content: maskedContent,
                sender_nickname: profile.nickname
            });
            
            if (res.success) {
                if (res.data) {
                    const realMsg = {
                        ...res.data,
                        participant: tempMsg.participant
                    };
                    setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
                }
                // 자동 안내 및 최신 메시지 갱신을 위해 약간의 시차 후 목록 재조회
                setTimeout(() => {
                    if (currentRoom?.id) loadCSMessages(currentRoom.id);
                }, 300);
                window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));
            } else {
                // 실패 시 롤백
                setMessages(prev => prev.filter(m => m.id !== tempId));
                alert(res.error || '메시지 전송에 실패했습니다.');
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    // Supabase Realtime Subscription
    useEffect(() => {
        if ((appState !== 'ROOM' && appState !== 'CS_CHAT') || !currentRoom?.id) return;
        
        const targetRoomId = currentRoom.id;
        const channel = supabase.channel(`room:${targetRoomId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'foxtalk_messages' }, async (payload) => {
                const newMessage = payload.new as Record<string, unknown> & { id?: string; room_id?: string; participant_id?: string; content?: string; message_type?: string };
                if (!newMessage?.id || newMessage.room_id !== targetRoomId) return;
                
                // 상대방 메시지 수신 시 읽음 처리 수행
                if (profile?.sessionId) {
                    await OA_UPDATE_PARTICIPANT_READ({
                        room_id: targetRoomId,
                        session_id: profile.sessionId
                    });
                    window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));
                }

                let participant = newMessage.participant_id ? participantsMapRef.current[newMessage.participant_id] : null;
                if (!participant && newMessage.participant_id) {
                    const { data: p } = await supabase
                        .from('foxtalk_participants')
                        .select('*')
                        .eq('id', newMessage.participant_id)
                        .maybeSingle();
                    if (p) {
                        setParticipantsMap(prev => ({ ...prev, [p.id]: p }));
                        participant = p;
                    }
                }
                setMessages((prev) => {
                    if (prev.some((m: { id?: string }) => m.id === newMessage.id)) return prev;
                    // 내가 보낸 실제 메시지가 들어왔다면 기존 임시(temp) 메시지를 필터링하여 대체
                    const filtered = prev.filter(m => !(m.id?.startsWith('temp-') && m.content === newMessage.content));
                    return [...filtered, { ...newMessage, participant }];
                });

                // 알림음 + 브라우저 알림 (타인 메시지만, 설정에서 켠 경우만)
                const isMyMsg = participant?.session_id === profile?.sessionId;
                if (!isMyMsg && newMessage.message_type !== 'SYSTEM_JOIN') {
                    if (localStorage.getItem('foxmon_notif_sound') === '1') {
                        playNotificationSound();
                    }
                    if (document.hidden && localStorage.getItem('foxmon_notif_browser') === '1') {
                        const senderName = participant?.nickname || '알 수 없음';
                        showBrowserNotification(`🦊 ${senderName}`, (newMessage.content as string) || '새 메시지');
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [appState, currentRoom?.id, profile?.sessionId]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgInput.trim() || !currentRoom || !profile || isSending) return;

        let p = myParticipant;
        if (!p) {
            const { data: fetchedP } = await supabase
                .from('foxtalk_participants')
                .select('*')
                .eq('room_id', currentRoom.id)
                .eq('session_id', profile.sessionId)
                .single();
            if (fetchedP) {
                p = fetchedP;
                setMyParticipant(fetchedP);
            }
        }
        if (!p) return;

        setIsSending(true);
        const currentInput = msgInput.trim();
        setMsgInput('');

        const { maskBadWords } = await import('@/lib/utils/bad-words');
        const maskedContent = await maskBadWords(currentInput);

        // 낙관적 업데이트: 임시 메시지 즉각 추가 (0ms 렌더링)
        const tempId = `temp-${crypto.randomUUID()}`;
        const tempMsg = {
            id: tempId,
            room_id: currentRoom.id,
            content: maskedContent,
            created_at: new Date().toISOString(),
            participant_id: p.id,
            participant: {
                session_id: profile.sessionId,
                nickname: profile.nickname,
                avatar_type: profile.avatarType
            }
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const res = await OA_INSERT_CHAT_MESSAGE({
                room_id: currentRoom.id,
                participant_id: p.id,
                content: maskedContent
            });

            if (!res.success) {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                alert('메시지 전송에 실패했습니다.');
            } else {
                if (res.data) {
                    const realMsg = {
                        ...res.data,
                        participant: tempMsg.participant
                    };
                    setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m));
                }
                // 내가 메시지를 보냈으므로 내 읽음 상태 갱신
                if (profile?.sessionId) {
                    await OA_UPDATE_PARTICIPANT_READ({
                        room_id: currentRoom.id,
                        session_id: profile.sessionId
                    });
                }
                window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const confirmLeaveRoom = async () => {
        if (!currentRoom || !profile) return;
        
        const res = await OA_LEAVE_CHAT_ROOM(currentRoom.id, profile.sessionId, profile.nickname);
        if (res.success) {
            setAppState('LOBBY');
            loadRooms();
            setCurrentRoom(null);
            setShowLeaveConfirm(false);
            setShowRoomMenu(false);
            window.dispatchEvent(new CustomEvent('foxtalk_unread_changed'));
        } else {
            alert(res.error || '대화방 나가기에 실패했습니다.');
        }
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
        if (appState === 'CLOSED') {
            setAppState('MENU');
        } else if (appState === 'MENU') {
            setAppState('CLOSED');
        }
    };

    const hideOnRoutes = ['/login', '/register', '/age-gate', '/find-account', '/render-banners'];
    const shouldHide = hideOnRoutes.some(route => pathname?.startsWith(route));

    if (shouldHide) return null;

    if (appState === 'CLOSED' || appState === 'MENU') {
        if (!mounted || typeof document === 'undefined') return null;
        return createPortal(
            <div 
                className="fixed z-[999999] flex flex-col items-end gap-3 pointer-events-none"
                style={{ right: `${pos.right}px`, bottom: `${pos.bottom}px` }}
            >
                {/* Menu Popup */}
                {appState === 'MENU' && (
                    <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-2 w-[260px] animate-in slide-in-from-bottom-2 fade-in duration-200 mb-2 pointer-events-auto">
                        <div className="px-3 py-2 border-b border-gray-50 mb-1">
                            <span className="text-[12px] font-black text-gray-400">무엇을 도와드릴까요?</span>
                        </div>
                        
                        {/* FoxTalk Button */}
                        <button 
                            onClick={() => {
                                handleOpen();
                            }}
                            className="w-full text-left flex items-center justify-between gap-3.5 px-3 py-3.5 hover:bg-orange-50/50 rounded-2xl transition-colors group"
                        >
                            <div className="flex items-center gap-3.5 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-black text-[15px] text-gray-900 leading-tight mb-0.5">
                                        폭스톡 <span className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full ml-1">Beta</span>
                                    </span>
                                    <span className="text-[11px] font-medium text-gray-500 truncate">
                                        {!userRole ? '로그인 후 시작하기' : userRole === 'EMPLOYER' ? '지원자와 실시간 대화하기' : '1:1 구직 대화 및 여우 오픈채팅'}
                                    </span>
                                </div>
                            </div>
                            {unreadCounts.foxTalkUnread > 0 && (
                                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 animate-pulse ml-2 shadow-sm">
                                    N
                                </div>
                            )}
                        </button>

                        {/* Customer Service Button */}
                        <button 
                            onClick={handleOpenCS}
                            className="w-full text-left flex items-center justify-between gap-3.5 px-3 py-3.5 hover:bg-blue-50/50 rounded-2xl transition-colors group mt-1"
                        >
                            <div className="flex items-center gap-3.5 overflow-hidden">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                                    <Headset className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-black text-[15px] text-gray-900 leading-tight mb-0.5">폭스몬 고객센터</span>
                                    <span className="text-[11px] font-medium text-gray-500 truncate">
                                        {!userRole ? '비회원 이용 문의' : userRole === 'EMPLOYER' ? '광고/결제 및 이용 문의' : '일반 이용 문의'}
                                    </span>
                                </div>
                            </div>
                            {unreadCounts.csUnread > 0 && (
                                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 animate-pulse ml-2 shadow-sm">
                                    N
                                </div>
                            )}
                        </button>
                    </div>
                )}

                {/* FAB Button */}
                {(() => { console.log('[BADGE-RENDER] FAB 렌더링:', { appState, unreadCounts, totalUnread: unreadCounts.totalUnread, showBadge: appState === 'CLOSED' && unreadCounts.totalUnread > 0 }); return null; })()}
                <button 
                    onClick={onWidgetClick}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all group border-2 border-white touch-none pointer-events-auto ${appState === 'MENU' ? 'bg-gray-800 rotate-90 scale-95' : 'bg-gradient-to-tr from-primary to-orange-400 hover:scale-110'}`}
                >
                    {appState === 'CLOSED' ? (
                        <>
                            {unreadCounts.totalUnread > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-pulse border-2 border-white flex items-center justify-center shadow-md">
                                    <span className="text-[10px] font-black text-white leading-none">N</span>
                                </div>
                            )}
                            <MessageCircle className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
                        </>
                    ) : (
                        <X className="w-7 h-7 text-white -rotate-90" />
                    )}
                </button>
            </div>,
            document.body
        );
    }

    if (!mounted || typeof document === 'undefined') return null;
    return createPortal(
        <div 
            className="fixed w-full max-w-[360px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[999999] border border-gray-100 animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto"
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
                    {appState === 'CREATE_ROOM' || appState === 'ROOM' || appState === 'CS_CHAT' ? (
                        <button onClick={(e) => {
                            e.stopPropagation();
                            if (appState === 'ROOM') {
                                // 향후 나가기 시스템 메시지 추가 가능
                            }
                            if (appState === 'CS_CHAT') {
                                setAppState('MENU');
                            } else {
                                setAppState('LOBBY'); 
                                loadRooms();
                            }
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
                        <h2 className="font-black text-[16px] leading-tight">
                            {appState === 'CS_SETUP' || appState === 'CS_CHAT' ? '폭스몬 고객센터' : '여우토크'}
                        </h2>
                        <p className="text-[10px] text-white/80 font-medium">
                            {appState === 'CS_SETUP' || appState === 'CS_CHAT' ? '실시간 1:1 상담' : '실시간 익명 오픈채팅'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setAppState('CLOSED'); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0"
                >
                    <span className="hidden md:flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/20 text-white transition-colors">
                        <X className="w-5 h-5" />
                    </span>
                    <span className="md:hidden inline-block px-3.5 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-full text-[12px] font-black transition-all">
                        닫기
                    </span>
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

                {appState === 'CS_SETUP' && (
                    <div className="p-6 flex flex-col h-full justify-center">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                <Headset className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="font-black text-xl text-gray-900 mb-2">고객센터 연결</h3>
                            <p className="text-sm text-gray-500 font-medium">상담 시 사용할 닉네임을 입력해주세요.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-1 block">닉네임</label>
                                <input 
                                    type="text" 
                                    value={setupNick}
                                    onChange={(e) => setSetupNick(e.target.value)}
                                    placeholder="사용하실 닉네임 입력"
                                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-sm font-bold"
                                />
                            </div>
                            <button 
                                onClick={saveProfileForCS}
                                disabled={!setupNick}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-3.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                            >
                                상담 시작하기
                            </button>
                        </div>
                    </div>
                )}

                {appState === 'CS_CHAT' && (
                    <div className="flex flex-col h-full bg-white">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-gray-50/50">
                            <div className="text-center py-4">
                                <div className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                                    고객센터에 연결되었습니다. 문의를 남겨주세요!
                                </div>
                            </div>
                            {messages.map((msg, i) => {
                                const isMe = msg.participant?.session_id === profile?.sessionId;
                                return (
                                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                        <div className={`flex items-end gap-1.5 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMe && (
                                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-white shadow-sm overflow-hidden text-[13px]">
                                                    {msg.participant?.avatarType === 'fox1' ? '🎧' : '👤'}
                                                </div>
                                            )}
                                            <div className={`p-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm break-words ${isMe ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                                                {!isMe && <div className="text-[10px] font-black text-blue-500 mb-1 -mt-0.5">{msg.participant?.nickname || '상담원'}</div>}
                                                {msg.content}
                                            </div>
                                            <span className="text-[9px] text-gray-400 font-medium mb-1 px-0.5 shrink-0">
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-1" />
                        </div>
                        <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                            <form onSubmit={sendCSMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={msgInput}
                                    onChange={(e) => setMsgInput(e.target.value)}
                                    placeholder="문의 내용을 입력하세요..."
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                                <button type="submit" disabled={!msgInput.trim()} className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 transition-colors shrink-0 shadow-sm">
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {appState === 'LOBBY' && (
                    <div className="flex flex-col h-full bg-white">
                        {/* 탭 헤더 */}
                        {userRole !== 'EMPLOYER' && (
                            <div className="flex border-b bg-white shrink-0">
                                <button 
                                    onClick={() => setLobbyTab('1ON1')}
                                    className={`flex-1 py-3.5 text-[13px] font-black transition-colors ${lobbyTab === '1ON1' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    💬 1:1 구인구직
                                </button>
                                <button 
                                    onClick={() => setLobbyTab('OPEN')}
                                    className={`flex-1 py-3.5 text-[13px] font-black transition-colors ${lobbyTab === 'OPEN' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    💬 여우 실시간채팅
                                </button>
                            </div>
                        )}

                        {/* 1ON1 탭 콘텐츠 */}
                        {lobbyTab === '1ON1' && (
                            <>
                                <div className="p-3 bg-gray-50 border-b sticky top-0 z-10 flex justify-between items-center shadow-sm">
                                    <h3 className="font-black text-[12px] text-gray-500 flex items-center gap-1.5">
                                        내 다이렉트 대화방
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowDmSearch(!showDmSearch);
                                            if (showDmSearch) {
                                                setDmSearchKeyword('');
                                                setDmSearchResults([]);
                                            }
                                        }}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                                            showDmSearch
                                                ? 'bg-primary text-white'
                                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        {showDmSearch ? <X className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                                        {showDmSearch ? '닫기' : '새 대화'}
                                    </button>
                                </div>

                                {/* DM 검색 패널 */}
                                {showDmSearch && (
                                    <div className="border-b bg-orange-50/30">
                                        <div className="p-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={dmSearchKeyword}
                                                    onChange={(e) => handleDmSearch(e.target.value)}
                                                    placeholder="닉네임 또는 아이디로 검색..."
                                                    className="w-full pl-9 pr-3 py-2.5 border-2 border-orange-200 rounded-xl focus:border-primary focus:ring-0 outline-none text-[13px] font-bold bg-white"
                                                    autoFocus
                                                />
                                            </div>
                                            {dmSearchKeyword.trim().length > 0 && dmSearchKeyword.trim().length < 2 && (
                                                <p className="text-[10px] text-gray-400 mt-1.5 px-1">2글자 이상 입력해주세요.</p>
                                            )}
                                        </div>

                                        {/* 검색 결과 */}
                                        {dmSearching && (
                                            <div className="px-3 pb-3 flex items-center justify-center gap-2 text-[12px] text-gray-400">
                                                <span className="w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                                                검색 중...
                                            </div>
                                        )}
                                        {!dmSearching && dmSearchResults.length > 0 && (
                                            <ul className="max-h-48 overflow-y-auto">
                                                {dmSearchResults.map((user) => (
                                                    <li key={user.id} className="px-3 py-2.5 flex items-center gap-3 hover:bg-orange-50 transition-colors">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-lg shrink-0 border border-orange-200">
                                                            🦊
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-black text-gray-900 truncate">{user.nickname || user.login_id}</p>
                                                            {user.login_id && user.nickname && (
                                                                <p className="text-[10px] text-gray-400 truncate">@{user.login_id}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleStartDm(user)}
                                                            disabled={dmCreating === user.id}
                                                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-[11px] font-black rounded-lg disabled:opacity-50 transition-all flex items-center gap-1 shrink-0"
                                                        >
                                                            {dmCreating === user.id ? (
                                                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <MessageCircle className="w-3 h-3" />
                                                            )}
                                                            대화
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {!dmSearching && dmSearchKeyword.trim().length >= 2 && dmSearchResults.length === 0 && (
                                            <div className="px-3 pb-3 text-center text-[12px] text-gray-400 py-4">
                                                검색 결과가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <ul className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                                    {rooms.filter(r => r.type === '1ON1').length === 0 ? (
                                        <li className="text-center text-sm font-bold text-gray-400 py-16 flex flex-col items-center gap-3">
                                            <MessageCircle className="w-10 h-10 opacity-20" />
                                            대화 내역이 없습니다.
                                            <button
                                                onClick={() => setShowDmSearch(true)}
                                                className="mt-2 px-4 py-2 bg-primary text-white text-[12px] font-black rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1.5"
                                            >
                                                <UserPlus className="w-4 h-4" /> 새 대화 시작하기
                                            </button>
                                        </li>
                                    ) : rooms.filter(r => r.type === '1ON1').map(room => (
                                        <li key={room.id}>
                                            <button 
                                                onClick={() => joinRoom(room)}
                                                className="w-full text-left p-4 hover:bg-orange-50/50 transition-colors group flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                    <Users className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <h4 className="font-black text-[14px] text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                                                            {getRoomDisplayTitle(room)}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-gray-500 font-medium truncate">{room.latest_message || '최근 대화내용이 여기에 표시됩니다...'}</span>
                                                    </div>
                                                </div>
                                                {room.unread_count > 0 && (
                                                    <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 animate-pulse">
                                                        N
                                                    </div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {/* 실시간채팅 탭 콘텐츠 - 프로필 설정 + 참여 버튼 */}
                        {lobbyTab === 'OPEN' && (
                            <div className="flex-1 flex flex-col p-5 overflow-y-auto">
                                {/* 프로필 설정 영역 */}
                                <div className="flex flex-col items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-4xl shadow-inner border-2 border-orange-200">
                                        {liveChatAvatar === 'fox1' ? '🦊' : liveChatAvatar === 'fox2' ? '🐱' : liveChatAvatar === 'fox3' ? '🐻' : liveChatAvatar === 'fox4' ? '🐰' : liveChatAvatar === 'fox5' ? '🐶' : '🦊'}
                                    </div>
                                    <div className="flex gap-2">
                                        {['fox1', 'fox2', 'fox3', 'fox4', 'fox5'].map((av) => (
                                            <button
                                                key={av}
                                                onClick={() => setLiveChatAvatar(av)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                                                    liveChatAvatar === av
                                                        ? 'bg-primary/20 border-2 border-primary scale-110 shadow-md'
                                                        : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                                                }`}
                                            >
                                                {av === 'fox1' ? '🦊' : av === 'fox2' ? '🐱' : av === 'fox3' ? '🐻' : av === 'fox4' ? '🐰' : '🐶'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 mb-1.5 block">채팅 닉네임</label>
                                        <input
                                            type="text"
                                            value={liveChatNick}
                                            onChange={(e) => setLiveChatNick(e.target.value.slice(0, 20))}
                                            placeholder="채팅에서 사용할 닉네임"
                                            className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-primary focus:ring-0 outline-none text-sm font-bold"
                                        />
                                        <span className="text-[10px] text-gray-400 mt-1 block text-right">{liveChatNick.length}/20</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                        채팅방에서 사용할 닉네임과 아바타를 설정할 수 있습니다.
                                        기본 닉네임은 회원 닉네임이 자동으로 설정됩니다.
                                    </p>
                                    <div className="flex items-center gap-1.5 bg-pink-50 border border-pink-200 rounded-lg px-3 py-2 mt-1">
                                        <span className="text-sm">👩</span>
                                        <span className="text-[11px] font-black text-pink-500">여성 회원 전용 채팅방입니다</span>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <button
                                        onClick={handleJoinLiveChat}
                                        disabled={!liveChatNick.trim() || isJoiningLive || !userId}
                                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 rounded-xl disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 text-[14px]"
                                    >
                                        {isJoiningLive ? (
                                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 참여 중...</>
                                        ) : (
                                            <><Radio className="w-5 h-5" /> 실시간 채팅 참여</>
                                        )}
                                    </button>
                                    {!userId && (
                                        <p className="text-[11px] text-red-400 font-bold text-center mt-2">로그인 후 이용 가능합니다.</p>
                                    )}
                                </div>
                            </div>
                        )}
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

                {appState === 'LIVE_CHAT' && currentRoom && (
                    <div className="flex flex-col h-full bg-[#f8f9fa]">
                        {/* 상단 헤더 */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 shrink-0 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    setAppState('LOBBY');
                                    setCurrentRoom(null);
                                    setMessages([]);
                                }}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="text-center">
                                <h3 className="text-white font-black text-[14px] flex items-center justify-center gap-1.5">🦊 여우 실시간채팅 <span className="text-[9px] bg-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold">👩 여성전용</span></h3>
                                <span className="text-white/80 text-[10px] font-bold flex items-center justify-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                                    {liveOnlineCount}명 참여 중
                                </span>
                            </div>
                            <div className="w-5" />
                        </div>

                        {/* 메시지 목록 */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-sm font-bold text-gray-400 py-16 flex flex-col items-center gap-3">
                                    <Radio className="w-10 h-10 opacity-20" />
                                    아직 대화가 없습니다. 첫 메시지를 보내보세요!
                                </div>
                            )}
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
                                
                                const isMe = m.participant?.session_id === profile?.sessionId;

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

                        {/* 메시지 입력 */}
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

                {appState === 'ROOM' && currentRoom && (
                    <div className="flex flex-col h-full bg-[#f8f9fa]">
                        <div className="bg-white px-4 py-2 border-b shadow-sm shrink-0 flex items-center justify-between">
                            <div className="font-black text-[13px] text-gray-800 flex items-center gap-1">
                                {currentRoom.type === 'SECRET' && <Shield className="w-3.5 h-3.5 text-red-500" />}
                                {getRoomDisplayTitle(currentRoom)}
                            </div>
                            {currentRoom.type === 'SECRET' && (
                                <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">
                                    참여코드: {currentRoom.room_code}
                                </span>
                            )}
                            <div className="relative ml-auto">
                                <button 
                                    onClick={() => setShowRoomMenu(!showRoomMenu)}
                                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors flex items-center shrink-0"
                                    title="메뉴"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                {showRoomMenu && (
                                    <>
                                        {/* Background overlay to close menu */}
                                        <div className="fixed inset-0 z-40" onClick={() => setShowRoomMenu(false)} />
                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                                            <button 
                                                onClick={() => {
                                                    setShowRoomMenu(false);
                                                    setShowLeaveConfirm(true);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                대화방 나가기
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {showLeaveConfirm && (
                            <div className="absolute inset-0 bg-black/40 z-[60] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white rounded-2xl p-6 w-full max-w-[260px] shadow-2xl animate-in zoom-in-95 duration-200">
                                    <h3 className="font-black text-gray-900 mb-2 text-center text-[15px]">대화방 나가기</h3>
                                    <p className="text-xs text-gray-500 mb-6 text-center leading-relaxed font-medium">
                                        정말 이 대화방을 나가시겠습니까?<br/>
                                        <span className="text-[11px] text-red-400 font-bold mt-1 inline-block">대화 내역은 복구할 수 없습니다.</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setShowLeaveConfirm(false)}
                                            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            취소
                                        </button>
                                        <button 
                                            onClick={confirmLeaveRoom}
                                            className="flex-1 py-2.5 rounded-xl text-[13px] font-black text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 transition-colors"
                                        >
                                            나가기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
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
                                
                                const isMe = m.participant?.session_id === profile?.sessionId;

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
        </div>,
        document.body
    );
}
