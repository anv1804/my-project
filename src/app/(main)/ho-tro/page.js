import React from 'react';
import { User, PhoneCall, Send, MapPin, Code2, Mail, Lightbulb } from 'lucide-react';
import Button from '@/components/common/Button';

export const metadata = {
  title: "Thông tin & Hỗ trợ | AnvTools",
  description: "Liên hệ tác giả và nhận hỗ trợ sử dụng hệ thống.",
};

export default function SupportProfilePage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[var(--color-binance-darker)] to-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-2xl p-8 mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-binance-yellow)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 flex-shrink-0 rounded-full bg-gradient-to-tr from-[var(--color-binance-yellow)] to-yellow-500 p-1 shadow-[0_0_20px_rgba(240,185,11,0.3)]">
            <div className="w-full h-full rounded-full bg-[var(--color-binance-darker)] flex items-center justify-center border-4 border-[var(--color-binance-darker)]">
              <span className="text-5xl font-bold text-[var(--color-binance-yellow)]">A</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[var(--color-binance-light)] mb-2 flex items-center justify-center md:justify-start gap-2">
              Chào bạn, tôi là Anv <span className="text-2xl">👋</span>
            </h1>
            <p className="text-[var(--color-binance-gray)] text-lg mb-4 max-w-lg">
              Người sáng lập và phát triển hệ thống công cụ <strong>AnvTools</strong>. Rất vui vì các công cụ này giúp ích được cho công việc của bạn!
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-1.5 text-sm font-medium bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] px-3 py-1.5 rounded-full text-[var(--color-binance-gray)]">
                <Code2 size={16} className="text-[var(--color-binance-yellow)]" />
                Software Engineer
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] px-3 py-1.5 rounded-full text-[var(--color-binance-gray)]">
                <MapPin size={16} className="text-green-500" />
                Việt Nam
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Zalo */}
        <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-2xl p-6 hover:border-[#0068FF] transition-colors group flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-[#0068FF]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PhoneCall size={28} className="text-[#0068FF]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-2 group-hover:text-[#0068FF] transition-colors">Hỗ trợ qua Zalo</h2>
          <p className="text-[var(--color-binance-gray)] mb-6 text-sm flex-1">
            Cần hỗ trợ sử dụng công cụ, báo lỗi phần mềm hoặc hợp tác phát triển? Nhắn tin ngay qua Zalo để được phản hồi nhanh nhất.
          </p>
          <a href="https://zalo.me/0397503905" target="_blank" rel="noopener noreferrer" className="mt-auto">
            <Button variant="primary" className="w-full bg-[#0068FF] hover:bg-[#0055D4] text-white border-none flex items-center justify-center gap-2">
              Chat Zalo: 0397.503.905
            </Button>
          </a>
        </div>

        {/* Contact Telegram */}
        <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-2xl p-6 hover:border-[#229ED9] transition-colors group flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-[#229ED9]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Send size={28} className="text-[#229ED9] ml-[-2px] mt-[2px]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)] mb-2 group-hover:text-[#229ED9] transition-colors">Liên hệ Telegram</h2>
          <p className="text-[var(--color-binance-gray)] mb-6 text-sm flex-1">
            Tham gia trao đổi trực tiếp trên Telegram. Nơi chia sẻ các mẹo hay, update tính năng mới và support công việc.
          </p>
          <a href="https://t.me/anv184" target="_blank" rel="noopener noreferrer" className="mt-auto">
            <Button variant="primary" className="w-full bg-[#229ED9] hover:bg-[#1A8CC2] text-white border-none flex items-center justify-center gap-2">
              Nhắn tin @anv184
            </Button>
          </a>
        </div>
      </div>
      
      {/* Feedback Section */}
      <div className="mt-8 bg-gradient-to-r from-[var(--color-binance-yellow)]/5 to-transparent border border-[var(--color-binance-yellow)]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-binance-yellow)]/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={24} className="text-[var(--color-binance-yellow)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--color-binance-light)] text-base">Đóng góp ý kiến</h3>
            <p className="text-sm text-[var(--color-binance-gray)] mt-0.5">Góp ý tính năng mới, báo lỗi hoặc đề xuất cải tiến qua email.</p>
          </div>
        </div>
        <a
          href="mailto:nguyenan18404@gmail.com?subject=Góp%20ý%20AnvTools&body=Xin%20chào%20Anv%2C%20tôi%20muốn%20góp%20ý%20về%3A"
          className="flex-shrink-0"
        >
          <Button variant="outline" className="flex items-center gap-2 border-[var(--color-binance-yellow)]/40 hover:border-[var(--color-binance-yellow)] hover:text-[var(--color-binance-yellow)] transition-colors whitespace-nowrap">
            <Mail size={17} />
            Gửi Email góp ý
          </Button>
        </a>
      </div>

      {/* Thank you note */}
      <div className="mt-6 text-center text-sm text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)]/50 p-6 rounded-2xl border border-[var(--color-binance-border)]">
        <p>Cảm ơn bạn đã tin tưởng và sử dụng hệ thống <strong className="text-[var(--color-binance-light)]">AnvTools</strong>.</p>
        <p className="mt-1">Mọi đóng góp ý tưởng cải thiện hoặc báo cáo tính năng lỗi đều được trân trọng tiếp thu và cập nhật thường xuyên!</p>
      </div>
    </div>
  );
}
