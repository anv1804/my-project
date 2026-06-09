"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Megaphone, Activity, LogOut } from "lucide-react";

export default function AppleSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const navs = [
    { name: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Quảng cáo", href: "/admin/ads", icon: Megaphone },
    { name: "Logger", href: "/admin/logs", icon: Activity },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-16 flex items-center px-6 border-b border-slate-200/50">
        <span className="text-lg font-semibold tracking-tight text-slate-900">Quản trị Hệ thống</span>
      </div>
      
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navs.map((nav) => {
          const isActive = pathname.startsWith(nav.href);
          return (
            <Link
              key={nav.href}
              href={nav.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-[#0071E3] text-white shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <nav.icon size={18} />
              {nav.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/50">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
