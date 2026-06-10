import Link from "next/link";
import { Download, Shuffle, Sparkles, Hash, PhoneCall, History, Type, Mic, MessageSquare, ArrowRight, Coins, Zap, Shield, HelpCircle, Users } from "lucide-react";

// Custom SVGs from config/menu.jsx
const TiktokIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
);

const FacebookIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function Home() {
  const categories = [
    {
      id: "otp",
      title: "Dịch Vụ SIM & OTP Ảo",
      description: "Thuê số nhận mã OTP tức thì từ các dịch vụ mạng xã hội, ví điện tử, sàn thương mại điện tử.",
      badge: "Tự động 99.9%",
      gradient: "from-amber-500/10 to-orange-500/10 border-orange-500/20 hover:border-orange-500/50",
      icon: PhoneCall,
      iconColor: "text-orange-400",
      items: [
        { href: "/thue-otp", label: "Thuê Số Nhận OTP", icon: PhoneCall, desc: "Cấp số nhanh, tự động nhận code trong 2 phút." },
        { href: "/thue-otp/lich-su", label: "Lịch Sử Thuê Số", icon: History, desc: "Quản lý mã OTP và sao lưu báo cáo giao dịch." }
      ]
    },
    {
      id: "tiktok",
      title: "Hệ Sinh Thái TikTok Tools",
      description: "Đầy đủ công cụ tối ưu hóa video, lách reup bản quyền và xây dựng kênh TikTok triệu view.",
      badge: "Cực hot",
      gradient: "from-pink-500/10 to-rose-500/10 border-pink-500/20 hover:border-pink-500/50",
      icon: TiktokIcon,
      iconColor: "text-pink-500",
      items: [
        { href: "/tiktok-downloader", label: "Tải Video No-Logo", icon: Download, desc: "Tải video TikTok không dính watermark chất lượng HD." },
        { href: "/md5-changer", label: "Đổi Mã MD5 (Lách Reup)", icon: Shuffle, desc: "Làm mới mã hash video để tránh bị quét nội dung trùng lặp." },
        { href: "/tiktok-title", label: "Tạo Tiêu Đề Thu Hút", icon: Sparkles, desc: "AI phân tích và đề xuất tiêu đề bắt trend giật tít." },
        { href: "/tiktok-hashtag", label: "Gợi Ý Hashtag Viral", icon: Hash, desc: "Tạo danh sách thẻ hashtag tối ưu SEO phân phối." }
      ]
    },
    {
      id: "ai-format",
      title: "Công Cụ Sáng Tạo AI & Định Dạng",
      description: "Tận dụng AI để chuyển văn bản thành giọng đọc và tạo phong cách bài viết độc đáo.",
      gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/50",
      icon: Mic,
      iconColor: "text-emerald-400",
      items: [
        { href: "/tiktok-tts", label: "Tạo Giọng Nói AI (TTS)", icon: Mic, desc: "Chuyển văn bản thành giọng đọc tự nhiên chuẩn review." },
        { href: "/fb-formatter", label: "Format Chữ Đậm Facebook", icon: Type, desc: "Tạo chữ đậm, nghiêng viết status nổi bật trên newfeed." }
      ]
    },
    {
      id: "community-support",
      title: "Cộng Đồng & Tương Tác",
      description: "Giao lưu chia sẻ kinh nghiệm kiếm tiền Online và nhận trợ giúp kỹ thuật 24/7.",
      gradient: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 hover:border-blue-500/50",
      icon: Users,
      iconColor: "text-blue-400",
      items: [
        { href: "/dien-dan", label: "Diễn Đàn MMO", icon: MessageSquare, desc: "Thảo luận thủ thuật reup, affiliate, dropshipping." },
        { href: "/ho-tro", label: "Trung Tâm Hỗ Trợ", icon: HelpCircle, desc: "Kênh liên hệ Zalo, Telegram và hỗ trợ tài khoản." }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-[var(--color-binance-darker)] pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24 border-b border-[var(--color-binance-border)] bg-gradient-to-b from-[var(--color-binance-dark)] to-[var(--color-binance-darker)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-binance-yellow)]/10 border border-[var(--color-binance-yellow)]/20 text-[var(--color-binance-yellow)] text-xs font-semibold mb-6 animate-pulse">
            <Zap size={14} /> Hệ sinh thái MMO hàng đầu cho dân creator
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            MMO <span className="text-[var(--color-binance-yellow)] drop-shadow-[0_0_15px_rgba(240,185,11,0.2)]">Tools</span> Hub
          </h1>
          
          <p className="text-[var(--color-binance-gray)] text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Nền tảng tự động hóa toàn diện giúp bạn tối ưu hóa hiệu suất làm video, nuôi tài khoản và tăng trưởng doanh thu MMO.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="#tools-grid" 
              className="px-6 py-3 bg-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow-hover)] text-black font-bold rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg shadow-yellow-500/10 flex items-center gap-2 cursor-pointer"
            >
              Khám Phá Công Cụ <ArrowRight size={16} />
            </a>
            <Link 
              href="/ho-tro" 
              className="px-6 py-3 bg-[var(--color-binance-dark)] hover:bg-[var(--color-binance-border)]/50 text-[var(--color-binance-light)] font-bold rounded-lg border border-[var(--color-binance-border)] transition-all flex items-center gap-2"
            >
              Liên Hệ Hỗ Trợ
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Feature Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--color-binance-light)]">Tốc độ & Tự động</h3>
              <p className="text-sm text-[var(--color-binance-gray)] mt-1">Các cổng kết nối API hoạt động 24/7 giúp xử lý tức thì không có độ trễ.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 border-t md:border-t-0 md:border-x border-[var(--color-binance-border)] pt-6 md:pt-0 md:px-6">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--color-binance-light)]">Bảo mật tuyệt đối</h3>
              <p className="text-sm text-[var(--color-binance-gray)] mt-1">Mã hóa các phiên làm việc và giao dịch của khách hàng, đảm bảo tính riêng tư.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 border-t md:border-t-0 pt-6 md:pt-0">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--color-binance-light)]">VietQR Auto Topup</h3>
              <p className="text-sm text-[var(--color-binance-gray)] mt-1">Hệ thống nạp coin tự động thông minh qua ngân hàng chỉ trong 30 giây.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tools Grid */}
      <div id="tools-grid" className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24">
        <div className="text-center md:text-left mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-binance-light)]">Danh mục công cụ hệ thống</h2>
          <p className="text-[var(--color-binance-gray)] text-sm sm:text-base mt-2">Bấm chọn công cụ mong muốn để chuyển đến giao diện tương ứng.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat, idx) => {
            const CatIcon = cat.icon;
            return (
              <div 
                key={idx} 
                className={`flex flex-col bg-gradient-to-br ${cat.gradient} border rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg bg-[var(--color-binance-dark)] shadow-sm ${cat.iconColor}`}>
                      <CatIcon size={22} />
                    </div>
                    <h3 className="font-bold text-xl text-[var(--color-binance-light)]">{cat.title}</h3>
                  </div>
                  {cat.badge && (
                    <span className="text-[10px] font-bold bg-[var(--color-binance-yellow)] text-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {cat.badge}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-[var(--color-binance-gray)] mb-6 leading-relaxed">
                  {cat.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                  {cat.items.map((item, itemIdx) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link 
                        key={itemIdx} 
                        href={item.href}
                        className="flex items-start gap-3 p-4 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl transition-all duration-300 hover:border-[var(--color-binance-yellow)] group"
                      >
                        <div className="p-2 rounded-lg bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)] group-hover:text-[var(--color-binance-yellow)] transition-colors mt-0.5 flex-shrink-0">
                          <ItemIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[var(--color-binance-light)] group-hover:text-[var(--color-binance-yellow)] transition-colors truncate">
                            {item.label}
                          </h4>
                          <p className="text-xs text-[var(--color-binance-gray)] mt-1 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Banner topup */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24">
        <div className="bg-gradient-to-r from-yellow-500/10 via-[var(--color-binance-dark)] to-orange-500/10 border border-[var(--color-binance-yellow)]/25 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="text-center md:text-left relative z-10 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-binance-light)] flex items-center justify-center md:justify-start gap-2">
              <Coins className="text-[var(--color-binance-yellow)]" /> Trải nghiệm tính năng PRO & Nạp Coin tự động
            </h3>
            <p className="text-sm text-[var(--color-binance-gray)] mt-2 leading-relaxed">
              Thuê số nhận OTP với chi phí siêu rẻ chỉ từ vài trăm đồng. Nạp tiền cực nhanh qua VietQR Banking với nội dung chuyển khoản tự động tích hợp.
            </p>
          </div>
          <Link
            href="/nap-coin"
            className="px-6 py-3 bg-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow-hover)] text-black font-bold rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer z-10 whitespace-nowrap"
          >
            Nạp Coin Ngay <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
