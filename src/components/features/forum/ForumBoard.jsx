"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Eye, Plus, X, Loader2 } from 'lucide-react';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function ForumBoard() {
  const { user, openLoginModal } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Lấy bài viết từ Supabase
  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*, profiles(display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast.error('Không thể tải bài viết. Vui lòng thử lại!');
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    // Realtime: tự cập nhật khi có bài mới
    const channel = supabase
      .channel('forum_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts' }, async (payload) => {
        // Lấy thêm thông tin profile
        const { data: post } = await supabase
          .from('forum_posts')
          .select('*, profiles(display_name, avatar_url)')
          .eq('id', payload.new.id)
          .single();
        if (post) setPosts(prev => [post, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handlePost = async () => {
    if (!user) {
      openLoginModal('Bạn cần đăng nhập để đăng bài!');
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Vui lòng nhập đầy đủ Tiêu đề và Nội dung!");
      return;
    }

    setIsPosting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi không xác định');
      }

      setNewTitle("");
      setNewContent("");
      setIsModalOpen(false);
      toast.success("Đăng bài viết thành công!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-binance-light)] flex items-center gap-3">
            <MessageSquare className="text-[var(--color-binance-yellow)]" size={32} />
            Diễn Đàn Trao Đổi
          </h1>
          <p className="text-[var(--color-binance-gray)] mt-2">
            Nơi giao lưu, chia sẻ kinh nghiệm và kịch bản hay cùng cộng đồng.
          </p>
        </div>
        <Button variant="primary" onClick={() => user ? setIsModalOpen(true) : openLoginModal('Đăng nhập để đăng bài viết!')} className="flex items-center gap-2">
          <Plus size={18} /> Đăng bài mới
        </Button>
      </div>

      {/* Danh sách bài */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={36} className="animate-spin text-[var(--color-binance-yellow)]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-binance-gray)]">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Chưa có bài viết nào</p>
          <p className="text-sm mt-1">Hãy là người đầu tiên chia sẻ!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const displayName = post.profiles?.display_name || 'Ẩn danh';
            const avatarUrl = post.profiles?.avatar_url;
            return (
              <div key={post.id} className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-xl p-5 hover:border-[var(--color-binance-gray)] transition-colors cursor-pointer group">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[var(--color-binance-dark)] rounded-full flex items-center justify-center border border-[var(--color-binance-border)] flex-shrink-0 overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} className="w-full h-full object-cover" alt={displayName} />
                      : <span className="text-xl">{displayName.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--color-binance-light)] group-hover:text-[var(--color-binance-yellow)] transition-colors line-clamp-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-binance-gray)] mt-1 mb-2">
                      <span className="font-medium text-[var(--color-binance-light)]">{displayName}</span>
                      <span>•</span>
                      <span>{formatTime(post.created_at)}</span>
                    </div>
                    <p className="text-sm text-[var(--color-binance-gray)] line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--color-binance-border)] text-xs text-[var(--color-binance-gray)] font-medium">
                  <div className="flex items-center gap-1.5 hover:text-[var(--color-binance-light)] transition-colors">
                    <Eye size={16} /> {post.views_count ?? 0}
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-pink-500 transition-colors">
                    <Heart size={16} /> {post.likes_count ?? 0}
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-[var(--color-binance-yellow)] transition-colors">
                    <MessageSquare size={16} /> Bình luận
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal đăng bài */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-binance-border)]">
              <h3 className="text-xl font-bold text-[var(--color-binance-light)]">Đăng bài viết mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-binance-gray)] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-binance-gray)] mb-2">Tiêu đề bài viết</label>
                <input
                  type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thật kêu để thu hút người xem..."
                  className="w-full bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-4 py-3 text-[var(--color-binance-light)] focus:border-[var(--color-binance-yellow)] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-binance-gray)] mb-2">Nội dung chia sẻ</label>
                <textarea
                  value={newContent} onChange={e => setNewContent(e.target.value)}
                  placeholder="Chia sẻ kinh nghiệm, kịch bản hoặc đặt câu hỏi tại đây..."
                  rows={6}
                  className="w-full bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-4 py-3 text-[var(--color-binance-light)] focus:border-[var(--color-binance-yellow)] outline-none resize-none transition-colors"
                />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--color-binance-border)] flex justify-end gap-3 bg-[var(--color-binance-dark)] rounded-b-2xl">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button variant="primary" onClick={handlePost} disabled={isPosting} className="flex items-center gap-2">
                {isPosting && <Loader2 size={16} className="animate-spin" />}
                {isPosting ? 'Đang đăng...' : 'Đăng bài'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
