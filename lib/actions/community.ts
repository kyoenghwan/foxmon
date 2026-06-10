'use server';

import { auth } from '@/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { RA_CHECK_BOARD_PERMISSION } from '@/src/atoms/ra/community/RA_CHECK_BOARD_PERMISSION';
import { RA_VALIDATE_POST_INPUT } from '@/src/atoms/ra/community/RA_VALIDATE_POST_INPUT';

// 캐시 저장을 위한 인터페이스 및 전역 캐시 변수 정의
interface CommunityCacheItem {
    posts: any[];
    total: number;
    lastFetched: number;
}
const communityCache: Record<string, CommunityCacheItem> = {};
const COMMUNITY_CACHE_TTL = 15 * 1000; // 15초 캐시 (15,000ms)

// ============================================
// QA: 게시판별 게시글 목록 조회
// ============================================
export async function getCommunityPosts(boardId: string, page: number = 1, limit: number = 20) {
    const cacheKey = `${boardId}_${page}_${limit}`;
    const now = Date.now();
    const cached = communityCache[cacheKey];

    if (cached && (now - cached.lastFetched < COMMUNITY_CACHE_TTL)) {
        nvLog('AT', '⚡ [Cache Hit] QA_GET_COMMUNITY_POSTS', { boardId, page, limit });
        return { posts: cached.posts, total: cached.total };
    }

    nvLog('AT', '▶️ QA_GET_COMMUNITY_POSTS', { boardId, page, limit });

    try {
        const offset = (page - 1) * limit;

        // 전체 건수 및 게시글 목록을 병렬로 쿼리하여 성능 최적화 (Promise.all)
        const [countRes, listRes] = await Promise.all([
            supabaseAdmin
                .from('community_posts')
                .select('*', { count: 'exact', head: true })
                .eq('board_id', boardId),
            supabaseAdmin
                .from('community_posts')
                .select('*')
                .eq('board_id', boardId)
                .order('is_hot', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
        ]);

        const count = countRes.count;
        const { data, error } = listRes;

        if (error) {
            nvLog('AT', '❌ QA_GET_COMMUNITY_POSTS 에러', error);
            // 에러 시 캐시 데이터가 있으면 폴백 반환
            return { posts: cached?.posts || [], total: cached?.total || 0 };
        }

        const result = { posts: data || [], total: count || 0 };
        
        // 메모리 캐시에 데이터 갱신
        communityCache[cacheKey] = {
            posts: result.posts,
            total: result.total,
            lastFetched: Date.now()
        };

        return result;
    } catch (err) {
        nvLog('AT', '❌ QA_GET_COMMUNITY_POSTS 예외', err);
        return { posts: cached?.posts || [], total: cached?.total || 0 };
    }
}

// ============================================
// FA: 게시글 작성 Flow
// ============================================
export async function createCommunityPost(input: {
    board_id: string;
    title: string;
    content: string;
    thumbnail?: string | null;
    price?: string | null;
    detail_images?: string[] | null;
}) {
    nvLog('AT', '▶️ FA_CREATE_COMMUNITY_POST 시작', { board_id: input.board_id, title: input.title });

    try {
        // Step 0: 인증 확인
        const session = await auth();
        if (!session?.user) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        const user = session.user as any;
        const userRole = user.role || 'USER';
        const userId = user.id;
        const nickname = user.nickname || user.name || '익명';

        // Step 1: 권한 검증 (RA)
        const permResult = RA_CHECK_BOARD_PERMISSION({
            board_id: input.board_id,
            user_role: userRole,
        });

        if (!permResult.isValid) {
            return { success: false, message: permResult.error };
        }

        // Step 2: 입력 검증 (RA)
        const validResult = RA_VALIDATE_POST_INPUT({
            title: input.title,
            content: input.content,
            board_id: input.board_id,
        });

        if (!validResult.isValid) {
            return { success: false, message: validResult.error };
        }

        // Step 2.5: 불법 금지어 자체 필터링
        const { checkBadWords } = await import('@/lib/utils/bad-words');
        const titleCheck = await checkBadWords(input.title);
        if (titleCheck.hasBadWord) {
            return { success: false, message: `제목에 불법/유해 금지어 [${titleCheck.word}]가 포함되어 사용할 수 없습니다.` };
        }
        
        const contentCheck = await checkBadWords(input.content);
        if (contentCheck.hasBadWord) {
            return { success: false, message: `본문에 불법/유해 금지어 [${contentCheck.word}]가 포함되어 사용할 수 없습니다.` };
        }

        // Step 3: 게시글 저장 (OA)
        const isAnonymous = permResult.data?.forceAnonymous || false;
        const authorName = isAnonymous ? '익명' : nickname;

        const { data, error } = await supabaseAdmin
            .from('community_posts')
            .insert({
                board_id: input.board_id,
                user_id: userId,
                author_name: authorName,
                is_anonymous: isAnonymous,
                title: input.title.trim(),
                content: input.content.trim(),
                thumbnail: input.thumbnail || null,
                price: input.price || null,
                detail_images: input.detail_images || null,
            })
            .select()
            .single();

        if (error) {
            nvLog('AT', '❌ OA_INSERT_COMMUNITY_POST 에러', error);
            return { success: false, message: `게시글 저장에 실패했습니다. (${error.message || JSON.stringify(error)})` };
        }

        // 새 글 등록 성공 시 해당 게시판의 관련 페이징 캐시 무효화 (Invalidate)
        const keysToInvalidate = Object.keys(communityCache).filter(key => key.startsWith(`${input.board_id}_`));
        keysToInvalidate.forEach(key => {
            delete communityCache[key];
        });

        nvLog('AT', '✅ FA_CREATE_COMMUNITY_POST 완료', { postId: data.id });
        return { success: true, data, message: '게시글이 등록되었습니다.' };

    } catch (err: any) {
        nvLog('AT', '❌ FA_CREATE_COMMUNITY_POST 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

// ============================================
// QA: 게시글 상세 조회
// ============================================
export async function getCommunityPostById(postId: string) {
    nvLog('AT', '▶️ QA_GET_COMMUNITY_POST_BY_ID', { postId });

    try {
        const { data, error } = await supabaseAdmin
            .from('community_posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (error) {
            nvLog('AT', '❌ QA_GET_COMMUNITY_POST_BY_ID 에러', error);
            return null;
        }

        return data;
    } catch (err) {
        nvLog('AT', '❌ QA_GET_COMMUNITY_POST_BY_ID 예외', err);
        return null;
    }
}

// ============================================
// FA: 게시글 수정 Flow (관리자 또는 본인)
// ============================================
export async function updateCommunityPost(postId: string, input: {
    title: string;
    content: string;
    thumbnail?: string | null;
    price?: string | null;
    detail_images?: string[] | null;
}) {
    nvLog('AT', '▶️ FA_UPDATE_COMMUNITY_POST 시작', { postId, title: input.title });

    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        const { error } = await supabaseAdmin
            .from('community_posts')
            .update({
                title: input.title.trim(),
                content: input.content.trim(),
                thumbnail: input.thumbnail || null,
                price: input.price || null,
                detail_images: input.detail_images || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (error) {
            nvLog('AT', '❌ OA_UPDATE_COMMUNITY_POST 에러', error);
            return { success: false, message: `게시글 수정에 실패했습니다. (${error.message})` };
        }

        nvLog('AT', '✅ FA_UPDATE_COMMUNITY_POST 완료', { postId });
        return { success: true, message: '게시글이 수정되었습니다.' };

    } catch (err: any) {
        nvLog('AT', '❌ FA_UPDATE_COMMUNITY_POST 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

// ============================================
// QA: 댓글 목록 조회
// ============================================
export async function getCommunityComments(postId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('community_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            nvLog('AT', '❌ QA_GET_COMMUNITY_COMMENTS 에러', error);
            return [];
        }

        return data || [];
    } catch (err) {
        nvLog('AT', '❌ QA_GET_COMMUNITY_COMMENTS 예외', err);
        return [];
    }
}

// ============================================
// FA: 댓글 작성 Flow
// ============================================
export async function createCommunityComment(input: {
    post_id: string;
    parent_id?: string;
    content: string;
    board_id: string; // 권한 검증용
}) {
    try {
        // Step 0: 인증 확인
        const session = await auth();
        if (!session?.user) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        const user = session.user as any;
        const userRole = user.role || 'USER';
        const userId = user.id;
        const nickname = user.nickname || user.name || '익명';

        // Step 1: 권한 검증 (RA) - 게시판 권한을 그대로 따름
        const permResult = RA_CHECK_BOARD_PERMISSION({
            board_id: input.board_id,
            user_role: userRole,
        });

        if (!permResult.isValid) {
            return { success: false, message: permResult.error };
        }

        if (!input.content.trim()) {
            return { success: false, message: '댓글 내용을 입력해주세요.' };
        }

        // 불법 금지어 자체 필터링
        const { checkBadWords } = await import('@/lib/utils/bad-words');
        const contentCheck = await checkBadWords(input.content);
        if (contentCheck.hasBadWord) {
            return { success: false, message: `댓글에 불법/유해 금지어 [${contentCheck.word}]가 포함되어 사용할 수 없습니다.` };
        }

        const isAnonymous = permResult.data?.forceAnonymous || false;
        const authorName = isAnonymous ? '익명' : nickname;

        // Step 2: 댓글 저장 (OA)
        const { data: comment, error } = await supabaseAdmin
            .from('community_comments')
            .insert({
                post_id: input.post_id,
                parent_id: input.parent_id || null,
                user_id: userId,
                author_name: authorName,
                is_anonymous: isAnonymous,
                content: input.content.trim(),
            })
            .select()
            .single();

        if (error) {
            nvLog('AT', '❌ OA_INSERT_COMMUNITY_COMMENT 에러', error);
            return { success: false, message: '댓글 저장에 실패했습니다.' };
        }

        return { success: true, data: comment, message: '댓글이 등록되었습니다.' };

    } catch (err: any) {
        nvLog('AT', '❌ FA_CREATE_COMMUNITY_COMMENT 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

// ============================================
// FA: 게시글 조회수 1 증가
// ============================================
export async function incrementCommunityPostViewCount(postId: string) {
    nvLog('AT', '▶️ FA_INCREMENT_COMMUNITY_POST_VIEW_COUNT 시작', { postId });
    try {
        const { data, error } = await supabaseAdmin
            .from('community_posts')
            .select('view_count')
            .eq('id', postId)
            .single();

        if (error) {
            return { success: false, message: '게시글이 존재하지 않습니다.' };
        }

        const nextCount = (data?.view_count ?? 0) + 1;
        await supabaseAdmin
            .from('community_posts')
            .update({ view_count: nextCount })
            .eq('id', postId);

        return { success: true, view_count: nextCount };
    } catch (err: any) {
        nvLog('AT', '❌ FA_INCREMENT_COMMUNITY_POST_VIEW_COUNT 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

// ============================================
// FA: 잘못된 댓글 수 강제 동기화 (자가 치유)
// ============================================
export async function syncPostCommentCount(postId: string, actualCount: number) {
    nvLog('AT', '▶️ FA_SYNC_POST_COMMENT_COUNT 시작', { postId, actualCount });
    try {
        await supabaseAdmin
            .from('community_posts')
            .update({ comment_count: actualCount })
            .eq('id', postId);
        return { success: true };
    } catch (err: any) {
        nvLog('AT', '❌ FA_SYNC_POST_COMMENT_COUNT 예외', err);
        return { success: false, message: err?.message || '동기화 예외 발생' };
    }
}

