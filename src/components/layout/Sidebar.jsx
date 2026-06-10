"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Home, ChevronDown, ChevronRight, ChevronLeft, Settings, X } from "lucide-react";
import { MENU_GROUPS } from "@/config/menu";

function NavContent({ isSidebarCollapsed, openGroups, toggleGroup, isCurrentPath, handleAction, onClose }) {
  return (
    <>
      {/* Nút Toggle (chỉ desktop) */}
      {onClose === null && (
        <button
          onClick={() => toggleGroup({ id: '__toggle__' })}
          className="absolute -right-3 top-6 w-6 h-6 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-full hidden md:flex items-center justify-center text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:border-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-dark)] z-50 transition-all cursor-pointer shadow-md"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--color-binance-border)] flex-shrink-0 bg-[var(--color-binance-darker)] overflow-hidden">
        <div className="flex items-center justify-between w-full">
          <Link href="/" onClick={onClose ?? undefined} className={cn("flex items-center gap-2 group whitespace-nowrap", isSidebarCollapsed && "mx-auto")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--color-binance-yellow)] transition-transform group-hover:scale-105 shadow-[0_0_10px_rgba(240,185,11,0.2)] flex-shrink-0">
              <span className="text-lg font-bold text-black">A</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold tracking-tight text-[var(--color-binance-light)]">
                Anv<span className="text-[var(--color-binance-yellow)]">Tools</span>
              </span>
            )}
          </Link>
          {onClose && (
            <button onClick={onClose} className="p-1 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)]">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 overflow-x-hidden">
        <Link
          href="/"
          onClick={onClose ?? undefined}
          title="Trang chủ"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-[14px] rounded-md font-medium transition-all duration-200 mb-3 whitespace-nowrap",
            isCurrentPath("/")
              ? "bg-gradient-to-r from-[var(--color-binance-yellow)]/20 to-transparent text-[var(--color-binance-yellow)] border-l-2 border-[var(--color-binance-yellow)]"
              : "text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 border-l-2 border-transparent",
            isSidebarCollapsed && "justify-center px-0"
          )}
        >
          <Home size={18} className="flex-shrink-0" />
          {!isSidebarCollapsed && "Trang chủ"}
        </Link>

        {MENU_GROUPS.map((group) => {
          const Icon = group.icon;
          const isOpen = openGroups[group.id];
          return (
            <div key={group.id} className="mb-2">
              <button
                onClick={() => toggleGroup(group)}
                title={group.title}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-[14px] font-medium text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors cursor-pointer whitespace-nowrap",
                  isSidebarCollapsed && "justify-center px-0"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={cn("transition-colors text-[var(--color-binance-light)]/70 flex-shrink-0", group.iconHoverClass)} />
                  {!isSidebarCollapsed && group.title}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown size={16} className={cn("transition-transform duration-300", isOpen ? "rotate-0" : "-rotate-90")} />
                )}
              </button>

              <div className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen && !isSidebarCollapsed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}>
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-1 mt-1 pl-4 border-l border-[var(--color-binance-border)] ml-5 py-1 whitespace-nowrap">
                    {group.items.map((item, idx) => {
                      const ItemIcon = item.icon;
                      const baseClass = "flex items-center gap-2 px-3 py-2 text-[13.5px] rounded-md transition-all duration-200";
                      const activeClass = "bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)] font-medium";
                      const inactiveClass = "text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50";
                      const itemContent = (
                        <>
                          <ItemIcon size={15} className="flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {item.isPro && (
                            <span className="ml-auto text-[9px] font-bold bg-gradient-to-r from-[var(--color-binance-yellow)] to-yellow-500 text-black px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider flex-shrink-0 shadow-sm">PRO</span>
                          )}
                        </>
                      );
                      if (item.type === "link") {
                        const active = isCurrentPath(item.href);
                        return (
                          <Link key={idx} href={item.href} onClick={onClose ?? undefined} className={cn(baseClass, active ? activeClass : inactiveClass, "w-full overflow-hidden")}>
                            {itemContent}
                          </Link>
                        );
                      }
                      if (item.type === "action") {
                        return (
                          <button key={idx} onClick={() => { handleAction(item.actionId); onClose?.(); }} className={cn(baseClass, inactiveClass, "w-full text-left overflow-hidden")}>
                            {itemContent}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--color-binance-border)] flex-shrink-0 bg-[var(--color-binance-darker)]">
        <button title="Cài đặt hệ thống" className={cn(
          "flex items-center gap-3 px-3 py-2.5 w-full text-[14px] font-medium text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 rounded-md transition-colors cursor-pointer whitespace-nowrap",
          isSidebarCollapsed && "justify-center px-0"
        )}>
          <Settings size={18} className="flex-shrink-0" />
          {!isSidebarCollapsed && "Cài đặt hệ thống"}
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useLayoutStore();
  const { openLoginModal } = useAuthStore();

  const [openGroups, setOpenGroups] = useState({
    tiktok: true, otp: true, facebook: true, ai: true, community: true, support: true,
  });

  const toggleGroup = (group) => {
    if (group.id === '__toggle__') { toggleSidebar(); return; }
    const key = group.id;
    if (isSidebarCollapsed) {
      setSidebarCollapsed(false);
      setOpenGroups(prev => ({ ...prev, [key]: true }));
    } else {
      setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    }
    if (group.href) router.push(group.href);
  };

  const isCurrentPath = (href) => pathname === href;

  const handleAction = (actionId) => {
    if (actionId === "history") openLoginModal("Tính năng xem Lịch sử tạo yêu cầu đăng nhập tài khoản Pro!");
  };

  const sharedProps = { isSidebarCollapsed, openGroups, toggleGroup, isCurrentPath, handleAction };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "relative border-r border-[var(--color-binance-border)] bg-[var(--color-binance-dark)] hidden md:flex flex-col h-screen sticky top-0 shadow-2xl transition-all duration-300 z-40",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 w-6 h-6 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-full flex items-center justify-center text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:border-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-dark)] z-50 transition-all cursor-pointer shadow-md"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <NavContent {...sharedProps} onClose={null} />
      </aside>

      {/* Mobile overlay drawer */}
      <MobileDrawer sharedProps={sharedProps} />
    </>
  );
}

function MobileDrawer({ sharedProps }) {
  const { isMobileMenuOpen, setMobileMenuOpen } = useLayoutStore();
  const close = () => setMobileMenuOpen(false);
  if (!isMobileMenuOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 md:hidden" onClick={close} />
      <aside className="fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-[var(--color-binance-dark)] border-r border-[var(--color-binance-border)] flex flex-col z-50 shadow-2xl md:hidden">
        <NavContent {...sharedProps} isSidebarCollapsed={false} onClose={close} />
      </aside>
    </>
  );
}
