"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { History, TrendingUp, TrendingDown, Clock, Search, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function CoinHistoryPage() {
  const { user, profile } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        action: filterAction,
      });
      if (search) params.append("search", search);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/coins/history?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.data || []);
        setTotalPages(data.totalPages || 1);
        setPage(pageNum);
      } else {
        toast.error(data.message || "Không thể tải lịch sử biến động số dư");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetchHistory(1);
    } else {
      setLoading(false);
    }
  }, [user, filterAction, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const actionMap = {
    coin_topup: "Nạp Coin",
    coin_refund: "Hoàn tiền",
    coin_deduct: "Tiêu thụ",
    otp_rent: "Thuê số OTP",
    smm_order: "Mua dịch vụ SMM",
  };

  const formatActionName = (action) => {
    return actionMap[action] || action;
  };

  if (!mounted) return null;

  if (!user && !loading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold mb-4">Vui lòng đăng nhập</h2>
        <p className="text-[var(--color-binance-gray)]">Bạn cần đăng nhập để xem lịch sử biến động số dư.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--color-binance-border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-binance-light)]">Biến động số dư</h1>
            <p className="text-sm text-[var(--color-binance-gray)] mt-1">
              Lịch sử nạp, tiêu thụ và hoàn tiền Coin
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-[var(--color-binance-darker)] px-4 py-2 rounded-lg border border-[var(--color-binance-border)]">
          <span className="text-sm text-[var(--color-binance-gray)]">Số dư hiện tại:</span>
          <span className="text-lg font-bold text-[var(--color-binance-yellow)]">
            {new Intl.NumberFormat("vi-VN").format(profile?.coins || 0)} <span className="text-sm">Coin</span>
          </span>
        </div>
      </div>

      <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-binance-border)] bg-[var(--color-binance-darker)]/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-binance-yellow)]" />
              Lịch sử giao dịch
            </h2>
            <button 
              onClick={() => fetchHistory(1)}
              disabled={loading}
              className="flex items-center gap-2 text-xs text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-[var(--color-binance-gray)]" />
              </div>
              <input
                type="text"
                placeholder="Tìm theo ID giao dịch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] transition-colors"
              />
            </form>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--color-binance-yellow)] transition-colors">
                <span className="text-xs text-[var(--color-binance-gray)] whitespace-nowrap">Từ ngày:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-sm text-[var(--color-binance-light)] focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center gap-2 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--color-binance-yellow)] transition-colors">
                <span className="text-xs text-[var(--color-binance-gray)] whitespace-nowrap">Đến:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-sm text-[var(--color-binance-light)] focus:outline-none [color-scheme:dark]"
                />
              </div>

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] transition-colors"
              >
                <option value="all">Tất cả giao dịch</option>
                <option value="coin_topup">Nạp Coin</option>
                <option value="coin_refund">Hoàn tiền</option>
                <option value="coin_deduct">Tiêu thụ chung</option>
                <option value="otp_rent">Thuê số OTP</option>
                <option value="smm_order">Mua dịch vụ SMM</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)]">
              <tr>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Giao dịch</th>
                <th className="px-4 py-3 font-medium text-right">Số lượng</th>
                <th className="px-4 py-3 font-medium text-right">Số dư còn lại</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-binance-border)]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-[var(--color-binance-gray)]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" /> Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-[var(--color-binance-gray)]">
                    Chưa có biến động số dư nào
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isPositive = log.coins_delta > 0;
                  
                  return (
                    <tr key={log.id} className="hover:bg-[var(--color-binance-darker)]/40 transition-colors">
                      <td className="px-4 py-3 text-[var(--color-binance-gray)] whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--color-binance-light)]">
                          {formatActionName(log.action)}
                        </div>
                        {log.ref_id && (
                          <div className="text-xs text-[var(--color-binance-gray)] font-mono mt-0.5">
                            Ref: {log.ref_id}
                          </div>
                        )}
                        {log.metadata?.service_id && (
                          <div className="text-xs text-[var(--color-binance-gray)] mt-0.5">
                            Dịch vụ: {log.metadata.service_id}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        <div className={`flex items-center justify-end gap-1 ${isPositive ? "text-[var(--color-binance-success)]" : "text-red-400"}`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isPositive ? "+" : ""}{new Intl.NumberFormat("vi-VN").format(log.coins_delta)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap text-[var(--color-binance-light)]">
                        {log.coins_after !== null && log.coins_after !== undefined 
                          ? new Intl.NumberFormat("vi-VN").format(log.coins_after) 
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {log.status === "success" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Thất bại
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-binance-border)] bg-[var(--color-binance-darker)]/50">
            <span className="text-sm text-[var(--color-binance-gray)]">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchHistory(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 rounded bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] text-sm disabled:opacity-50 hover:bg-[var(--color-binance-border)] transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => fetchHistory(page + 1)}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 rounded bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] text-sm disabled:opacity-50 hover:bg-[var(--color-binance-border)] transition-colors"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
