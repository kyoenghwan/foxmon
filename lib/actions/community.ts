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

        // --- 활동 포인트 적립 연동 (1일 최대 5회) ---
        try {
            const kstOffset = 9 * 60 * 60 * 1000;
            const nowKst = new Date(Date.now() + kstOffset);
            
            const todayStartKst = new Date(nowKst);
            todayStartKst.setUTCHours(0, 0, 0, 0);
            const todayStartUtc = new Date(todayStartKst.getTime() - kstOffset);
            
            const todayEndKst = new Date(nowKst);
            todayEndKst.setUTCHours(23, 59, 59, 999);
            const todayEndUtc = new Date(todayEndKst.getTime() - kstOffset);

            const { count: postCount } = await supabaseAdmin
                .from('activity_point_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('type', 'POST')
                .gte('created_at', todayStartUtc.toISOString())
                .lte('created_at', todayEndUtc.toISOString());

            let writeAmt = 50;
            let dailyPostLimit = 5;
            try {
                const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
                const policiesRes = await GET_POINT_POLICIES();
                if (policiesRes.success && policiesRes.data) {
                    const policyAmt = policiesRes.data.find((p: any) => p.config_key === 'ACTIVITY_POST_WRITE');
                    const policyLimit = policiesRes.data.find((p: any) => p.config_key === 'LIMIT_DAILY_POST_COUNT');
                    if (policyAmt) writeAmt = policyAmt.config_value;
                    if (policyLimit) dailyPostLimit = policyLimit.config_value;
                }
            } catch (err: any) {
                nvLog('AT', '⚠️ 글쓰기 포인트/한도 정책 조회 실패, 기본값 사용', err?.message);
            }

            const contentLen = (input.content || '').trim().length;
            if (contentLen >= 5 && postCount !== null && postCount < dailyPostLimit) {
                await supabaseAdmin.rpc('process_activity_point', {
                    p_user_id: userId,
                    p_type: 'POST',
                    p_amount: writeAmt,
                    p_description: `커뮤니티 글 작성 보너스 적립 (글번호: ${data.id})`
                });
            } else if (contentLen < 5) {
                nvLog('AT', `ℹ️ 본문 글자수 부족 (${contentLen}자), 포인트 적립 대상 제외`);
            }
        } catch (ptError) {
            nvLog('AT', '⚠️ 글 작성 활동 포인트 적립 중 예외 발생 (무시)', ptError);
        }
        // ------------------------------------------

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

        // --- 활동 포인트 적립 연동 (1일 최대 10회) ---
        try {
            const kstOffset = 9 * 60 * 60 * 1000;
            const nowKst = new Date(Date.now() + kstOffset);
            
            const todayStartKst = new Date(nowKst);
            todayStartKst.setUTCHours(0, 0, 0, 0);
            const todayStartUtc = new Date(todayStartKst.getTime() - kstOffset);
            
            const todayEndKst = new Date(nowKst);
            todayEndKst.setUTCHours(23, 59, 59, 999);
            const todayEndUtc = new Date(todayEndKst.getTime() - kstOffset);

            const { count: commentCount } = await supabaseAdmin
                .from('activity_point_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('type', 'COMMENT')
                .gte('created_at', todayStartUtc.toISOString())
                .lte('created_at', todayEndUtc.toISOString());

            let commentAmt = 10;
            let dailyCommentLimit = 10;
            try {
                const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
                const policiesRes = await GET_POINT_POLICIES();
                if (policiesRes.success && policiesRes.data) {
                    const policyAmt = policiesRes.data.find((p: any) => p.config_key === 'ACTIVITY_COMMENT_WRITE');
                    const policyLimit = policiesRes.data.find((p: any) => p.config_key === 'LIMIT_DAILY_COMMENT_COUNT');
                    if (policyAmt) commentAmt = policyAmt.config_value;
                    if (policyLimit) dailyCommentLimit = policyLimit.config_value;
                }
            } catch (err: any) {
                nvLog('AT', '⚠️ 댓글 포인트/한도 정책 조회 실패, 기본값 사용', err?.message);
            }

            if (commentCount !== null && commentCount < dailyCommentLimit) {
                await supabaseAdmin.rpc('process_activity_point', {
                    p_user_id: userId,
                    p_type: 'COMMENT',
                    p_amount: commentAmt,
                    p_description: `커뮤니티 댓글 작성 보너스 적립 (댓글번호: ${comment.id})`
                });
            }
        } catch (ptError) {
            nvLog('AT', '⚠️ 댓글 작성 활동 포인트 적립 중 예외 발생 (무시)', ptError);
        }
        // ------------------------------------------

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

// ============================================
// QA: 사용자 활동 개수 조회 (글, 댓글 수)
// ============================================
export async function getUserActivityCounts(userId: string) {
    nvLog('AT', '▶️ QA_GET_USER_ACTIVITY_COUNTS', { userId });
    try {
        const [postsRes, commentsRes] = await Promise.all([
            supabaseAdmin
                .from('community_posts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId),
            supabaseAdmin
                .from('community_comments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
        ]);

        return {
            success: true,
            postCount: (postsRes.count || 0) + (commentsRes.count || 0),
            commentCount: commentsRes.count || 0
        };
    } catch (err) {
        nvLog('AT', '❌ QA_GET_USER_ACTIVITY_COUNTS 예외', err);
        return { success: false, postCount: 0, commentCount: 0 };
    }
}

// 세션 기반 활동 카운트 조회 (userId 자동 처리)
export async function getMyActivityCounts() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, postCount: 0, commentCount: 0 };
    }
    return getUserActivityCounts(session.user.id);
}

// ============================================
// QA: 사용자가 작성한 글 목록 조회
// ============================================
export async function getUserPosts(userId: string, page: number = 1, limit: number = 20) {
    nvLog('AT', '▶️ QA_GET_USER_POSTS', { userId, page, limit });
    try {
        const offset = (page - 1) * limit;
        const { data, error, count } = await supabaseAdmin
            .from('community_posts')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            nvLog('AT', '❌ QA_GET_USER_POSTS 에러', error);
            return { success: false, posts: [], total: 0 };
        }

        return { success: true, posts: data || [], total: count || 0 };
    } catch (err) {
        nvLog('AT', '❌ QA_GET_USER_POSTS 예외', err);
        return { success: false, posts: [], total: 0 };
    }
}

