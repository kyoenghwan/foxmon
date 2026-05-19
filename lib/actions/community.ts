'use server';

import { auth } from '@/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { RA_CHECK_BOARD_PERMISSION } from '@/src/atoms/ra/community/RA_CHECK_BOARD_PERMISSION';
import { RA_VALIDATE_POST_INPUT } from '@/src/atoms/ra/community/RA_VALIDATE_POST_INPUT';

// ============================================
// QA: 게시판별 게시글 목록 조회
// ============================================
export async function getCommunityPosts(boardId: string, page: number = 1, limit: number = 20) {
    nvLog('AT', '▶️ QA_GET_COMMUNITY_POSTS', { boardId, page, limit });

    try {
        const offset = (page - 1) * limit;

        // 전체 건수
        const { count } = await supabase
            .from('community_posts')
            .select('*', { count: 'exact', head: true })
            .eq('board_id', boardId);

        // 게시글 목록 (HOT 우선, 최신순)
        const { data, error } = await supabase
            .from('community_posts')
            .select('*')
            .eq('board_id', boardId)
            .order('is_hot', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            nvLog('AT', '❌ QA_GET_COMMUNITY_POSTS 에러', error);
            return { posts: [], total: 0 };
        }

        return { posts: data || [], total: count || 0 };
    } catch (err) {
        nvLog('AT', '❌ QA_GET_COMMUNITY_POSTS 예외', err);
        return { posts: [], total: 0 };
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
            })
            .select()
            .single();

        if (error) {
            nvLog('AT', '❌ OA_INSERT_COMMUNITY_POST 에러', error);
            return { success: false, message: `게시글 저장에 실패했습니다. (${error.message || JSON.stringify(error)})` };
        }

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
        const { data, error } = await supabase
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

        // Step 3: 원본 게시글의 댓글 수 증가
        // (트리거가 없으므로 서버 액션에서 수동 업데이트)
        const { data: post } = await supabaseAdmin
            .from('community_posts')
            .select('comment_count')
            .eq('id', input.post_id)
            .single();

        const currentCount = post?.comment_count || 0;
        await supabaseAdmin
            .from('community_posts')
            .update({ comment_count: currentCount + 1 })
            .eq('id', input.post_id);

        return { success: true, data: comment, message: '댓글이 등록되었습니다.' };

    } catch (err: any) {
        nvLog('AT', '❌ FA_CREATE_COMMUNITY_COMMENT 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

