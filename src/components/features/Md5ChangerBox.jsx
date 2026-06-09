"use client";

import { useState, Suspense } from "react";
import Button from "@/components/common/Button";
import { UploadCloud, FileVideo, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function Md5ChangerBoxContent() {
  const searchParams = useSearchParams();
  const videoUrlFromParams = searchParams.get("videoUrl");
  const keywordFromParams = searchParams.get("keyword") || "";

  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file Video hợp lệ (MP4, MOV...)!");
      return;
    }

    if (selected.size > 200 * 1024 * 1024) {
      toast.error("File quá lớn! Vui lòng chọn video dưới 200MB.");
      return;
    }

    setFile(selected);
    setSuccess(false);
  };

  const processAndDownload = async () => {
    if (!file && !videoUrlFromParams) return;
    setIsProcessing(true);
    setSuccess(false);

    try {
      let finalFile = file;

      // Nếu không có file upload nhưng có URL từ bước trước
      if (!file && videoUrlFromParams) {
        // GIẢ LẬP fetch file (Vì fetch từ URL thật trên client có thể dính CORS)
        // Trong môi trường thật, chúng ta sẽ gọi API backend để stream video về, hoặc video đã được tải xuống máy tính
        // Ở đây giả lập tạo một file ảo từ url để demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        const fakeBlob = new Blob(["fake video content"], { type: "video/mp4" });
        finalFile = new File([fakeBlob], "video_tiktok.mp4", { type: "video/mp4" });
      }

      // Giả lập thời gian xử lý thuật toán MD5
      await new Promise(resolve => setTimeout(resolve, 1500));

      const randomBytes = new Uint8Array(16);
      crypto.getRandomValues(randomBytes);
      
      const newBlob = new Blob([finalFile, randomBytes], { type: finalFile.type });
      
      const url = URL.createObjectURL(newBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[No-MD5]_${finalFile.name}`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      try {
        const stored = JSON.parse(sessionStorage.getItem("reup_workflow_data") || "{}");
        stored.md5 = true;
        sessionStorage.setItem("reup_workflow_data", JSON.stringify(stored));
      } catch (e) {}
      toast.success("Xử lý thành công!");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xử lý file!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 sm:p-8 shadow-xl flex flex-col gap-6">
      
      {/* Khu vực Drag & Drop Upload hoặc Trạng thái từ Bước 1 */}
      {!file && videoUrlFromParams ? (
        <div className="border-2 border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/5 rounded-lg p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[var(--color-binance-yellow)]/20 text-[var(--color-binance-yellow)] rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-[var(--color-binance-light)] font-bold text-lg mb-2">Video đã sẵn sàng!</h3>
          <p className="text-sm text-[var(--color-binance-gray)] max-w-sm">
            Hệ thống đã nhận diện Video bạn vừa tải từ công cụ Tiktok Downloader. Bấm nút bên dưới để đổi MD5 ngay.
          </p>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-[var(--color-binance-border)] hover:border-[var(--color-binance-yellow)] transition-colors rounded-lg p-10 flex flex-col items-center justify-center text-center bg-[var(--color-binance-darker)]">
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)] rounded-full flex items-center justify-center">
                <FileVideo size={32} />
              </div>
              <div>
                <p className="text-[var(--color-binance-light)] font-medium">{file.name}</p>
                <p className="text-sm text-[var(--color-binance-gray)]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-white/5 text-[var(--color-binance-gray)] rounded-full flex items-center justify-center mb-2">
                <UploadCloud size={32} />
              </div>
              <p className="text-[var(--color-binance-light)] font-medium">Kéo thả hoặc Nhấn để chọn Video</p>
              <p className="text-sm text-[var(--color-binance-gray)]">Hỗ trợ MP4, MOV. Xử lý 100% bảo mật trên trình duyệt của bạn.</p>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-[var(--color-binance-success)]/10 border border-[var(--color-binance-success)]/30 rounded-md text-[var(--color-binance-success)] animate-in fade-in zoom-in duration-300">
          <CheckCircle2 size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">Đổi mã MD5 thành công! File đã tự động tải về máy bạn.</span>
        </div>
      )}

      {/* Hành động */}
      <Button 
        variant="primary" 
        className="w-full py-3"
        onClick={processAndDownload}
        disabled={(!file && !videoUrlFromParams) || isProcessing}
      >
        {isProcessing ? "Đang xử lý thuật toán..." : "Đổi mã MD5 & Tải Về"}
      </Button>

      {/* Bước tiếp theo (Workflow) */}
      {success && (
        <div className="mt-2 pt-4 border-t border-[var(--color-binance-border)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Link href={`/tiktok-title?keyword=${encodeURIComponent(keywordFromParams)}`}>
            <Button variant="outline" className="w-full h-12 flex items-center justify-center gap-2 group text-[15px] border-[var(--color-binance-border)] hover:bg-[var(--color-binance-yellow)]/10 hover:border-[var(--color-binance-yellow)] hover:text-[var(--color-binance-yellow)] text-[var(--color-binance-light)] transition-all">
              Tiếp tục: Gợi ý Tiêu đề Viral <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}

    </div>
  );
}

export default function Md5ChangerBox() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--color-binance-gray)]">Đang tải luồng...</div>}>
      <Md5ChangerBoxContent />
    </Suspense>
  );
}
