"use client";

import { useState, Suspense, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Video, Copy, Check, Loader2, ArrowRight } from "lucide-react";
import Button from "@/components/common/Button";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const VIRAL_VIDEO_TITLES = [
  "Góc chia sẻ: Những điều ít ai biết về {keyword} 🤔",
  "Review chân thực nhất về {keyword} cho anh em tham khảo 🔥",
  "Cảnh báo: Đừng xem nếu bạn không muốn nghiện {keyword} 😅",
  "Sự thật ngã ngửa về {keyword} mà 99% mọi người đang hiểu lầm 😱",
  "Bí kíp đỉnh cao về {keyword} giúp bạn tiết kiệm hàng triệu đồng 💸"
];

const VIRAL_PHOTO_TITLES = [
  {
    t1: "Top 3 sai lầm về {keyword} mà ai cũng từng mắc phải!",
    t2: "Lưu lại ngay để không dính bẫy {keyword} nữa nhé 👇 #xuhuong"
  },
  {
    t1: "Giải ngố về {keyword} cực dễ hiểu chỉ trong 3 slide 👉",
    t2: "Slide cuối sẽ khiến bạn bất ngờ về {keyword} đấy! Cùng xem nhé."
  },
  {
    t1: "{keyword} và những bí mật chưa từng được tiết lộ 🤫",
    t2: "Bạn ấn tượng nhất với điều gì về {keyword} trong bộ ảnh này? Cmt nhé 👇"
  }
];

function TiktokTitleBoxContent() {
  const searchParams = useSearchParams();
  const keywordFromParams = searchParams.get("keyword") || "";

  const [keyword, setKeyword] = useState(keywordFromParams);
  const [postType, setPostType] = useState("video");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Auto generate if coming from previous step
  useEffect(() => {
    if (keywordFromParams && !result && !isGenerating) {
      handleGenerate(keywordFromParams);
    }
  }, [keywordFromParams]);

  const handleGenerate = (kw = keyword) => {
    if (!kw.trim()) {
      toast.error("Vui lòng nhập từ khóa!");
      return;
    }
    if (kw.length > 50) {
      toast.error("Từ khóa quá dài, vui lòng nhập tối đa 50 ký tự!");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    // Giả lập call AI API
    setTimeout(() => {
      const trimmedKw = kw.trim();
      
      if (postType === "video") {
        const randomTitle = VIRAL_VIDEO_TITLES[Math.floor(Math.random() * VIRAL_VIDEO_TITLES.length)].replace(/{keyword}/g, trimmedKw);
        setResult([randomTitle]);
        try {
          const stored = JSON.parse(sessionStorage.getItem("reup_workflow_data") || "{}");
          stored.title = randomTitle;
          sessionStorage.setItem("reup_workflow_data", JSON.stringify(stored));
        } catch (e) {}
      } else {
        const randomPair = VIRAL_PHOTO_TITLES[Math.floor(Math.random() * VIRAL_PHOTO_TITLES.length)];
        const generated = [
          randomPair.t1.replace(/{keyword}/g, trimmedKw),
          randomPair.t2.replace(/{keyword}/g, trimmedKw)
        ];
        setResult(generated);
        try {
          const stored = JSON.parse(sessionStorage.getItem("reup_workflow_data") || "{}");
          stored.title = generated.join("\n");
          sessionStorage.setItem("reup_workflow_data", JSON.stringify(stored));
        } catch (e) {}
      }
      setIsGenerating(false);
    }, 1000);
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    try {
      const stored = JSON.parse(sessionStorage.getItem("reup_workflow_data") || "{}");
      stored.title = text;
      sessionStorage.setItem("reup_workflow_data", JSON.stringify(stored));
    } catch (e) {}
    toast.success("Đã sao chép tiêu đề!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl p-6 shadow-xl transition-colors duration-300 flex flex-col gap-6">
      
      {/* Type Selector */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="radio" 
            name="postType" 
            value="video" 
            checked={postType === "video"} 
            onChange={(e) => setPostType(e.target.value)} 
            className="hidden"
          />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${postType === 'video' ? 'border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]' : 'border-[var(--color-binance-border)] text-[var(--color-binance-gray)] group-hover:border-[var(--color-binance-gray)]'}`}>
            <Video size={18} />
            <span className="font-medium text-sm">Bài Video (1 Title)</span>
          </div>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="radio" 
            name="postType" 
            value="photo" 
            checked={postType === "photo"} 
            onChange={(e) => setPostType(e.target.value)} 
            className="hidden"
          />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${postType === 'photo' ? 'border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]' : 'border-[var(--color-binance-border)] text-[var(--color-binance-gray)] group-hover:border-[var(--color-binance-gray)]'}`}>
            <ImageIcon size={18} />
            <span className="font-medium text-sm">Bài Ảnh (2 Title)</span>
          </div>
        </label>
      </div>

      {/* Keyword Input */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-binance-gray)] mb-2">
          Từ khóa sản phẩm / nội dung
        </label>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="VD: Quần áo mùa đông, Sách hay..." 
            className="flex-1 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-md px-4 py-2.5 text-[var(--color-binance-light)] placeholder-[var(--color-binance-gray)] focus:border-[var(--color-binance-yellow)] outline-none transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate(keyword)}
          />
          <Button 
            onClick={() => handleGenerate(keyword)} 
            disabled={!keyword.trim() || isGenerating}
            className="flex-shrink-0"
          >
            {isGenerating ? (
              <><Loader2 size={18} className="animate-spin" /> Đang tạo...</>
            ) : (
              <><Sparkles size={18} /> Tạo Ngay</>
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-lg p-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="text-sm font-semibold text-[var(--color-binance-yellow)] mb-4 flex items-center gap-2">
            <Sparkles size={16} /> Gợi ý Title chuẩn TikTok
          </h3>
          
          <div className="space-y-4">
            {result.map((title, idx) => (
              <div key={idx} className="relative group bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] p-4 rounded-md pr-12">
                <span className="absolute -top-2.5 left-3 bg-[var(--color-binance-darker)] px-2 text-xs font-medium text-[var(--color-binance-gray)] border border-[var(--color-binance-border)] rounded">
                  {postType === "photo" && idx === 0 ? "Title 1 (Trên ảnh/Bìa)" : postType === "photo" && idx === 1 ? "Title 2 (Dưới mô tả)" : "Tiêu đề Video"}
                </span>
                <p className="text-[var(--color-binance-light)] text-sm leading-relaxed mt-1">
                  {title}
                </p>
                <button
                  onClick={() => handleCopy(title, idx)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md text-[var(--color-binance-gray)] hover:bg-[var(--color-binance-border)] hover:text-[var(--color-binance-light)] transition-colors cursor-copy"
                  title="Sao chép"
                >
                  {copiedIndex === idx ? <Check size={16} className="text-[var(--color-binance-success)]" /> : <Copy size={16} />}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-binance-border)]">
            <Link href={`/tiktok-hashtag?keyword=${encodeURIComponent(keyword)}`}>
              <Button variant="outline" className="w-full h-11 flex items-center justify-center gap-2 group text-sm border-[var(--color-binance-border)] hover:bg-[var(--color-binance-yellow)]/10 hover:border-[var(--color-binance-yellow)] hover:text-[var(--color-binance-yellow)] text-[var(--color-binance-light)] transition-all">
                Bước cuối: Sinh Hashtag Xu Hướng <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TiktokTitleBox() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--color-binance-gray)]">Đang tải luồng...</div>}>
      <TiktokTitleBoxContent />
    </Suspense>
  );
}
