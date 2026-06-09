"use client";

import { X, Mail, Eye, EyeOff, LogOut, User } from "lucide-react";
import Link from "next/link";
import Button from "@/components/common/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginModalMessage, user, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuthStore();
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoginModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  // Đang đăng nhập rồi → Hiển thị thông tin user
  if (user) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeLoginModal} />
        <div className="relative w-full max-w-sm bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-2xl shadow-2xl p-8 m-4">
          <button onClick={closeLoginModal} className="absolute top-4 right-4 p-2 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-binance-yellow)]/10 border-2 border-[var(--color-binance-yellow)]/30 flex items-center justify-center mx-auto mb-4">
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover" alt="avatar" />
                : <User size={28} className="text-[var(--color-binance-yellow)]" />
              }
            </div>
            <h2 className="text-xl font-bold text-[var(--color-binance-light)]">
              {user.user_metadata?.full_name || user.user_metadata?.display_name || "Người dùng"}
            </h2>
            <p className="text-sm text-[var(--color-binance-gray)] mt-1">{user.email}</p>
            <Button
              variant="outline"
              className="mt-6 w-full flex items-center justify-center gap-2 text-red-400 border-red-400/30 hover:border-red-400"
              onClick={async () => { await signOut(); closeLoginModal(); toast.success("Đã đăng xuất!"); }}
            >
              <LogOut size={16} /> Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      toast.error("Đăng nhập Google thất bại. Vui lòng thử lại!");
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (tab === "login") {
        await signInWithEmail(email, password);
        toast.success("Đăng nhập thành công!");
        closeLoginModal();
      } else {
        await signUpWithEmail(email, password, displayName);
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
        closeLoginModal();
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeLoginModal} />

      <div className="relative w-full max-w-md bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-2xl shadow-2xl p-8 m-4 animate-in zoom-in-95 fade-in duration-300">
        <button onClick={closeLoginModal} className="absolute top-4 right-4 p-2 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] hover:bg-[var(--color-binance-border)]/50 rounded-full transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-binance-yellow)] mb-4 shadow-[0_0_15px_rgba(240,185,11,0.3)]">
            <span className="text-2xl font-bold text-black">A</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-binance-light)] mb-1">
            {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h2>
          <p className="text-[var(--color-binance-gray)] text-sm">{loginModalMessage}</p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors mb-4"
        >
          <GoogleIcon />
          Tiếp tục với Google
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-binance-border)]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)]">Hoặc dùng Email</span>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-[var(--color-binance-dark)] rounded-lg p-1 mb-5">
          {["login", "register"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === t ? "bg-[var(--color-binance-yellow)] text-black" : "text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)]"}`}>
              {t === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          {tab === "register" && (
            <input
              type="text" placeholder="Tên hiển thị" value={displayName}
              onChange={e => setDisplayName(e.target.value)} required
              className="w-full bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-binance-light)] outline-none focus:border-[var(--color-binance-yellow)] transition-colors placeholder-[var(--color-binance-gray)]"
            />
          )}
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-binance-light)] outline-none focus:border-[var(--color-binance-yellow)] transition-colors placeholder-[var(--color-binance-gray)]"
          />
          <div className="relative">
            <input
              type={showPass ? "text" : "password"} placeholder="Mật khẩu" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-4 py-3 pr-12 text-sm text-[var(--color-binance-light)] outline-none focus:border-[var(--color-binance-yellow)] transition-colors placeholder-[var(--color-binance-gray)]"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button variant="primary" type="submit" className="w-full mt-1" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-[var(--color-binance-gray)]">
          Bằng việc đăng nhập, bạn đồng ý với{" "}
          <Link href="/terms" onClick={closeLoginModal} className="text-[var(--color-binance-yellow)] hover:underline">Điều khoản</Link>
          {" "}và{" "}
          <Link href="/privacy" onClick={closeLoginModal} className="text-[var(--color-binance-yellow)] hover:underline">Chính sách</Link>.
        </div>
      </div>
    </div>
  );
}
