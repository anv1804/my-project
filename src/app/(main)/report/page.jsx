"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, FileText, Image as ImageIcon, Video, Home, ArrowLeft } from "lucide-react";
import Button from "@/components/common/Button";
import toast from "react-hot-toast";

export default function ReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("reup_workflow_data");
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading session storage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopyAll = () => {
    if (!data) return;
    const finalContent = `${data.title || ""}\n\n${data.hashtags || ""}`.trim();
    navigator.clipboard.writeText(finalContent);
    toast.success("Đã sao chép toàn bộ nội dung!");
  };

  if (loading) {
    return <div className="min-h-[80vh] flex items-center justify-center text-[var(--color-binance-gray)]">Đang tải báo cáo...</div>;
  }

  if (!data || !data.video) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <FileText size={64} className="text-[var(--color-binance-gray)]/30 mb-6" />
        <h1 className="text-2xl font-bold text-[var(--color-binance-light)] mb-3">Không tìm thấy dữ liệu Reup</h1>
        <p className="text-[var(--color-binance-gray)] mb-8">Bạn cần thực hiện luồng Tải Video ➡️ Đổi MD5 ➡️ Tiêu đề ➡️ Hashtag để xem báo cáo.</p>
        <Link href="/tiktok-downloader">
          <Button variant="primary" className="px-8">Bắt đầu luồng mới</Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 min-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4 mb-8">
        <Link href="/tiktok-hashtag">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-binance-light)] flex items-center gap-3">
            <FileText className="text-[var(--color-binance-yellow)]" /> Báo Cáo Reup Tổng Hợp
          </h1>
          <p className="text-[var(--color-binance-gray)] text-sm mt-1">
            Tổng hợp toàn bộ dữ liệu bạn đã tạo trong luồng vừa rồi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột 1: Thông tin Video Gốc & MD5 */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[var(--color-binance-yellow)] text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              BƯỚC 1 & 2
            </div>
            
            <h3 className="font-semibold text-[var(--color-binance-light)] mb-4 flex items-center gap-2">
              <Video size={16} className="text-[var(--color-binance-gray)]" /> Nguồn Video
            </h3>
            
            <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden border border-[var(--color-binance-border)] mb-4 w-full max-w-[200px] mx-auto">
              {data.video.videoUrl ? (
                <video src={data.video.videoUrl} poster={data.video.thumbnail} className="w-full h-full object-cover" controls />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-binance-gray)]/50">
                  <ImageIcon size={48} />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-[13px] font-medium text-[var(--color-binance-light)] truncate px-2">{data.video.title}</p>
              <p className="text-[12px] text-[var(--color-binance-gray)] mt-1">Tác giả: <span className="text-[var(--color-binance-yellow)]">{data.video.author}</span></p>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--color-binance-border)] flex items-center justify-center gap-2">
              {data.md5 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-binance-success)]/10 text-[var(--color-binance-success)] text-xs rounded-full border border-[var(--color-binance-success)]/20">
                  <CheckCircle2 size={14} /> Đã lách MD5 an toàn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">
                  Chưa xử lý MD5
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cột 2 & 3: Nội dung đăng */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl p-6 shadow-xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 bg-[var(--color-binance-yellow)] text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              BƯỚC 3 & 4
            </div>
            
            <h3 className="font-semibold text-[var(--color-binance-light)] mb-6 flex items-center gap-2">
              <FileText size={16} className="text-[var(--color-binance-gray)]" /> Dữ liệu Đăng tải (Caption)
            </h3>

            <div className="flex-1 flex flex-col gap-6">
              
              {/* Tiêu đề */}
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-[var(--color-binance-gray)] mb-2">
                  Tiêu đề (Title)
                </label>
                <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-md p-4 min-h-[60px] text-[15px] text-[var(--color-binance-light)] font-medium">
                  {data.title || <span className="text-[var(--color-binance-gray)] italic">Chưa tạo tiêu đề...</span>}
                </div>
              </div>

              {/* Hashtag */}
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-[var(--color-binance-gray)] mb-2">
                  Bộ Hashtag
                </label>
                <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-md p-4 min-h-[80px] text-[15px] text-[var(--color-binance-light)] font-mono leading-relaxed">
                  {data.hashtags || <span className="text-[var(--color-binance-gray)] italic">Chưa tạo hashtag...</span>}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-[var(--color-binance-border)] flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleCopyAll}
                variant="primary" 
                className="flex-1 h-12 flex items-center justify-center gap-2 text-[15px]"
                disabled={!data.title && !data.hashtags}
              >
                <Copy size={18} /> Sao chép toàn bộ Mô tả (Caption)
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto h-12 flex items-center justify-center gap-2 px-6">
                  <Home size={18} /> Về Trang chủ
                </Button>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
