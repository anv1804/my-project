"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { syncCoins } from "@/utils/coinService";
import { useEffect, useState } from "react";
import { User, Mail, Shield, Coins, Calendar, ArrowRight, History, MessageSquare, Zap, ExternalLink } from "lucide-react";
import Link from "next/link";
import Button from "@/components/common/Button";

export default function ProfilePage() {
  const { user, profile, isLoading, openLoginModal } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      syncCoins();
    }
  }, [user]);

  if (!mounted || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-binance-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--color-binance-gray)] text-sm">Đang tải thông tin tài khoản...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-binance-yellow)]/10 flex items-center justify-center mx-auto mb-6 text-[var(--color-binance-yellow)]">
          <User size={32} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-binance-light)] mb-3">Chưa Đăng Nhập</h1>
        <p className="text-[var(--color-binance-gray)] text-sm mb-6 leading-relaxed">
          Vui lòng đăng nhập để truy cập và xem thông tin cá nhân cũng như các cài đặt tài khoản của bạn.
        </p>
        <Button 
          variant="primary" 
          onClick={() => openLoginModal("Vui lòng đăng nhập để xem trang cá nhân!")} 
          className="w-full"
        >
          Đăng Nhập Ngay
        </Button>
      </div>
    );
  }

  const roleLabels = {
    user: "Thành viên Thường",
    pro: "Thành viên PRO ✨",
    admin: "Quản trị viên 👑"
  };

  const roleColors = {
    user: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    pro: "bg-gradient-to-r from-[var(--color-binance-yellow)]/20 to-amber-500/20 text-[var(--color-binance-yellow)] border border-[var(--color-binance-yellow)]/30",
    admin: "bg-red-500/10 text-red-400 border border-red-500/20"
  };

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
    : "Không xác định";

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-binance-light)]">Hồ sơ cá nhân</h1>
        <p className="text-sm text-[var(--color-binance-gray)] mt-1">Quản lý thông tin tài khoản và số dư ví của bạn.</p>
      </div>

      {/* Main Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* User Card */}
        <div className="lg:col-span-1 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-2xl p-6 text-center shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-binance-yellow)]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--color-binance-yellow)]/40 shadow-lg mb-4 flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <div className="w-full h-full bg-[var(--color-binance-yellow)]/10 flex items-center justify-center text-[var(--color-binance-yellow)] font-bold text-3xl">
                  {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Display name */}
            <h2 className="text-xl font-bold text-[var(--color-binance-light)] max-w-full truncate px-2">
              {user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0]}
            </h2>
            
            {/* Role Badge */}
            <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mt-3 ${roleColors[profile?.role || 'user']}`}>
              {roleLabels[profile?.role || 'user']}
            </span>
          </div>

          <div className="border-t border-[var(--color-binance-border)]/50 pt-5 mt-6 text-left space-y-4 relative z-10">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-[var(--color-binance-gray)] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-[var(--color-binance-gray)] uppercase tracking-wider font-semibold">Địa chỉ Email</p>
                <p className="text-[var(--color-binance-light)] truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-[var(--color-binance-gray)] flex-shrink-0" />
              <div>
                <p className="text-[11px] text-[var(--color-binance-gray)] uppercase tracking-wider font-semibold">Ngày tham gia</p>
                <p className="text-[var(--color-binance-light)]">{memberSince}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance card */}
          <div className="bg-gradient-to-r from-yellow-500/10 via-[var(--color-binance-dark)] to-orange-500/10 border border-[var(--color-binance-yellow)]/20 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="text-center sm:text-left relative z-10">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-[var(--color-binance-gray)] mb-1">
                <Coins size={16} className="text-[var(--color-binance-yellow)]" /> Số dư hiện tại
              </div>
              <div className="text-3xl sm:text-4xl font-black text-[var(--color-binance-yellow)] tracking-tight tabular-nums flex items-baseline gap-1.5 justify-center sm:justify-start">
                {new Intl.NumberFormat("vi-VN").format(profile?.coins ?? 0)}
                <span className="text-sm font-semibold text-[var(--color-binance-light)]">Coin</span>
              </div>
              <p className="text-xs text-[var(--color-binance-gray)] mt-2">1 Coin = 1 VND. Dùng để thanh toán dịch vụ thuê số nhận OTP.</p>
            </div>
            
            <Link 
              href="/nap-coin" 
              className="px-6 py-3 bg-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow-hover)] text-black font-bold rounded-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-lg shadow-yellow-500/10 relative z-10 w-full sm:w-auto justify-center"
            >
              Nạp Coin Ngay <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick links to actions */}
          <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-2xl p-6 shadow-md">
            <h3 className="font-bold text-base text-[var(--color-binance-light)] mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[var(--color-binance-yellow)]" /> Lối tắt nhanh
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/thue-otp"
                className="flex items-center justify-between p-4 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)]/60 rounded-xl hover:border-[var(--color-binance-yellow)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-binance-light)] group-hover:text-[var(--color-binance-yellow)] transition-colors">Thuê Số OTP</h4>
                    <p className="text-[11px] text-[var(--color-binance-gray)] mt-0.5">Tiến hành thuê số điện thoại ảo</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--color-binance-gray)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-binance-yellow)] transition-all" />
              </Link>
              
              <Link
                href="/thue-otp/lich-su"
                className="flex items-center justify-between p-4 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)]/60 rounded-xl hover:border-[var(--color-binance-yellow)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <History size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-binance-light)] group-hover:text-[var(--color-binance-yellow)] transition-colors">Lịch Sử OTP</h4>
                    <p className="text-[11px] text-[var(--color-binance-gray)] mt-0.5">Xem lại mã OTP và giao dịch</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--color-binance-gray)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-binance-yellow)] transition-all" />
              </Link>

              <Link
                href="/dien-dan"
                className="flex items-center justify-between p-4 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)]/60 rounded-xl hover:border-[var(--color-binance-yellow)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-binance-light)] group-hover:text-[var(--color-binance-yellow)] transition-colors">Diễn Đàn MMO</h4>
                    <p className="text-[11px] text-[var(--color-binance-gray)] mt-0.5">Giao lưu thảo luận cộng đồng</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--color-binance-gray)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-binance-yellow)] transition-all" />
              </Link>
              
              <Link
                href="/ho-tro"
                className="flex items-center justify-between p-4 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)]/60 rounded-xl hover:border-[var(--color-binance-yellow)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-binance-light)] group-hover:text-[var(--color-binance-yellow)] transition-colors">Trung Tâm Hỗ Trợ</h4>
                    <p className="text-[11px] text-[var(--color-binance-gray)] mt-0.5">Chat Zalo/Telegram hỗ trợ</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--color-binance-gray)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-binance-yellow)] transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
