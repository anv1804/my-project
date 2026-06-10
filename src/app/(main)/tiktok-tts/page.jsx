import React from "react";
import TtsBox from "@/components/features/TtsBox";
import { Mic, Headphones, Download, Zap } from "lucide-react";

export const metadata = {
  title: "Tạo Giọng Nói AI (Text-to-Speech) - AnvTools",
  description: "Chuyển văn bản thành giọng đọc AI tự nhiên chuẩn TikTok nhanh chóng.",
};

export default function TiktokTtsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-[var(--color-binance-light)] mb-2 flex items-center gap-2 sm:gap-3">
          <Mic className="text-[var(--color-binance-yellow)] shrink-0" size={22} />
          Chuyển Văn Bản Thành Giọng Nói (TTS)
        </h1>
        <p className="text-[var(--color-binance-gray)] text-sm sm:text-base">
          Tạo file âm thanh lồng tiếng video TikTok với giọng AI tự nhiên, đa dạng vùng miền và cảm xúc.
        </p>
      </div>

      <div className="mb-12">
        <TtsBox />
      </div>

      <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-xl p-4 sm:p-8">
        <h2 className="text-base sm:text-xl font-bold text-[var(--color-binance-light)] mb-4 sm:mb-6">Tại sao nên dùng giọng AI cho TikTok?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[var(--color-binance-dark)] p-5 rounded-lg border border-[var(--color-binance-border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-binance-yellow)]/10 flex items-center justify-center text-[var(--color-binance-yellow)] mb-4">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-[var(--color-binance-light)] mb-2">Tốc độ & Tiện lợi</h3>
            <p className="text-sm text-[var(--color-binance-gray)] leading-relaxed">
              Tiết kiệm hàng giờ đồng hồ thu âm và chỉnh sửa. Chỉ cần có kịch bản, bạn sẽ có ngay file âm thanh hoàn chỉnh trong vài giây.
            </p>
          </div>

          <div className="bg-[var(--color-binance-dark)] p-5 rounded-lg border border-[var(--color-binance-border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-binance-yellow)]/10 flex items-center justify-center text-[var(--color-binance-yellow)] mb-4">
              <Headphones size={20} />
            </div>
            <h3 className="font-bold text-[var(--color-binance-light)] mb-2">Chất âm tự nhiên</h3>
            <p className="text-sm text-[var(--color-binance-gray)] leading-relaxed">
              Sử dụng mô hình AI Deep Learning tiên tiến nhất, giọng đọc được nhấn nhá, ngắt nghỉ y như người thật, không bị "robot".
            </p>
          </div>

          <div className="bg-[var(--color-binance-dark)] p-5 rounded-lg border border-[var(--color-binance-border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-binance-yellow)]/10 flex items-center justify-center text-[var(--color-binance-yellow)] mb-4">
              <Download size={20} />
            </div>
            <h3 className="font-bold text-[var(--color-binance-light)] mb-2">Dễ dàng ghép nối</h3>
            <p className="text-sm text-[var(--color-binance-gray)] leading-relaxed">
              Xuất file MP3 chuẩn 320kbps tương thích với mọi phần mềm dựng video như CapCut, Premiere Pro, DaVinci Resolve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
