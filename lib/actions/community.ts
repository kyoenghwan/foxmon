'use server';

import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
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

        const { data, error } = await supabase
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
            return { success: false, message: '게시글 저장에 실패했습니다.' };
        }

        nvLog('AT', '✅ FA_CREATE_COMMUNITY_POST 완료', { postId: data.id });
        return { success: true, data, message: '게시글이 등록되었습니다.' };

    } catch (err) {
        nvLog('AT', '❌ FA_CREATE_COMMUNITY_POST 예외', err);
        return { success: false, message: '시스템 오류가 발생했습니다.' };
    }
}
