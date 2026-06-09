'use client';

import React, { useState } from 'react';
import { Trash2, ExternalLink, AlertCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { adminCommunityAction } from '@/lib/actions';
import Link from 'next/link';
import { WritePostModal } from '@/components/community/WritePostModal';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

export function CommunityClientWrapper({ initialPosts }: { initialPosts: any[] }) {
    const [posts, setPosts] = useState(initialPosts);
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [writeBoardId, setWriteBoardId] = useState<string>('free');
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm('이 게시글을 정말 삭제하시겠습니까? (복구 불가)')) return;
        
        const res = await adminCommunityAction('DELETE', id);
        if (res.success) {
            setPosts(posts.filter((p) => p.id !== id));
        } else {
            alert(res.message || '삭제에 실패했습니다.');
        }
    };

    const getBoardName = (boardId: string) => {
        switch (boardId) {
            case 'notice': return '공지사항';
            case 'event': return '이벤트';
            case 'foxtalk': return '폭스수다';
            case 'foxmarket': return '폭스중고';
            case 'business': return '업소장터';
            case 'reviews': return '업소후기·제보';
            case 'tips': return '꿀팁·노하우';
            default: return boardId;
        }
    };

    return (
        <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">총 <span className="text-primary">{posts.length}</span>개의 게시글</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/fox-office/help"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-black text-[13px] rounded-xl hover:bg-gray-800 transition-all shadow-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        공지·이벤트 작성 (고객센터)
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[12px] font-bold text-gray-600">
                            <tr>
                                <th className="p-4 w-12 text-center">No</th>
                                <th className="p-4">게시판</th>
                                <th className="p-4 w-1/2">제목 및 내용 (미리보기)</th>
                                <th className="p-4">작성자</th>
                                <th className="p-4 text-center">작성일</th>
                                <th className="p-4 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {posts.map((post: any, idx: number) => (
                                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-center font-medium text-gray-500 text-[13px]">{idx + 1}</td>
                                    <td className="p-4">
                                        <Badge variant="outline" className={`${post.board_id === 'notice' ? 'border-red-200 text-red-600 bg-red-50' : 'border-gray-200 text-gray-600 bg-gray-50'} text-[11px]`}>
                                            {getBoardName(post.board_id)}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="max-w-md overflow-hidden">
                                            <div className="font-bold text-gray-900 text-[14px] flex items-center gap-2">
                                                {post.is_hot && <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-black">HOT</span>}
                                                <span className="truncate">{post.title}</span>
                                            </div>
                                            <div className="text-[12px] text-gray-400 mt-1 truncate">
                                                {post.content?.replace(/<[^>]*>?/gm, '')}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-gray-500">{post.author_name.charAt(0)}</span>
                                            </div>
                                            <span className="text-[13px] font-bold text-gray-700">{post.author_name} {post.is_anonymous && '(익명)'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-gray-500 font-medium text-[12px]">
                                        {format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <Link 
                                                href={`/community?tab=${post.board_id}`} 
                                                target="_blank"
                                                className="p-1.5 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                                title="게시판 보기"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                            <button 
                                                onClick={() => {
                                                    setEditingPost(post);
                                                    setWriteBoardId(post.board_id);
                                                    setIsWriteModalOpen(true);
                                                }}
                                                className="p-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                title="수정"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(post.id)}
                                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                                title="강제 삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {posts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center text-gray-500 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-gray-400" />
                                            </div>
                                            작성된 커뮤니티 게시글이 없습니다.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <WritePostModal 
                boardId={writeBoardId}
                boardLabel={getBoardName(writeBoardId)}
                isOpen={isWriteModalOpen}
                editPost={editingPost}
                onClose={() => {
                    setIsWriteModalOpen(false);
                    setEditingPost(null);
                }}
                onSuccess={() => {
                    setIsWriteModalOpen(false);
                    setEditingPost(null);
                    router.refresh();
                }}
            />
        </div>
    );
}
