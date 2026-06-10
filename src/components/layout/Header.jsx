"use client";
import { useTheme } from "next-themes";
import { useLayoutStore } from "@/store/useLayoutStore";

import { useAuthStore } from "@/store/useAuthStore";
import { syncCoins } from "@/utils/coinService";
import Link from "next/link";
import { Bell, User, Search, Menu, Sun, Moon, ArrowRight, LogOut, History, MessageSquare } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MENU_GROUPS } from "@/config/menu";
import { removeVietnameseTones } from "@/utils/stringUtils";

// Custom premium gold coin icon matching user reference image
const CoinIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`${className} inline-block`}>
    {/* Back coin shadow/glow */}
    <circle cx="8" cy="12" r="6.5" fill="#1e1d15" />
    {/* Back coin */}
    <circle cx="8" cy="12" r="6" fill="url(#coinGradBack)" stroke="#b28200" strokeWidth="1" />
    <circle cx="8" cy="12" r="4.2" fill="none" stroke="#ffe066" strokeWidth="0.5" strokeDasharray="1.5 1" />
    
    {/* Front coin shadow/glow */}
    <circle cx="15" cy="12" r="6.5" fill="#1e1d15" />
    {/* Front coin */}
    <circle cx="15" cy="12" r="6" fill="url(#coinGradFront)" stroke="#b28200" strokeWidth="1" />
    <circle cx="15" cy="12" r="4.2" fill="none" stroke="#ffe066" strokeWidth="0.5" strokeDasharray="1.5 1" />
    
    {/* Dollar symbol inside front coin */}
    <path d="M14.2 10.8h1.6c.4 0 .7.3.7.7 0 .4-.3.7-.7.7h-1.6V10.8zm0 1.8h1.8c.4 0 .7.3.7.7 0 .4-.3.7-.7.7H14v-1.4" stroke="#ffe066" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 9.8v1M15 13.2v1" stroke="#ffe066" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    
    <defs>
      <linearGradient id="coinGradFront" x1="9" y1="6" x2="21" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="40%" stopColor="#F5C453" />
        <stop offset="100%" stopColor="#B28200" />
      </linearGradient>
      <linearGradient id="coinGradBack" x1="2" y1="6" x2="14" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F5C453" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7A5900" stopOpacity="0.9" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Header() {
  const { theme, setTheme } = useTheme();
  const toggleSidebar = useLayoutStore(state => state.toggleSidebar);
  const toggleMobileMenu = useLayoutStore(state => state.toggleMobileMenu);
  const openCoinModal = useLayoutStore(state => state.openCoinModal);

  const handleOpenCoinModal = () => {
    syncCoins();
    openCoinModal();
  };
  const { openLoginModal, user, profile, signOut, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Headroom scroll detection logic
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Ignore negative scroll values (like on iOS bounce)
      if (currentScrollY < 0) return;

      // If we are at the very top (or close to it), always show header
      if (currentScrollY <= 64) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Check scroll direction
      if (currentScrollY > lastScrollY.current) {
        // Scrolling down -> hide header
        setVisible(false);
      } else {
        // Scrolling up -> show header
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter tools based on query
  const searchResults = MENU_GROUPS.flatMap(group => 
    group.items.map(item => ({ ...item, groupTitle: group.title }))
  ).filter(item => {
    const normalizedLabel = removeVietnameseTones(item.label.toLowerCase());
    const normalizedQuery = removeVietnameseTones(searchQuery.toLowerCase());
    return normalizedLabel.includes(normalizedQuery);
  });

  const handleSelectResult = (item) => {
    if (item.type === "link") {
      router.push(item.href);
    } else if (item.type === "action" && item.actionId === "history") {
      openLoginModal("Tính năng xem Lịch sử tạo yêu cầu đăng nhập tài khoản Pro!");
    }
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  return (
    <header className={`h-16 border-b border-[var(--color-binance-border)] bg-[var(--color-binance-dark)]/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-all duration-300 ${visible ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="flex items-center gap-4">
        {/* Nút Menu Hamburger giờ chỉ hiển thị ở Mobile (md:hidden) */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 md:hidden text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 rounded-md transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
        
        {/* Thanh tìm kiếm */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="flex items-center bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-md px-3 py-1.5 focus-within:border-[var(--color-binance-yellow)] transition-colors">
            <Search size={16} className="text-[var(--color-binance-gray)] mr-2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm công cụ..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="bg-transparent border-none outline-none text-sm w-48 sm:w-64 lg:w-80 text-[var(--color-binance-light)] placeholder-[var(--color-binance-gray)] transition-all duration-300"
            />
          </div>

          {/* Dropdown Kết Quả Tìm Kiếm */}
          {isSearchOpen && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[300px] bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto py-2">
                  {searchResults.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectResult(item)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[var(--color-binance-border)]/50 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-[var(--color-binance-dark)] text-[var(--color-binance-gray)] group-hover:text-[var(--color-binance-yellow)] transition-colors">
                            <Icon size={16} />
                          </div>
                          <div>
                            <div className="text-[14px] font-medium text-[var(--color-binance-light)] flex items-center gap-2">
                              {item.label}
                              {item.isPro && (
                                <span className="text-[9px] font-bold bg-gradient-to-r from-[var(--color-binance-yellow)] to-yellow-500 text-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider shadow-sm">
                                  PRO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--color-binance-gray)]">{item.groupTitle}</div>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-[var(--color-binance-gray)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--color-binance-yellow)] transition-all transform -translate-x-2 group-hover:translate-x-0" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-[var(--color-binance-gray)] text-sm">
                  Không tìm thấy công cụ nào phù hợp với "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {mounted && (
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Đổi giao diện Sáng/Tối"
            className="p-2 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-border)]/50 rounded-full transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        <button className="relative p-2 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-binance-yellow)] rounded-full"></span>
        </button>

        {/* Coin Balance — click to top up */}
        {!isLoading && user && (
          <button
            onClick={handleOpenCoinModal}
            title="Nạp coin"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-binance-yellow)]/10 border border-[var(--color-binance-yellow)]/25 rounded-md cursor-pointer select-none hover:bg-[var(--color-binance-yellow)]/20 hover:border-[var(--color-binance-yellow)]/50 transition-colors"
          >
            <CoinIcon size={15} />
            <span className="text-sm font-bold text-[var(--color-binance-yellow)] tabular-nums">
              {new Intl.NumberFormat("vi-VN").format(profile?.coins ?? 0)}
            </span>
          </button>
        )}

        {/* Avatar & User Info */}
        {isLoading ? (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-binance-border)] animate-pulse" />
            <div className="hidden sm:block w-20 h-4 rounded bg-[var(--color-binance-border)] animate-pulse" />
          </div>
        ) : user ? (
          <div className="relative flex items-center gap-2 ml-2 group">
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-binance-yellow)]/60 flex-shrink-0">
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                  : <div className="w-full h-full bg-[var(--color-binance-yellow)]/20 flex items-center justify-center text-[var(--color-binance-yellow)] font-bold text-sm">
                      {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                }
              </div>
              <span className="text-sm font-medium hidden sm:block text-[var(--color-binance-light)] max-w-[100px] truncate">
                {user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0]}
              </span>
            </Link>

            {/* Dropdown Menu Wrapper (hover bridge) */}
            <div className="hidden group-hover:block absolute right-0 top-full pt-1.5 w-48 z-50 animate-in fade-in duration-150">
              {/* Dropdown Content */}
              <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-xl shadow-xl overflow-hidden py-1.5">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 transition-colors"
                >
                  <User size={15} className="text-[var(--color-binance-gray)]" /> Trang cá nhân
                </Link>
                <Link
                  href="/thue-otp/lich-su"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 transition-colors"
                >
                  <History size={15} className="text-[var(--color-binance-gray)]" /> Lịch sử thuê số
                </Link>
                <Link
                  href="/nap-coin"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 transition-colors"
                >
                  <CoinIcon size={15} className="mr-0.5" /> Nạp Coin
                </Link>
                <Link
                  href="/dien-dan"
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 transition-colors"
                >
                  <MessageSquare size={15} className="text-[var(--color-binance-gray)]" /> Diễn đàn
                </Link>
                
                <div className="border-t border-[var(--color-binance-border)] my-1.5"></div>
                
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut size={15} /> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div onClick={() => openLoginModal()} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ml-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] flex items-center justify-center">
              <User size={16} className="text-[var(--color-binance-gray)]" />
            </div>
            <span className="text-sm font-medium hidden sm:block text-[var(--color-binance-light)]">Đăng nhập</span>
          </div>
        )}
      </div>
    </header>
  );
}