// ============================================
// QA: 사용자가 작성한 댓글 목록 조회 (조인 포함)
// ============================================
export async function getUserComments(userId: string, page: number = 1, limit: number = 20) {
    nvLog('AT', '▶️ QA_GET_USER_COMMENTS', { userId, page, limit });
    try {
        const offset = (page - 1) * limit;
        const { data, error, count } = await supabaseAdmin
            .from('community_comments')
            .select('*, post:community_posts(title, board_id)', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            nvLog('AT', '❌ QA_GET_USER_COMMENTS 에러', error);
            return { success: false, comments: [], total: 0 };
        }

        return { success: true, comments: data || [], total: count || 0 };
    } catch (err) {
        nvLog('AT', '❌ QA_GET_USER_COMMENTS 예외', err);
        return { success: false, comments: [], total: 0 };
    }
}

// ============================================
// FA: 사용자 게시글 삭제 Flow (시간 기반 포인트 환불 제한 포함)
// ============================================
export async function deleteCommunityPost(postId: string) {
    nvLog('AT', '▶️ FA_DELETE_COMMUNITY_POST 시작', { postId });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        const userId = session.user.id;
        const userRole = (session.user as any).role || 'USER';
        const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

        // 1. 게시글 상세 조회
        const { data: post, error: getError } = await supabaseAdmin
            .from('community_posts')
            .select('*')
            .eq('id', postId)
            .maybeSingle();

        if (getError || !post) {
            return { success: false, message: '게시글을 찾을 수 없습니다.' };
        }

        // 본인 글이 아니고 관리자도 아니라면 차단
        if (post.user_id !== userId && !isAdmin) {
            return { success: false, message: '게시글 삭제 권한이 없습니다.' };
        }

        // 2. 최종 교환 승인 완료 시각 조회
        const { data: latestApprovedRequest } = await supabaseAdmin
            .from('gift_card_requests')
            .select('processed_at, created_at')
            .eq('user_id', post.user_id)
            .eq('status', 'APPROVED')
            .order('processed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let isBeforeCutoff = false;
        if (latestApprovedRequest) {
            const cutoffTime = new Date(latestApprovedRequest.processed_at || latestApprovedRequest.created_at).getTime();
            const postTime = new Date(post.created_at).getTime();

            // 교환 완료 시점 이전에 작성된 글인지 검증
            if (postTime <= cutoffTime) {
                isBeforeCutoff = true;
            }
        }

        // 3. 포인트 회수 처리 (이전 적립 내역 확인) - 교환 완료 시점 이후(미래)에 쓴 글만 포인트 차감 진행
        if (!isBeforeCutoff) {
            try {
                const { data: txRecord } = await supabaseAdmin
                    .from('activity_point_transactions')
                    .select('amount')
                    .eq('user_id', post.user_id)
                    .eq('type', 'POST')
                    .like('description', `%글번호: ${postId}%`)
                    .maybeSingle();

                if (txRecord && txRecord.amount > 0) {
                    nvLog('AT', '💡 글 삭제에 따른 포인트 회수 진행', { userId: post.user_id, amount: txRecord.amount });
                    await supabaseAdmin.rpc('process_activity_point', {
                        p_user_id: post.user_id,
                        p_type: 'POST_DELETE',
                        p_amount: -txRecord.amount,
                        p_description: `커뮤니티 글 삭제에 따른 보너스 포인트 회수 (글번호: ${postId})`
                    });
                }
            } catch (ptErr) {
                nvLog('AT', '⚠️ 글 삭제 포인트 회수 처리 중 오류 발생 (무시)', ptErr);
            }
        } else {
            nvLog('AT', 'ℹ️ 교환 완료 시점 이전에 작성된 글이므로 포인트 회수(차감) 없이 삭제만 수행');
        }

        // 4. 삭제 쿼리 실행
        const { error: deleteError } = await supabaseAdmin
            .from('community_posts')
            .delete()
            .eq('id', postId);

        if (deleteError) {
            nvLog('AT', '❌ 게시글 삭제 실패', deleteError);
            return { success: false, message: '게시글 삭제에 실패했습니다.' };
        }

        // 캐시 무효화
        const keysToInvalidate = Object.keys(communityCache).filter(key => key.startsWith(`${post.board_id}_`));
        keysToInvalidate.forEach(key => {
            delete communityCache[key];
        });

        nvLog('AT', '✅ 게시글 삭제 완료', { postId });
        return { success: true, message: '게시글이 삭제되었습니다.' };

    } catch (err: any) {
        nvLog('AT', '❌ FA_DELETE_COMMUNITY_POST 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

// ============================================
// FA: 사용자 댓글 삭제 Flow (시간 기반 포인트 환불 제한 포함)
// ============================================
export async function deleteCommunityComment(commentId: string) {
    nvLog('AT', '▶️ FA_DELETE_COMMUNITY_COMMENT 시작', { commentId });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        const userId = session.user.id;
        const userRole = (session.user as any).role || 'USER';
        const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

        // 1. 댓글 상세 조회
        const { data: comment, error: getError } = await supabaseAdmin
            .from('community_comments')
            .select('*')
            .eq('id', commentId)
            .maybeSingle();

        if (getError || !comment) {
            return { success: false, message: '댓글을 찾을 수 없습니다.' };
        }

        // 본인 댓글이 아니고 관리자도 아니라면 차단
        if (comment.user_id !== userId && !isAdmin) {
            return { success: false, message: '댓글 삭제 권한이 없습니다.' };
        }

        // 2. 최종 교환 승인 완료 시각 조회
        const { data: latestApprovedRequest } = await supabaseAdmin
            .from('gift_card_requests')
            .select('processed_at, created_at')
            .eq('user_id', comment.user_id)
            .eq('status', 'APPROVED')
            .order('processed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let isBeforeCutoff = false;
        if (latestApprovedRequest) {
            const cutoffTime = new Date(latestApprovedRequest.processed_at || latestApprovedRequest.created_at).getTime();
            const commentTime = new Date(comment.created_at).getTime();

            // 교환 완료 시점 이전에 작성된 댓글인지 검증
            if (commentTime <= cutoffTime) {
                isBeforeCutoff = true;
            }
        }

        // 3. 포인트 회수 처리 (이전 적립 내역 확인) - 교환 완료 시점 이후(미래)에 쓴 댓글만 포인트 차감 진행
        if (!isBeforeCutoff) {
            try {
                const { data: txRecord } = await supabaseAdmin
                    .from('activity_point_transactions')
                    .select('amount')
                    .eq('user_id', comment.user_id)
                    .eq('type', 'COMMENT')
                    .like('description', `%댓글번호: ${commentId}%`)
                    .maybeSingle();

                if (txRecord && txRecord.amount > 0) {
                    nvLog('AT', '💡 댓글 삭제에 따른 포인트 회수 진행', { userId: comment.user_id, amount: txRecord.amount });
                    await supabaseAdmin.rpc('process_activity_point', {
                        p_user_id: comment.user_id,
                        p_type: 'COMMENT_DELETE',
                        p_amount: -txRecord.amount,
                        p_description: `커뮤니티 댓글 삭제에 따른 보너스 포인트 회수 (댓글번호: ${commentId})`
                    });
                }
            } catch (ptErr) {
                nvLog('AT', '⚠️ 댓글 삭제 포인트 회수 처리 중 오류 발생 (무시)', ptErr);
            }
        } else {
            nvLog('AT', 'ℹ️ 교환 완료 시점 이전에 작성된 댓글이므로 포인트 회수(차감) 없이 삭제만 수행');
        }

        // 4. 삭제 쿼리 실행
        const { error: deleteError } = await supabaseAdmin
            .from('community_comments')
            .delete()
            .eq('id', commentId);

        if (deleteError) {
            nvLog('AT', '❌ 댓글 삭제 실패', deleteError);
            return { success: false, message: '댓글 삭제에 실패했습니다.' };
        }

        // 5. 게시글 댓글 카운트 자가 동기화
        try {
            const { data: remains } = await supabaseAdmin
                .from('community_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', comment.post_id);
            
            await supabaseAdmin
                .from('community_posts')
                .update({ comment_count: remains?.length || 0 })
                .eq('id', comment.post_id);
        } catch (syncErr) {
            nvLog('AT', '⚠️ 댓글 삭제 후 카운트 동기화 예외 발생', syncErr);
        }

        nvLog('AT', '✅ 댓글 삭제 완료', { commentId });
        return { success: true, message: '댓글이 삭제되었습니다.' };

    } catch (err: any) {
        nvLog('AT', '❌ FA_DELETE_COMMUNITY_COMMENT 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

// ============================================
// FA: 게시글 공감(좋아요) 토글 Flow (보상 포인트 연동)
// ============================================
export async function toggleCommunityPostLike(postId: string) {
    nvLog('AT', '▶️ FA_TOGGLE_COMMUNITY_POST_LIKE 시작', { postId });
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        const userId = session.user.id;

        // 1. 게시글 상세 조회
        const { data: post, error: getError } = await supabaseAdmin
            .from('community_posts')
            .select('*')
            .eq('id', postId)
            .maybeSingle();

        if (getError || !post) {
            return { success: false, message: '게시글을 찾을 수 없습니다.' };
        }

        // 2. 이미 좋아요 했는지 체크
        const { data: existingLike } = await supabaseAdmin
            .from('community_post_likes')
            .select('*')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .maybeSingle();

        let liked = false;
        let nextCount = post.like_count || 0;

        // 3. 좋아요 보상 정책 조회
        let likeAmt = 100;
        try {
            const { GET_POINT_POLICIES } = await import('@/app/actions/pointPolicyActions');
            const policiesRes = await GET_POINT_POLICIES();
            if (policiesRes.success && policiesRes.data) {
                const policy = policiesRes.data.find((p: any) => p.config_key === 'ACTIVITY_POST_LIKE_RECEIVED');
                if (policy) likeAmt = policy.config_value;
            }
        } catch (err: any) {
            nvLog('AT', '⚠️ 공감 보상 정책 조회 실패, 기본값 사용', err?.message);
        }

        if (!existingLike) {
            // 좋아요 추가
            const { error: insertError } = await supabaseAdmin
                .from('community_post_likes')
                .insert({ user_id: userId, post_id: postId });

            if (insertError) {
                nvLog('AT', '❌ 좋아요 레코드 생성 실패', insertError);
                return { success: false, message: '공감 처리에 실패했습니다.' };
            }

            liked = true;
            nextCount += 1;

            // 게시글 count 업데이트
            await supabaseAdmin
                .from('community_posts')
                .update({ like_count: nextCount })
                .eq('id', postId);

            // 본인 글이 아닐 경우 포인트 적립 연동
            if (post.user_id !== userId) {
                await supabaseAdmin.rpc('process_activity_point', {
                    p_user_id: post.user_id,
                    p_type: 'LIKE_RECEIVED',
                    p_amount: likeAmt,
                    p_description: `게시글이 공감(좋아요)을 받아 보너스 포인트 적립 (글번호: ${postId})`
                });
            }
        } else {
            // 좋아요 취소
            const { error: deleteError } = await supabaseAdmin
                .from('community_post_likes')
                .delete()
                .eq('user_id', userId)
                .eq('post_id', postId);

            if (deleteError) {
                nvLog('AT', '❌ 좋아요 레코드 삭제 실패', deleteError);
                return { success: false, message: '공감 취소에 실패했습니다.' };
            }

            liked = false;
            nextCount = Math.max(0, nextCount - 1);

            // 게시글 count 업데이트
            await supabaseAdmin
                .from('community_posts')
                .update({ like_count: nextCount })
                .eq('id', postId);

            // 본인 글이 아닐 경우 포인트 회수 차감 연동
            if (post.user_id !== userId) {
                await supabaseAdmin.rpc('process_activity_point', {
                    p_user_id: post.user_id,
                    p_type: 'LIKE_CANCELED',
                    p_amount: -likeAmt,
                    p_description: `게시글 공감(좋아요) 취소로 인한 보너스 포인트 회수 (글번호: ${postId})`
                });
            }
        }

        // 캐시 무효화
        const keysToInvalidate = Object.keys(communityCache).filter(key => key.startsWith(`${post.board_id}_`));
        keysToInvalidate.forEach(key => {
            delete communityCache[key];
        });

        return { success: true, liked, likeCount: nextCount };

    } catch (err: any) {
        nvLog('AT', '❌ FA_TOGGLE_COMMUNITY_POST_LIKE 예외', err);
        return { success: false, message: `시스템 오류가 발생했습니다. (${err?.message || ''})` };
    }
}

// ============================================
// QA: 특정 게시글에 대한 로그인 사용자의 공감(좋아요) 여부 조회
// ============================================
export async function checkCommunityPostLiked(postId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: true, liked: false };
        }

        const userId = session.user.id;
        const { data, error } = await supabaseAdmin
            .from('community_post_likes')
            .select('*')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .maybeSingle();

        if (error) {
            return { success: false, liked: false };
        }

        return { success: true, liked: !!data };
    } catch (err) {
        return { success: false, liked: false };
    }
}




