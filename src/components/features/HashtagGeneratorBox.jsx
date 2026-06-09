"use client";

import { useState, Suspense, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Copy, Check, Sparkles, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function HashtagGeneratorBoxContent() {
  const searchParams = useSearchParams();
  const keywordFromParams = searchParams.get("keyword") || "";

  const [keyword, setKeyword] = useState(keywordFromParams);
  const [hashtags, setHashtags] = useState("");
  const [individualTags, setIndividualTags] = useState([]);
  const [copiedText, copy] = useCopyToClipboard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasWorkflow, setHasWorkflow] = useState(false);

  // Auto generate if coming from previous step
  useEffect(() => {
    if (keywordFromParams && !hashtags && !isGenerating) {
      generate(keywordFromParams);
    }
    
    // Check workflow state
    try {
      const stored = JSON.parse(sessionStorage.getItem("reup_workflow_data"));
      if (stored && stored.video) {
        setHasWorkflow(true);
      }
    } catch (e) {}
  }, [keywordFromParams]);

  const handleCopyAll = () => {
    if (!hashtags) return;
    copy(hashtags);
    try {
      const stored = JSON.parse(sessionStorage.getItem("reup_workflow_data") || "{}");
      stored.hashtags = hashtags;
      sessionStorage.setItem("reup_workflow_data", JSON.stringify(stored));
    } catch (e) {}
    toast.success("Đã sao chép bộ Hashtag!");
  };

  const handleCopySingle = (tag) => {
    navigator.clipboard.writeText(tag);
    toast.success(`Đã sao chép: ${tag}`);
  };

  const generate = (kw = keyword) => {
    if(!kw.trim()) {
      toast.error("Vui lòng nhập từ khóa!");
      return;
    }
    if(kw.length > 50) {
      toast.error("Từ khóa quá dài, vui lòng nhập tối đa 50 ký tự!");
      return;
    }
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const word = kw.replace(/\s+/g, '');
      const defaultTags = ["#xuhuong", "#tiktok", "#fyp", "#trending", "#viral", "#foryou", "#learnontiktok"];
      
      // Các tag chứa từ khóa (niche tags)
      const nicheTags = [
        `#${word}`, 
        `#${word}trend`, 
        `#${word}viral`, 
        `#review${word}`, 
        `#${word}giare`, 
        `#${word}chinhhang`
      ];
      
      setHashtags([...nicheTags, ...defaultTags].join(" "));
      setIndividualTags(nicheTags); // Chỉ lưu những tag có chứa keyword
      setIsGenerating(false);

      try {
        const stored = JSON.parse(sessionStorage.getItem("reup_workflow_data") || "{}");
        stored.hashtags = [...nicheTags, ...defaultTags].join(" ");
        sessionStorage.setItem("reup_workflow_data", JSON.stringify(stored));
      } catch (e) {}
    }, 800);
  };

  const isCopiedAll = copiedText === hashtags && hashtags !== "";

  return (
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 sm:p-8 shadow-xl flex flex-col gap-6">
      
      <div>
        <label className="block text-sm font-medium text-[var(--color-binance-gray)] mb-2">
          Nhập Từ khóa (Ví dụ: Ốp lưng iPhone):
        </label>
        <div className="flex gap-3">
          <Input 
            placeholder="Nhập từ khóa sản phẩm / nội dung..." 
            className="flex-1"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate(keyword)}
          />
          <Button variant="primary" onClick={() => generate(keyword)} disabled={isGenerating || !keyword.trim()}>
            {isGenerating ? "Đang xử lý..." : "Tạo Hashtag"}
          </Button>
        </div>
      </div>

      {/* Kết quả */}
      {hashtags && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Box chứa toàn bộ bộ thẻ */}
          <div className="bg-[var(--color-binance-darker)] p-4 rounded-md border border-[var(--color-binance-border)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-[var(--color-binance-yellow)] flex items-center gap-2">
                <Sparkles size={16} /> Bộ Hashtag Đề xuất (Copy All)
              </span>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 text-xs text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors cursor-copy"
              >
                {isCopiedAll ? <Check size={14} className="text-[var(--color-binance-success)]" /> : <Copy size={14} />}
                {isCopiedAll ? "Đã copy!" : "Copy Toàn bộ"}
              </button>
            </div>
            <div className="text-[15px] leading-relaxed text-[var(--color-binance-light)] font-mono bg-black/20 p-3 rounded-sm border border-white/5">
              {hashtags}
            </div>
          </div>

          {/* Danh sách copy lẻ các tag chứa từ khóa */}
          {individualTags.length > 0 && (
            <div className="mt-1">
              <span className="text-[13px] font-medium text-[var(--color-binance-gray)] mb-3 flex items-center gap-2">
                <Copy size={14} /> Copy thẻ liên quan lẻ (Bỏ qua thẻ chung):
              </span>
              <div className="flex flex-wrap gap-2">
                {individualTags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopySingle(tag)}
                    title="Bấm để copy thẻ này"
                    className="px-3 py-1.5 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-full text-[13px] text-[var(--color-binance-light)] hover:border-[var(--color-binance-yellow)] hover:text-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/10 transition-all shadow-sm flex items-center gap-1.5 group cursor-copy"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nút Xuất Báo Cáo */}
          {hasWorkflow && (
            <div className="mt-6 flex justify-center pb-2">
              <Link href="/report">
                <Button variant="primary" className="h-12 px-8 flex items-center justify-center gap-2 group text-[15px] bg-gradient-to-r from-[var(--color-binance-yellow)] to-[#fcd535] text-black font-bold shadow-lg shadow-[var(--color-binance-yellow)]/20 hover:shadow-[var(--color-binance-yellow)]/40 transition-all transform hover:-translate-y-0.5">
                  <FileText size={18} /> Xem Báo Cáo Tổng Hợp Reup
                </Button>
              </Link>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function HashtagGeneratorBox() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--color-binance-gray)]">Đang tải luồng...</div>}>
      <HashtagGeneratorBoxContent />
    </Suspense>
  );
}
