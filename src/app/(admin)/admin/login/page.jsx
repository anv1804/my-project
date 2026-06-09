"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Lỗi kết nối Server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#0071E3] rounded-[14px] mx-auto mb-4 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Quản trị viên</h1>
          <p className="text-sm text-slate-500 mt-1">Đăng nhập để vào hệ thống</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input 
              type="text" 
              placeholder="Tài khoản" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[14px] px-4 py-3.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition-all"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-[14px] px-4 py-3.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0071E3] text-white rounded-[14px] px-4 py-3.5 text-[15px] font-medium hover:bg-[#0060C0] transition-colors disabled:opacity-50 mt-2 shadow-sm cursor-pointer"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
