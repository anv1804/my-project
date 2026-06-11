"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { Shield, Clock, MessageCircle, Send, AlertTriangle } from "lucide-react";
import { getDeviceFingerprint } from "@/utils/fingerprint";

// ── Cấu hình liên hệ hỗ trợ ──────────────────────────────────────────────────
const SUPPORT_ZALO     = "https://zalo.me/0000000000";
const SUPPORT_TELEGRAM = "https://t.me/anvtools_support";

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(targetDateStr) {
  const calc = () => {
    if (!targetDateStr) return 0;
    return Math.max(0, Math.floor((new Date(targetDateStr) - Date.now()) / 1000));
  };
  const [seconds, setSeconds] = useState(calc);

  useEffect(() => {
    if (!targetDateStr) return;
    const id = setInterval(() => {
      const s = calc();
      setSeconds(s);
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetDateStr]);

  return seconds;
}

function formatCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Overlay Component ─────────────────────────────────────────────────────────
export function AntispamOverlay({ bannedUntil, reason, onExpired }) {
  const seconds = useCountdown(bannedUntil);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (seconds <= 0 && bannedUntil) {
      setTimeout(onExpired, 1500);
    }
  }, [seconds, bannedUntil, onExpired]);

  const isExpiring = seconds <= 0;

  return (
    <div
      style={{ zIndex: 99999 }}
      className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.preventDefault();
      }}
    >
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0f0f0f] shadow-[0_0_60px_rgba(239,68,68,0.15)] overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse" />

        <div className="p-8 flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center animate-pulse">
            <Shield size={28} className="text-red-400" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" />
              <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest">
                Cảnh báo bảo mật
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Thao tác đáng ngờ
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed mt-1 max-w-sm">
              Chúng tôi phát hiện hành vi bất thường từ tài khoản của bạn.
              Tài khoản đã được{" "}
              <span className="text-orange-400 font-semibold">tạm khoá</span> để
              kiểm tra.
            </p>
            {reason && (
              <p className="text-[11px] text-gray-500 mt-1 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                Lý do: {reason}
              </p>
            )}
          </div>

          <div className="w-full rounded-xl bg-red-950/30 border border-red-500/20 p-5 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <Clock size={13} />
              {isExpiring ? "Đang mở khoá..." : "Tài khoản sẽ được mở khoá sau"}
            </div>
            {isExpiring ? (
              <div className="text-3xl font-black text-green-400 animate-pulse">
                ✓ Xong
              </div>
            ) : (
              <div className="text-4xl font-black text-red-400 tabular-nums tracking-wider font-mono">
                {formatCountdown(seconds)}
              </div>
            )}
            {!isExpiring && (
              <div className="text-[10px] text-gray-600">
                Đừng tắt tab, bộ đếm sẽ tiếp tục chạy
              </div>
            )}
          </div>

          <div className="w-full border-t border-white/5" />

          <div className="w-full flex flex-col gap-3">
            <p className="text-xs text-gray-500">
              Nếu bạn cho rằng đây là nhầm lẫn, liên hệ hỗ trợ:
            </p>
            <div className="flex gap-3">
              <a
                href={SUPPORT_ZALO}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-colors"
              >
                <MessageCircle size={15} />
                Zalo
              </a>
              <a
                href={SUPPORT_TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-semibold hover:bg-sky-500/20 transition-colors"
              >
                <Send size={15} />
                Telegram
              </a>
            </div>
          </div>

          <p className="text-[10px] text-gray-700 leading-relaxed">
            Hệ thống ghi nhận: IP, thiết bị, trình duyệt và tài khoản. Cố tình
            vượt hệ thống có thể dẫn đến khoá vĩnh viễn.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_BAN_KEY = "_anv_ban";

function readLocalBan() {
  try {
    const raw = localStorage.getItem(LS_BAN_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.bannedUntil) return null;
    if (new Date(obj.bannedUntil) <= new Date()) {
      localStorage.removeItem(LS_BAN_KEY);
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

function writeLocalBan(info) {
  try {
    localStorage.setItem(LS_BAN_KEY, JSON.stringify(info));
  } catch {}
}

function clearLocalBan() {
  try {
    localStorage.removeItem(LS_BAN_KEY);
  } catch {}
  try {
    localStorage.removeItem("_anv_rl");
  } catch {}
}

// ── Main Provider ─────────────────────────────────────────────────────────────
export function AntispamProvider({ children }) {
  // Khởi tạo null (SSR-safe) — không gọi localStorage trên server → không hydration mismatch
  const [banInfo, setBanInfo] = useState(null);
  const checkedRef = useRef(false);

  const activateBan = useCallback((info) => {
    writeLocalBan(info);
    setBanInfo(info);
  }, []);

  const clearBan = useCallback(() => {
    clearLocalBan();
    setBanInfo(null);
    window.location.reload();
  }, []);

  // Chạy client-only TRƯỚC khi browser paint
  // Đọc localStorage → hiện overlay ngay nếu đang bị ban (kể cả sau Ctrl+F5)
  useLayoutEffect(() => {
    const localBan = readLocalBan();
    if (localBan) {
      setBanInfo(localBan);
    }
  }, []);

  // Check ban server + đếm reload
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const fp = getDeviceFingerprint();
    const currentBan = readLocalBan();

    // 1. Nếu chưa có ban local → xác nhận với server
    if (!currentBan) {
      fetch("/api/antispam/status", {
        headers: { "x-device-fp": fp },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.banned) {
            activateBan({ bannedUntil: data.bannedUntil, reason: data.reason });
          }
        })
        .catch(() => {});
    }

    // 2. Đếm số lần reload — chỉ khi chưa bị ban
    if (currentBan) {
      return;
    }

    const RELOAD_LIMIT = 25;
    const RELOAD_WINDOW = 3 * 60_000;
    const LS_RL_KEY = "_anv_rl";

    try {
      const now = Date.now();
      const raw = localStorage.getItem(LS_RL_KEY);
      let times = [];
      try {
        times = JSON.parse(raw) || [];
      } catch {}

      times = times.filter((t) => now - t <= RELOAD_WINDOW);
      times.push(now);
      localStorage.setItem(LS_RL_KEY, JSON.stringify(times));

      const reloadCount = times.length;

      if (reloadCount >= RELOAD_LIMIT) {
        const windowMs = now - Math.min(...times);
        const banUntil = new Date(now + 20 * 60_000).toISOString();
        const reason = `Tải lại trang quá nhiều: ${reloadCount} lần trong ${Math.round(windowMs / 60000)} phút`;

        localStorage.removeItem(LS_RL_KEY);
        activateBan({ bannedUntil: banUntil, reason });

        fetch("/api/antispam/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-fp": fp,
          },
          body: JSON.stringify({ action: "page_reload", reloadCount, windowMs }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.banned && data.bannedUntil) {
              activateBan({ bannedUntil: data.bannedUntil, reason: data.reason });
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Intercept mọi fetch → inject fingerprint header + bắt 403 spam_ban
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      const [input, init = {}] = args;
      const url = typeof input === "string" ? input : input?.url || "";

      if (url.startsWith("/api/")) {
        const fp = getDeviceFingerprint();
        init.headers = {
          ...(init.headers || {}),
          "x-device-fp": fp,
        };
      }

      const response = await originalFetch(input, init);

      if (response.status === 403) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          if (data?.spam_ban?.banned) {
            activateBan({
              bannedUntil: data.spam_ban.bannedUntil,
              reason: data.spam_ban.reason,
            });
          }
        } catch {}
      } else if (response.status === 401 && url.startsWith("/api/")) {
        // Session expired or invalid on server -> force local signout
        import("@/store/useAuthStore").then(({ useAuthStore }) => {
          const auth = useAuthStore.getState();
          if (auth.user) {
            auth.signOut();
          }
        });
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [activateBan]);

  // Khi bị ban: ẩn TOÀN BỘ web, chỉ hiện overlay
  if (banInfo) {
    return (
      <AntispamOverlay
        bannedUntil={banInfo.bannedUntil}
        reason={banInfo.reason}
        onExpired={clearBan}
      />
    );
  }

  return <>{children}</>;
}

export { getDeviceFingerprint };
