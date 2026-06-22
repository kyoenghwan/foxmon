'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserPosts, getUserComments } from '@/lib/actions/community';
import { Loader2, FileText, MessageSquare, Eye, Clock, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const BOARD_NAME_MAP: Record<string, string> = {
  free: '자유게시판',
  foxtalk: '폭스수다',
  foxmarket: '폭스장터',
  reviews: '업소후기',
  tips: '꿀팁·노하우',
  report: '업소제보',
  business: '업소장터',
  secret: '비밀게시판'
};

export default function ActivityClient() {
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [commentPage, setCommentPage] = useState(1);
  const [postTotal, setPostTotal] = useState(0);
  const [commentTotal, setCommentTotal] = useState(0);

  const limit = 10;

  const loadPosts = async (userId: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await getUserPosts(userId, pageNum, limit);
      if (res.success) {
        setPosts(res.posts);
        setPostTotal(res.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (userId: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await getUserComments(userId, pageNum, limit);
      if (res.success) {
        setComments(res.comments);
        setCommentTotal(res.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    if (activeTab === 'posts') {
      loadPosts(session.user.id, postPage);
    } else {
      loadComments(session.user.id, commentPage);
    }
  }, [session?.user?.id, activeTab, postPage, commentPage]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-8 text-center animate-in fade-in">
        <p className="text-gray-900 font-bold text-[16px] mb-2">로그인이 필요한 서비스입니다.</p>
        <p className="text-gray-400 text-xs font-medium mb-4">작성한 활동을 보시려면 먼저 로그인해 주세요.</p>
        <Link href="/login" className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95">
          로그인하러 가기
        </Link>
      </div>
    );
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const totalPages = activeTab === 'posts' ? Math.ceil(postTotal / limit) : Math.ceil(commentTotal / limit);
  const currentPage = activeTab === 'posts' ? postPage : commentPage;
  const setCurrentPage = activeTab === 'posts' ? setPostPage : setCommentPage;

  return (
    <div className="space-y-6">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          내가 쓴 글 {postTotal > 0 && `(${postTotal})`}
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'comments'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          내가 쓴 댓글 {commentTotal > 0 && `(${commentTotal})`}
        </button>
      </div>

      {/* 로딩 표시 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500 font-medium">활동 내역을 불러오는 중...</p>
        </div>
      ) : activeTab === 'posts' ? (
        posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-8 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-gray-900 font-bold text-[16px] mb-1">작성한 글이 없습니다.</p>
            <p className="text-gray-400 text-xs font-medium mb-4">커뮤니티 게시판에 첫 글을 남겨보세요.</p>
            <Link href="/community" className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95">
              커뮤니티 바로가기
            </Link>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200/60">
                      {BOARD_NAME_MAP[post.board_id] || '게시판'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(post.created_at)}
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 text-[15px] sm:text-[17px] tracking-tight truncate mb-1">
                    <Link href={`/community/${post.board_id}/${post.id}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-1 break-all font-medium">
                    {post.content.replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-end sm:justify-start border-t sm:border-t-0 border-gray-50 pt-2 sm:pt-0 text-xs text-gray-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-gray-400" /> {post.view_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    <MessageCircle className="w-3.5 h-3.5" /> {post.comment_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-8 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-gray-900 font-bold text-[16px] mb-1">작성한 댓글이 없습니다.</p>
          <p className="text-gray-400 text-xs font-medium mb-4">커뮤니티 글물에 첫 댓글을 남겨보세요.</p>
          <Link href="/community" className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95">
            커뮤니티 바로가기
          </Link>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 sm:p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-300 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200/60">
                  작성한 댓글
                </span>
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-800 break-words leading-relaxed">
                {comment.content}
              </p>
              {comment.post && (
                <div className="mt-1 p-3 bg-gray-50/80 rounded-xl border border-gray-100/80">
                  <span className="text-[10px] font-black text-gray-400 block mb-0.5">원문 게시글</span>
                  <Link
                    href={`/community/${comment.post.board_id}/${comment.post_id}`}
                    className="text-xs font-black text-gray-600 hover:text-primary transition-colors line-clamp-1"
                  >
                    {comment.post.title}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-primary text-white shadow-md shadow-orange-500/10'
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
