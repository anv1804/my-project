"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Clock, RefreshCw, X, CircleDollarSign, LogIn, LogOut, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function NotificationDropdown() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const menuRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        // just a mock logic for unread: if there are any notifications, show dot.
        // in a real app, you'd compare with a last_read timestamp.
        if (json.data.length > 0) setHasUnread(true);
      }
    } catch (e) {
      console.error("Lỗi tải thông báo", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false); // clear unread when opened
    }
  };

  const getActionDetails = (log) => {
    switch (log.action) {
      case 'coin_topup':
        return {
          icon: <CircleDollarSign size={16} className="text-[var(--color-binance-success)]" />,
          title: 'Nạp Coin thành công',
          desc: `Bạn đã nạp ${new Intl.NumberFormat('vi-VN').format(log.coins_delta || 0)} coin vào tài khoản.`,
          time: log.created_at
        };
      case 'coin_deduct':
        return {
          icon: <CheckCircle2 size={16} className="text-[var(--color-binance-gray)]" />,
          title: 'Sử dụng dịch vụ',
          desc: `Đã thanh toán ${new Intl.NumberFormat('vi-VN').format(Math.abs(log.coins_delta || 0))} coin.`,
          time: log.created_at
        };
      case 'coin_refund':
        return {
          icon: <RefreshCw size={16} className="text-[var(--color-binance-yellow)]" />,
          title: 'Hoàn tiền',
          desc: `Được hoàn ${new Intl.NumberFormat('vi-VN').format(log.coins_delta || 0)} coin.`,
          time: log.created_at
        };
      case 'otp_rent':
        return {
          icon: <ShieldAlert size={16} className="text-blue-400" />,
          title: 'Thuê số OTP',
          desc: `Bạn đã thuê số ${log.metadata?.phone_number || ''} dịch vụ ${log.metadata?.service_name || ''}.`,
          time: log.created_at
        };
      case 'user_login':
        return {
          icon: <LogIn size={16} className="text-green-500" />,
          title: 'Đăng nhập',
          desc: `Phát hiện đăng nhập từ IP ${log.ip || 'ẩn'}.`,
          time: log.created_at
        };
      case 'user_logout':
        return {
          icon: <LogOut size={16} className="text-red-400" />,
          title: 'Đăng xuất',
          desc: `Tài khoản đã đăng xuất.`,
          time: log.created_at
        };
      default:
        return {
          icon: <Bell size={16} className="text-[var(--color-binance-gray)]" />,
          title: 'Thông báo',
          desc: `Hành động: ${log.action}`,
          time: log.created_at
        };
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={toggleOpen}
        className={`relative p-2 rounded-full transition-colors ${
          isOpen ? "bg-[var(--color-binance-border)]/50 text-[var(--color-binance-light)]" : "text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50"
        }`}
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-binance-yellow)] rounded-full border border-[var(--color-binance-dark)]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-[var(--color-binance-border)] flex items-center justify-between bg-[var(--color-binance-darker)]/50">
            <h3 className="font-semibold text-sm text-[var(--color-binance-light)]">Thông báo</h3>
            <button onClick={() => setIsOpen(false)} className="text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)]">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <RefreshCw size={20} className="animate-spin text-[var(--color-binance-gray)]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-binance-gray)] text-sm">
                Chưa có thông báo nào
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((log) => {
                  const details = getActionDetails(log);
                  return (
                    <div key={log.id} className="p-3 border-b border-[var(--color-binance-border)] hover:bg-[var(--color-binance-border)]/30 transition-colors flex gap-3">
                      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-[var(--color-binance-darker)] flex items-center justify-center border border-[var(--color-binance-border)]">
                        {details.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--color-binance-light)] truncate">
                          {details.title}
                        </div>
                        <div className="text-xs text-[var(--color-binance-gray)] mt-0.5 leading-relaxed">
                          {details.desc}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-binance-gray)]/70 mt-1.5 font-mono">
                          <Clock size={10} />
                          {new Date(details.time).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-[var(--color-binance-border)] bg-[var(--color-binance-darker)]/30 text-center">
            <button onClick={fetchNotifications} className="text-xs text-[var(--color-binance-gray)] hover:text-[var(--color-binance-yellow)] flex items-center justify-center gap-1 w-full p-1 transition-colors">
              <RefreshCw size={12} /> Làm mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
