"use client";

import { useState } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import { Heart, MessageCircle, Share2, Eye, User, Calendar, ArrowRight, Video } from "lucide-react";
import Link from "next/link";

export default function TiktokDownloaderBox() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownload = async () => {
    if (!url.trim()) {
      toast.error("Vui lòng nhập đường dẫn video!");
      return;
    }
    
    try {
      new URL(url);
    } catch {
      toast.error("Đường dẫn không hợp lệ. Vui lòng nhập đúng định dạng http/https!");
      return;
    }

    if (!url.includes("tiktok.com") && !url.includes("douyin.com")) {
      toast.error("Chỉ hỗ trợ tải video từ TikTok hoặc Douyin!");
      return;
    }
    
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi tải video.");
      }

      setResult(data);
      sessionStorage.setItem("reup_workflow_data", JSON.stringify({ video: data }));
      toast.success("Bóc tách video thành công!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input 
          placeholder="Dán link video TikTok / Douyin vào đây..." 
          className="flex-1"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
        />
        <Button 
          variant="primary" 
          className="sm:w-32 w-full"
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Tải ngay"}
        </Button>
      </div>

      {result && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-bold text-[var(--color-binance-light)] mb-4 flex items-center gap-2 border-b border-[var(--color-binance-border)] pb-2">
            <Video size={20} className="text-[var(--color-binance-yellow)]" /> Thông tin Video
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Cột 1: Video Demo */}
            <div className="md:col-span-1 bg-black rounded-lg overflow-hidden border border-[var(--color-binance-border)] flex items-center justify-center relative aspect-[9/16] max-h-[400px] mx-auto w-full max-w-[220px] md:max-w-none">
              <video 
                src={result.videoUrl} 
                poster={result.thumbnail}
                controls 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Cột 2: Thông số */}
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <p className="text-[var(--color-binance-light)] font-medium leading-relaxed mb-4 text-sm sm:text-base">
                  {result.title}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm mb-6">
                  <div className="flex items-center gap-1.5 text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)] px-3 py-1.5 rounded-full border border-[var(--color-binance-border)]">
                    <User size={14} className="text-[var(--color-binance-yellow)]" />
                    <span className="font-medium text-[var(--color-binance-light)]">{result.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)] px-3 py-1.5 rounded-full border border-[var(--color-binance-border)]">
                    <Calendar size={14} />
                    <span>{result.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="flex flex-col items-center p-2 bg-[var(--color-binance-darker)] rounded-md border border-[var(--color-binance-border)]">
                    <Eye size={16} className="text-blue-400 mb-1" />
                    <span className="font-bold text-[var(--color-binance-light)] text-sm">{result.stats?.views}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-[var(--color-binance-darker)] rounded-md border border-[var(--color-binance-border)]">
                    <Heart size={16} className="text-red-400 mb-1" />
                    <span className="font-bold text-[var(--color-binance-light)] text-sm">{result.stats?.likes}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-[var(--color-binance-darker)] rounded-md border border-[var(--color-binance-border)]">
                    <MessageCircle size={16} className="text-green-400 mb-1" />
                    <span className="font-bold text-[var(--color-binance-light)] text-sm">{result.stats?.comments}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-[var(--color-binance-darker)] rounded-md border border-[var(--color-binance-border)]">
                    <Share2 size={16} className="text-yellow-400 mb-1" />
                    <span className="font-bold text-[var(--color-binance-light)] text-sm">{result.stats?.shares}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={result.videoUrl} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full h-11 border-[var(--color-binance-border)] text-[var(--color-binance-light)] hover:bg-[var(--color-binance-darker)]">Tải MP4</Button>
                </a>
                <a href={result.audioUrl} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full h-11 border-[var(--color-binance-border)] text-[var(--color-binance-light)] hover:bg-[var(--color-binance-darker)]">Tải MP3</Button>
                </a>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--color-binance-border)]">
                <Link 
                  href={`/md5-changer?videoUrl=${encodeURIComponent(result.videoUrl)}&keyword=${encodeURIComponent(result.keyword || "")}`}
                >
                  <Button variant="primary" className="w-full h-12 flex items-center justify-center gap-2 group text-[15px]">
                    Dùng Video này để đổi MD5 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <p className="text-center text-xs text-[var(--color-binance-gray)] mt-2">Nhấn để tự động chuyển sang công cụ lách bản quyền</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
