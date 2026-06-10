import Link from "next/link";
import { Download, Shuffle, Sparkles, Hash, PhoneCall, History, Type, Mic, MessageSquare, ArrowRight, Coins, Zap, Shield, HelpCircle, Users, Trophy, TrendingUp } from "lucide-react";

// Custom SVGs from config/menu.jsx
const TiktokIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
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

  // Fake Recent Activities
  const recentActivities = [
    { user: "hoang***", action: "thuê OTP Telegram", price: "1,500đ", time: "vừa xong" },
    { user: "thanh***", action: "nạp tiền VietQR", price: "100,000đ", time: "1 phút trước" },
    { user: "mmo_pro***", action: "đổi mã MD5 video", price: "Miễn phí", time: "2 phút trước" },
    { user: "anh_tuan***", action: "thuê OTP Facebook", price: "1,200đ", time: "3 phút trước" },
    { user: "nguyen_van***", action: "nạp tiền VietQR", price: "50,000đ", time: "5 phút trước" },
    { user: "quang_huy***", action: "tạo giọng đọc AI", price: "Miễn phí", time: "7 phút trước" },
    { user: "vip_mmo***", action: "nạp tiền VietQR", price: "500,000đ", time: "10 phút trước" },
    { user: "creator***", action: "thuê OTP Gmail", price: "2,000đ", time: "12 phút trước" },
    { user: "reup_tiktok***", action: "tải video TikTok", price: "Miễn phí", time: "15 phút trước" },
    { user: "linh***", action: "nạp tiền VietQR", price: "200,000đ", time: "18 phút trước" }
  ];

  // Fake Top Depositors (Weekly)
  const topDepositors = [
    { rank: 1, user: "mmo_king***", amount: "5,000,000đ", color: "text-yellow-400" },
    { rank: 2, user: "reup_pro***", amount: "3,500,000đ", color: "text-slate-300" },
    { rank: 3, user: "hoang_mmo***", amount: "2,000,000đ", color: "text-amber-600" },
    { rank: 4, user: "tuan_affiliate***", amount: "1,500,000đ", color: "text-[var(--color-binance-gray)]" },
    { rank: 5, user: "quang_tools***", amount: "1,000,000đ", color: "text-[var(--color-binance-gray)]" }
  ];

  return (
    <main className="min-h-screen bg-[var(--color-binance-darker)] pb-20">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

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

      {/* Live Transaction Marquee Ticker */}
      <div className="relative w-full overflow-hidden bg-[var(--color-binance-dark)] border-y border-[var(--color-binance-border)] py-3 z-10 shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--color-binance-dark)] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--color-binance-dark)] to-transparent z-20 pointer-events-none"></div>
        
        <div className="animate-marquee gap-8 items-center">
          {/* Loop twice for seamless infinite scrolling */}
          {[...recentActivities, ...recentActivities].map((act, idx) => (
            <div key={idx} className="flex items-center gap-2 px-4 py-1 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-full text-xs shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-binance-success)] animate-pulse"></span>
              <span className="font-semibold text-[var(--color-binance-light)]">{act.user}</span>
              <span className="text-[var(--color-binance-gray)]">{act.action}</span>
              <span className="font-bold text-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/5 px-1.5 py-0.5 rounded border border-[var(--color-binance-yellow)]/10">{act.price}</span>
              <span className="text-[10px] text-[var(--color-binance-gray)] italic">{act.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Feature Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 relative z-20">
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

      {/* Top Depositors & Quick Topup Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Quick Topup Banner */}
          <div className="lg:col-span-7 bg-gradient-to-r from-yellow-500/10 via-[var(--color-binance-dark)] to-orange-500/10 border border-[var(--color-binance-yellow)]/25 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-binance-light)] flex items-center gap-2 mb-3">
                <Coins className="text-[var(--color-binance-yellow)]" /> Trải nghiệm tính năng PRO & Nạp Coin tự động
              </h3>
              <p className="text-sm text-[var(--color-binance-gray)] leading-relaxed mb-6">
                Nạp Coin một lần, sử dụng cho mọi dịch vụ và sản phẩm hiện tại và tương lai trong hệ sinh thái MMO Tools Hub. Nạp tiền tự động qua VietQR Banking tiện lợi, xử lý chỉ trong 30 giây.
              </p>
            </div>
            
            <div className="flex items-center justify-between border-t border-[var(--color-binance-border)] pt-4 mt-4 relative z-10">
              <span className="text-xs text-[var(--color-binance-gray)] flex items-center gap-1">
                <TrendingUp size={14} className="text-[var(--color-binance-success)]" /> Tốc độ xử lý: ~30 giây
              </span>
              <Link
                href="/nap-coin"
                className="px-6 py-3 bg-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow-hover)] text-black font-bold rounded-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-lg shadow-yellow-500/10"
              >
                Nạp Coin Ngay <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Side: Leaderboard Top Depositors */}
          <div className="lg:col-span-5 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-[var(--color-binance-light)] flex items-center gap-2">
                  <Trophy className="text-[var(--color-binance-yellow)]" size={18} /> BXH Đua Top Nạp Coin
                </h3>
                <span className="text-[10px] font-bold text-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 px-2 py-0.5 rounded-full border border-[var(--color-binance-yellow)]/20 uppercase">
                  Tuần này
                </span>
              </div>

              <div className="space-y-3">
                {topDepositors.map((dep, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)]/50 hover:border-[var(--color-binance-border)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${dep.rank <= 3 ? 'bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] shadow-sm' : ''} ${dep.color}`}>
                        {dep.rank === 1 ? "🥇" : dep.rank === 2 ? "🥈" : dep.rank === 3 ? "🥉" : dep.rank}
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-binance-light)]">{dep.user}</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-binance-yellow)] tabular-nums">{dep.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[var(--color-binance-gray)] text-center mt-5 pt-3 border-t border-[var(--color-binance-border)]">
              Cập nhật tự động mỗi 10 phút. Đua TOP để nhận phần thưởng khuyến mãi!
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
