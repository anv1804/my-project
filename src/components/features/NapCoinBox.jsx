"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Coins, QrCode, Copy, Check, RefreshCw, CheckCircle2,
  Clock, Wallet, Info, Zap, Building2, Hash, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { syncCoins } from "@/utils/coinService";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

const PACKAGES = [
  { amount: 10000 },
  { amount: 20000 },
  { amount: 50000 },
  { amount: 100000 },
  { amount: 200000 },
  { amount: 500000 },
];

const EXPIRY_SECONDS = 15 * 60;

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);
const fmtTimer = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

function InfoRow({ label, value, onCopy, copied, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-md px-3 py-2.5">
      <span className="text-[var(--color-binance-gray)] text-xs whitespace-nowrap shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`font-mono text-xs truncate ${highlight ? "text-[var(--color-binance-yellow)] font-bold" : "text-[var(--color-binance-light)]"}`}>
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="shrink-0 text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer"
          >
            {copied
              ? <Check size={13} className="text-[var(--color-binance-success)]" />
              : <Copy size={13} />
            }
          </button>
        )}
      </div>
    </div>
  );
}

export default function NapCoinBox({ onSuccess } = {}) {
  const { user, profile, openLoginModal } = useAuthStore();

  const [selectedAmount, setSelectedAmount] = useState(50000);
  const [customRaw, setCustomRaw] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | pending | completed | expired
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState("");
  const [polling, setPolling] = useState(false);
  const completedRef = useRef(false);

  const finalAmount = useCustom
    ? (parseInt(customRaw.replace(/\D/g, "")) || 0)
    : selectedAmount;

  // Countdown timer
  useEffect(() => {
    if (!order || status !== "pending") return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(order.expiresAt) - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setStatus("expired");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order, status]);

  // Supabase Realtime subscription for this order
  useEffect(() => {
    if (!order || status !== "pending" || !user) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`coin-tx-${order.reference}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "coin_transactions",
          filter: `reference=eq.${order.reference}`,
        },
        async (payload) => {
          if (payload.new.status === "completed" && !completedRef.current) {
            completedRef.current = true;
            setStatus("completed");
            await syncCoins();
            toast.success("Nạp coin thành công!");
            onSuccess?.();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [order, status, user]);

  // Fallback polling every 8s (in case realtime misses)
  const checkStatus = useCallback(async () => {
    if (!order || !user || polling) return;
    setPolling(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("coin_transactions")
        .select("status")
        .eq("reference", order.reference)
        .single();
      if (data?.status === "completed" && !completedRef.current) {
        completedRef.current = true;
        setStatus("completed");
        await syncCoins();
        toast.success("Nạp coin thành công!");
        onSuccess?.();
      }
    } catch {}
    setPolling(false);
  }, [order, user, polling]);

  useEffect(() => {
    if (status !== "pending" || !order) return;
    const t = setInterval(checkStatus, 8000);
    return () => clearInterval(t);
  }, [status, order, checkStatus]);

  const handleCreate = async () => {
    if (!user) {
      openLoginModal("Vui lòng đăng nhập để nạp coin!");
      return;
    }
    if (finalAmount < 10000) {
      toast.error("Số tiền tối thiểu là 10.000 VND");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      completedRef.current = false;
      setOrder(data.order);
      setStatus("pending");
    } catch (err) {
      toast.error(err.message || "Không thể tạo đơn nạp coin");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const reset = () => {
    setOrder(null);
    setStatus("idle");
    setSecondsLeft(0);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* ─── LEFT: selector + form ─── */}
      <div className="flex flex-col gap-5">

        {/* Coin balance */}
        {user && (
          <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[var(--color-binance-gray)]">
              <Wallet size={15} /> Số dư hiện tại
            </div>
            <div className="flex items-center gap-1.5">
              <Coins size={16} className="text-[var(--color-binance-yellow)]" />
              <span className="text-lg font-bold text-[var(--color-binance-yellow)] tabular-nums">
                {fmt(profile?.coins ?? 0)}
              </span>
              <span className="text-xs text-[var(--color-binance-gray)]">coin</span>
            </div>
          </div>
        )}

        {/* Package grid */}
        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-[var(--color-binance-gray)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={13} className="text-[var(--color-binance-yellow)]" />
            Chọn gói nạp (VND = Coin)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
            {PACKAGES.map(({ amount }) => {
              const isSel = !useCustom && selectedAmount === amount;
              return (
                <button
                  key={amount}
                  onClick={() => { setSelectedAmount(amount); setUseCustom(false); }}
                  className={`p-3 rounded-md border text-center transition-all cursor-pointer ${
                    isSel
                      ? "border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]"
                      : "border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)] hover:border-gray-500 hover:text-white"
                  }`}
                >
                  <div className="text-sm font-bold leading-tight">{fmt(amount)}</div>
                  <div className="text-[10px] mt-0.5 opacity-60">coin</div>
                </button>
              );
            })}
          </div>

          {/* Custom amount */}
          <div>
            <button
              onClick={() => setUseCustom((v) => !v)}
              className="flex items-center gap-2 text-xs text-[var(--color-binance-gray)] hover:text-white transition-colors mb-2 cursor-pointer"
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                useCustom ? "bg-[var(--color-binance-yellow)] border-[var(--color-binance-yellow)]" : "border-[var(--color-binance-gray)]"
              }`}>
                {useCustom && <Check size={9} className="text-black" />}
              </span>
              Nhập số tiền khác
            </button>
            {useCustom && (
              <div className="relative animate-in fade-in slide-in-from-top-2 duration-150">
                <Input
                  placeholder="Nhập số tiền (tối thiểu 10.000)"
                  value={customRaw ? fmt(parseInt(customRaw.replace(/\D/g, ""))) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setCustomRaw(raw);
                  }}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-binance-gray)]">VND</span>
              </div>
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-lg p-4">
          <div className="flex gap-2.5">
            <Info size={14} className="text-[var(--color-binance-yellow)] shrink-0 mt-0.5" />
            <ul className="text-xs text-[var(--color-binance-gray)] space-y-1.5 leading-relaxed">
              <li><strong className="text-white">1 VND = 1 Coin.</strong> Số coin nhận đúng bằng số tiền chuyển.</li>
              <li>Hệ thống tự động xác nhận trong <strong className="text-white">1–5 phút</strong> sau khi nhận giao dịch.</li>
              <li><strong className="text-white">Giữ nguyên nội dung</strong> chuyển khoản để hệ thống nhận diện đúng đơn.</li>
              <li>Mã QR có hiệu lực trong <strong className="text-white">15 phút</strong>. Hết hạn, tạo đơn mới.</li>
            </ul>
          </div>
        </div>

        {/* Create button */}
        {status !== "pending" && (
          <Button
            onClick={handleCreate}
            disabled={loading || finalAmount < 10000 || status === "pending"}
            className="w-full h-12 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <><RefreshCw size={17} className="animate-spin" /> Đang tạo đơn...</>
            ) : (
              <>
                <QrCode size={17} />
                {finalAmount >= 10000
                  ? `Tạo QR nạp ${fmt(finalAmount)} coin`
                  : "Tạo mã QR nạp coin"
                }
              </>
            )}
          </Button>
        )}
      </div>

      {/* ─── RIGHT: QR / status ─── */}
      <div className="flex flex-col">
        {status === "idle" && (
          <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg flex-1 flex flex-col items-center justify-center gap-4 min-h-[380px] p-5 sm:p-8">
            <div className="w-20 h-20 rounded-full bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] flex items-center justify-center">
              <QrCode size={36} className="text-[var(--color-binance-gray)]" />
            </div>
            <div className="text-center">
              <p className="text-[var(--color-binance-light)] font-medium">Chọn gói và tạo mã QR</p>
              <p className="text-[var(--color-binance-gray)] text-sm mt-1">
                Mã VietQR sẽ hiển thị tại đây
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 mt-2">
              <div className="flex items-center gap-3 text-[var(--color-binance-gray)] text-xs">
                {["Chọn gói", "Quét QR", "Nhận coin"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight size={12} />}
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(status === "pending" || status === "expired") && order && (
          <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--color-binance-border)] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-binance-light)]">Quét QR chuyển khoản</div>
                <div className="text-xs text-[var(--color-binance-gray)] mt-0.5">Dùng app ngân hàng bất kỳ</div>
              </div>
              {status === "pending" ? (
                <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-md border transition-colors ${
                  secondsLeft > 60
                    ? "text-[var(--color-binance-yellow)] border-[var(--color-binance-yellow)]/30 bg-[var(--color-binance-yellow)]/10"
                    : "text-red-400 border-red-400/30 bg-red-400/10 animate-pulse"
                }`}>
                  <Clock size={13} /> {fmtTimer(secondsLeft)}
                </div>
              ) : (
                <span className="text-xs text-[var(--color-binance-gray)] bg-gray-500/10 border border-gray-500/20 px-3 py-1.5 rounded-md">
                  Hết hạn
                </span>
              )}
            </div>

            {/* QR image */}
            <div className={`p-6 flex flex-col items-center gap-5 ${status === "expired" ? "opacity-40 grayscale pointer-events-none select-none" : ""}`}>
              <div className="bg-white p-3 rounded-xl shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.qrUrl}
                  alt="VietQR"
                  width={220}
                  height={220}
                  className="block w-full max-w-[220px] h-auto"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>

              {/* Transfer details */}
              <div className="w-full flex flex-col gap-2">
                <InfoRow
                  label="Ngân hàng"
                  value={order.bankName}
                />
                <InfoRow
                  label="Số tài khoản"
                  value={order.accountNo}
                  onCopy={() => copyText(order.accountNo, "acc")}
                  copied={copied === "acc"}
                />
                <InfoRow
                  label="Chủ tài khoản"
                  value={order.accountName}
                />
                <InfoRow
                  label="Số tiền"
                  value={`${fmt(order.amount)} VND`}
                  onCopy={() => copyText(String(order.amount), "amt")}
                  copied={copied === "amt"}
                  highlight
                />
                <InfoRow
                  label="Nội dung CK"
                  value={order.reference}
                  onCopy={() => copyText(order.reference, "ref")}
                  copied={copied === "ref"}
                  highlight
                />
              </div>

              {status === "pending" && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-binance-gray)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-binance-yellow)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-binance-yellow)]" />
                  </span>
                  Đang chờ xác nhận giao dịch tự động...
                </div>
              )}
            </div>

            {/* Expired footer */}
            {status === "expired" && (
              <div className="px-5 pb-5">
                <Button onClick={reset} className="w-full flex items-center justify-center gap-2">
                  <RefreshCw size={15} /> Tạo đơn mới
                </Button>
              </div>
            )}
          </div>
        )}

        {status === "completed" && order && (
          <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-success)]/40 rounded-lg flex-1 flex flex-col items-center justify-center gap-5 min-h-[380px] p-5 sm:p-8">
            <div className="w-24 h-24 rounded-full bg-[var(--color-binance-success)]/10 border-2 border-[var(--color-binance-success)]/30 flex items-center justify-center">
              <CheckCircle2 size={44} className="text-[var(--color-binance-success)]" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--color-binance-success)]">Nạp coin thành công!</p>
              <p className="text-[var(--color-binance-gray)] text-sm mt-1">
                Đã nhận <strong className="text-white">+{fmt(order.amount)} coin</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[var(--color-binance-yellow)]/10 border border-[var(--color-binance-yellow)]/25 rounded-lg px-5 py-3">
              <Coins size={20} className="text-[var(--color-binance-yellow)]" />
              <span className="text-2xl font-black text-[var(--color-binance-yellow)] tabular-nums">
                {fmt(profile?.coins ?? 0)}
              </span>
              <span className="text-sm text-[var(--color-binance-gray)]">coin</span>
            </div>
            <Button onClick={reset} variant="outline" className="w-full flex items-center justify-center gap-2">
              <Coins size={15} /> Nạp thêm coin
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
