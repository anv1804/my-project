"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import OtpHistoryBox from "./OtpHistoryBox";
import WebScrcpy from "./WebScrcpy";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import {
  Phone, RefreshCw, Search, Copy, Check, Timer,
  Globe, Wifi, AlertCircle, History, FileText,
  Volume2, VolumeX, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Calendar,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useAuthStore } from "@/store/useAuthStore";
import { setStoreCoins, getCoins } from "@/utils/coinService";
import { createClient } from "@/utils/supabase/client";

// Giá hiển thị = giá ViOTP × 2, đơn vị coin
const formatCoin = (num) => {
  if (num == null) return "0 coin";
  return new Intl.NumberFormat("vi-VN").format(Math.round(num * 2)) + " coin";
};

// Phát hiện nhà mạng từ số điện thoại
function detectCarrier(phoneNumber, countryCode) {
  if (!phoneNumber) return null;
  // Chuẩn hoá: bỏ country code, lấy 10 chữ số trong nước
  const raw = String(phoneNumber).replace(/\D/g, "");
  // Với VN (84): đầu số 10 chữ số bắt đầu 0, hoặc 9 chữ số không 0
  // Thường phone_number trả về dạng "84xxxxxxxxx" hoặc "0xxxxxxxxx" hoặc "xxxxxxxxx"
  let local = raw;
  if (countryCode && raw.startsWith(String(countryCode).replace("+", ""))) {
    local = "0" + raw.slice(String(countryCode).replace("+", "").length);
  }
  if (!local.startsWith("0") && local.length === 9) local = "0" + local;

  // ── Việt Nam ──────────────────────────────────────────────────────────────
  if (!countryCode || countryCode === "84" || countryCode === "+84") {
    const pre3 = local.slice(0, 3); // 03x, 05x...
    const pre4 = local.slice(0, 4); // 0322...

    const viettel = ["032","033","034","035","036","037","038","039","086","096","097","098"];
    const mobifone = ["070","072","073","074","075","076","077","078","079","089","090","093"];
    const vinaphone = ["081","082","083","084","085","088","091","094"];
    const vietnamobile = ["052","056","058","092"];
    const gmobile = ["059","099"];
    const reddi = ["055"];
    const itelecom = ["087"];

    if (viettel.includes(pre3))      return { name: "Viettel",      color: "#e53935", bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400" };
    if (mobifone.includes(pre3))     return { name: "Mobifone",     color: "#1e88e5", bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400" };
    if (vinaphone.includes(pre3))    return { name: "Vinaphone",    color: "#43a047", bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400" };
    if (vietnamobile.includes(pre3)) return { name: "Vietnamobile", color: "#fb8c00", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" };
    if (gmobile.includes(pre3))      return { name: "Gmobile",      color: "#8e24aa", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" };
    if (reddi.includes(pre3))        return { name: "Reddi",        color: "#00acc1", bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   text: "text-cyan-400" };
    if (itelecom.includes(pre3))     return { name: "Indochina",    color: "#6d4c41", bg: "bg-stone-500/10",  border: "border-stone-500/30",  text: "text-stone-400" };
  }

  // ── Lào (856) ─────────────────────────────────────────────────────────────
  if (countryCode === "856" || countryCode === "+856") {
    const pre = local.slice(0, 4);
    if (["020"].includes(local.slice(0,3))) {
      const d4 = local.slice(0, 5);
      if (["02054","02055"].includes(d4)) return { name: "Unitel",   color: "#e53935", bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400" };
      if (["02058","02059"].includes(d4)) return { name: "LaoTel",   color: "#1e88e5", bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400" };
      if (["02077","02078"].includes(d4)) return { name: "ETL",      color: "#43a047", bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400" };
      if (["02091","02092"].includes(d4)) return { name: "Beeline",  color: "#fb8c00", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" };
    }
  }

  return null;
}


// Brand icon using local image files
const BrandIcon = ({ name, className = "w-4.5 h-4.5 rounded-sm object-contain" }) => {
  const n = name?.toLowerCase();
  const src = ["gmail", "telegram", "facebook", "shopee", "viber", "tiktok"].includes(n)
    ? `/logos/${n}.svg`
    : `/logos/default.svg`;
  return (
    <img
      src={src}
      alt={name}
      className={className}
      onError={(e) => {
        e.target.src = "/logos/default.svg";
      }}
    />
  );
};

// Network brand config
const NETWORK_CONFIG = {
  MOBIFONE:     { color: "#0080C6", label: "Mobifone" },
  VINAPHONE:    { color: "#CC0000", label: "Vinaphone" },
  VIETTEL:      { color: "#E30613", label: "Viettel" },
  VIETNAMOBILE: { color: "#FF6D00", label: "Vietnamobile" },
  ITELECOM:     { color: "#9B51E0", label: "iTel" },
  WINTEL:       { color: "#0EA5E9", label: "Wintel" },
  UNITEL:       { color: "#006A4E", label: "Unitel" },
  ETL:          { color: "#0047AB", label: "ETL" },
  BEELINE:      { color: "#EC4899", label: "Tplus" },
  TPLUS:        { color: "#EC4899", label: "Tplus" },
  LAOTEL:       { color: "#EA580C", label: "LTC" },
  LTC:          { color: "#EA580C", label: "LTC" },
};

export default function OtpRentBox() {
  const { user, profile, openLoginModal } = useAuthStore();
  const searchParams = useSearchParams();

  const [isConnected, setIsConnected] = useState(false);

  // Rental parameters
  const [country, setCountry] = useState("vn");
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);

  // Advanced parameters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [exceptPrefix, setExceptPrefix] = useState("");
  const [customNumber, setCustomNumber] = useState("");

  const [mounted, setMounted] = useState(false);
  const [activeRentals, setActiveRentals] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(0);

  // Parse query parameters for re-renting
  useEffect(() => {
    if (!searchParams) return;
    const rePhone = searchParams.get("re_phone_number");
    const svcId = searchParams.get("service_id");
    if (rePhone) {
      setCustomNumber(rePhone);
      setShowAdvanced(true);
    }
    if (svcId && services.length) {
      const matched = services.find(s => String(s.id) === String(svcId));
      if (matched) setSelectedService(matched);
    }
  }, [searchParams, services]);

  // Load localStorage + đồng bộ pending rentals từ DB sau khi hydration
  useEffect(() => {
    const supabase = createClient();
    const { user } = useAuthStore.getState();

    // Đọc localStorage trước
    let localRentals = [];
    try {
      const saved = localStorage.getItem("otp_active_rentals");
      if (saved) localRentals = JSON.parse(saved);
    } catch {}

    // Dùng String() để tránh type mismatch number vs string
    const localIds = new Set(localRentals.map(r => String(r.request_id)));

    // Dedup helper — luôn dùng khi merge để tránh duplicate key
    const dedup = (list) => {
      const seen = new Set();
      return list.filter(r => {
        const key = String(r.request_id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Fetch pending rentals từ DB, merge những cái chưa có trong localStorage
    const syncFromDb = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("otp_rentals")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", 0)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data?.length) {
          const fromDb = data
            .filter(r => !localIds.has(String(r.request_id)))
            .map(r => ({
              request_id: r.request_id,
              phone_number: r.phone_number,
              countryISO: r.country?.toUpperCase() || "VN",
              countryCode: r.country === "vn" ? "84" : "856",
              service_name: r.service_name,
              service_id: r.service_id,
              price: r.coin_cost / 2,
              coinCost: r.coin_cost,
              status: 0,
              code: "",
              smsContent: "",
              isSound: false,
              createdAt: r.created_at,
            }));
          if (fromDb.length) {
            startTransition(() => setActiveRentals(prev => dedup([...fromDb, ...prev])));
          }
        }
      } catch {}
    };

    startTransition(() => {
      if (localRentals.length) setActiveRentals(localRentals);
      try {
        const s = localStorage.getItem("otp_sound_enabled");
        if (s !== null) setSoundEnabled(s === "true");
      } catch {}
      setMounted(true);
    });

    syncFromDb();
  }, []);

  const rentInFlightRef = useRef(false);

  // Loading flags
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingRent, setLoadingRent] = useState(false);

  const [activeTab, setActiveTab] = useState("rent");
  const [copiedText, copy] = useCopyToClipboard();

  const popularServices = [
    { id: 3,  name: "Gmail",    search: "gmail" },
    { id: 19, name: "Telegram", search: "telegram" },
    { id: 7,  name: "Facebook", search: "facebook" },
    { id: 4,  name: "Shopee",   search: "shopee" },
    { id: 99, name: "Viber",    search: "viber" },
    { id: 86, name: "TikTok",   search: "tiktok" },
  ];

  // Auto-connect on mount — localStorage state is already restored via lazy initializers above
  useEffect(() => {
    // Auto-connect: server-side token, no user input needed
    (async () => {
      setLoadingServices(true);
      try {
        const [svcRes, netRes] = await Promise.all([
          fetch(`/api/otp?path=service/getv2&country=vn`),
          fetch(`/api/otp?path=networks/get`),
        ]);
        const svcData = await svcRes.json();
        const netData = await netRes.json();

        if (svcData.status_code === 200 && svcData.success) {
          setServices(svcData.data.sort((a, b) => a.name.localeCompare(b.name)));
          setIsConnected(true);
        }
        if (netData.status_code === 200 && netData.success) {
          const vnNames = ["MOBIFONE", "VINAPHONE", "VIETTEL", "VIETNAMOBILE", "ITELECOM", "WINTEL"];
          setNetworks(netData.data.filter(n => vnNames.includes(n.name)));
        }
      } catch {
        toast.error("Không thể kết nối hệ thống OTP. Vui lòng thử lại!");
      } finally {
        setLoadingServices(false);
      }
    })();
  }, []);

  // Tick countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Re-fetch when country changes
  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      setLoadingServices(true);
      try {
        const [svcRes, netRes] = await Promise.all([
          fetch(`/api/otp?path=service/getv2&country=${country}`),
          fetch(`/api/otp?path=networks/get`),
        ]);
        const svcData = await svcRes.json();
        const netData = await netRes.json();

        if (svcData.status_code === 200 && svcData.success) {
          const sorted = svcData.data.sort((a, b) => a.name.localeCompare(b.name));
          setServices(sorted);
          if (selectedService && !sorted.find(s => s.id === selectedService.id)) {
            setSelectedService(null);
          }
        }
        if (netData.status_code === 200 && netData.success) {
          const vnNames = ["MOBIFONE", "VINAPHONE", "VIETTEL", "VIETNAMOBILE", "ITELECOM", "WINTEL"];
          const laNames = ["UNITEL", "ETL", "BEELINE", "LAOTEL"];
          setNetworks(netData.data.filter(n =>
            country === "vn" ? vnNames.includes(n.name) : laNames.includes(n.name)
          ));
          setSelectedNetworks([]);
        }
      } catch {}
      finally {
        setLoadingServices(false);
      }
    })();
  }, [country]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save active rentals to localStorage
  useEffect(() => {
    localStorage.setItem("otp_active_rentals", JSON.stringify(activeRentals));
  }, [activeRentals]);

  const playAlertSound = () => {
    try {
      const audio = new Audio("/notification-a.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };


  // Polling for waiting rentals (every 4s)
  useEffect(() => {
    // Dedup trước khi poll — tránh hoàn coin nhiều lần do duplicate entry
    const seen = new Set();
    const waiting = activeRentals.filter(r => {
      const key = String(r.request_id);
      if (r.status !== 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (waiting.length === 0 || !isConnected) return;

    const id = setInterval(async () => {
      const updated = [...activeRentals];
      let changed = false;

      await Promise.all(waiting.map(async (rental) => {
        try {
          const res = await fetch(`/api/otp?path=session/getv2&requestId=${rental.request_id}`);
          if (!res.ok) return;
          const result = await res.json();
          if (result.success && result.data) {
            const newStatus = result.data.Status;
            if (newStatus !== 0) {
              const idx = updated.findIndex(r => String(r.request_id) === String(rental.request_id));
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  status: newStatus,
                  code: result.data.Code || "",
                  smsContent: result.data.SmsContent || "",
                  isSound: result.data.IsSound === "true" || result.data.IsSound === true,
                  price: result.data.Price || updated[idx].price,
                };
                changed = true;
                // Cập nhật DB + nhận kết quả hoàn coin từ server
                fetch('/api/otp-rental', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update',
                    request_id: rental.request_id,
                    status: newStatus,
                    code: result.data.Code || '',
                    sms_content: result.data.SmsContent || '',
                  }),
                }).then(r => r.json()).then(res => {
                  if (res.coinsNow != null) setStoreCoins(res.coinsNow);
                  if (res.coinRefunded > 0) {
                    toast.success(`Đã hoàn ${new Intl.NumberFormat("vi-VN").format(res.coinRefunded)} coin cho số ${rental.phone_number}`);
                  }
                }).catch(() => {});
                if (newStatus === 1) {
                  toast.success(`Nhận OTP thành công cho số ${rental.phone_number}!`);
                  if (soundEnabled) playAlertSound();
                } else if (newStatus === 2) {
                  updated[idx].expiredAt = Date.now();
                  toast.error(`Yêu cầu thuê số ${rental.phone_number} đã hết hạn!`);
                }
              }
            }
          }
        } catch {}
      }));

      if (changed) setActiveRentals(updated);
    }, 4000);

    return () => clearInterval(id);
  }, [activeRentals, isConnected, soundEnabled]);

  // Tự động xóa SIM hết hạn sau 1 phút
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setActiveRentals(prev => {
        const filtered = prev.filter(r => !(r.status === 2 && r.expiredAt && now - r.expiredAt >= 60000));
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const handleRent = async () => {
    if (!isConnected) { toast.error("Hệ thống chưa sẵn sàng, vui lòng đợi..."); return; }
    if (!selectedService) { toast.error("Vui lòng chọn một dịch vụ cần thuê!"); return; }
    if (!user) { openLoginModal("Vui lòng đăng nhập để thuê số OTP!"); return; }

    // Kiểm tra nhanh client-side (UX) — server sẽ validate lại
    const estimatedCost = Math.round(selectedService.price * 2);
    if (getCoins() < estimatedCost) {
      toast.error(`Không đủ coin! Cần khoảng ${new Intl.NumberFormat("vi-VN").format(estimatedCost)} coin.`);
      return;
    }

    // Chống double-click
    if (rentInFlightRef.current) return;
    rentInFlightRef.current = true;
    setLoadingRent(true);

    try {
      const res = await fetch('/api/otp-rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rent',
          service_id: selectedService.id,
          service_name: selectedService.name,
          country,
          networks: selectedNetworks,
          prefix: prefix.trim() || undefined,
          except_prefix: exceptPrefix.trim() || undefined,
          custom_number: customNumber.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const item = data.data;
        if (data.coinsNow != null) setStoreCoins(data.coinsNow);
        setActiveRentals(prev => [{
          request_id: item.request_id,
          phone_number: item.phone_number,
          re_phone_number: item.re_phone_number,
          countryISO: item.countryISO,
          countryCode: item.countryCode,
          service_name: selectedService.name,
          service_id: selectedService.id,
          price: selectedService.price,
          coinCost: data.coinCost ?? estimatedCost,
          status: 0,
          code: "",
          smsContent: "",
          isSound: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        const msg = data.rerentWindow
          ? `Thuê thành công: ${item.phone_number} (còn ${data.rerentWindow} phút để thuê lại)`
          : `Yêu cầu thuê số thành công: ${item.phone_number}`;
        toast.success(msg);
        if (customNumber) setCustomNumber("");
      } else {
        // coinsNow được trả về khi server đã refund
        if (data.coinsNow != null) setStoreCoins(data.coinsNow);
        toast.error(data.message || "Không thể thuê số.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối: " + err.message);
    } finally {
      rentInFlightRef.current = false;
      setLoadingRent(false);
    }
  };

  const toggleNetwork = (name) =>
    setSelectedNetworks(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const handleRemoveRental = (requestId) => {
    setActiveRentals(prev => prev.filter(r => String(r.request_id) !== String(requestId)));
  };

  const handleRentAgain = (rental) => {
    setCountry(rental.countryISO?.toLowerCase() === "vn" ? "vn" : "la");
    setCustomNumber(rental.phone_number);
    const matched = services.find(s => s.id === rental.service_id);
    setSelectedService(matched || { id: rental.service_id, name: rental.service_name, price: rental.price });
    setActiveTab("rent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full text-[var(--color-binance-light)]">

      {/* SECTION 1: STATUS + GUIDE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* System Status Card */}
        <div className="md:col-span-4 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-binance-border)] pb-3">
            <Wifi size={16} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-sm font-semibold">Trạng thái hệ thống</h2>
          </div>

          <div className="bg-[var(--color-binance-darker)] rounded-md p-4 border border-[var(--color-binance-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-[var(--color-binance-success)] animate-pulse" : "bg-[var(--color-binance-yellow)] animate-pulse"}`} />
              <div>
                <div className="text-[11px] text-[var(--color-binance-gray)] uppercase font-semibold">Dịch vụ OTP</div>
                <div className="text-sm font-medium">{isConnected ? "Đang hoạt động" : "Đang khởi động..."}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[var(--color-binance-gray)] uppercase font-semibold">Đơn vị</div>
              <div className="text-lg font-bold text-[var(--color-binance-yellow)]">Coin</div>
            </div>
          </div>

          <p className="text-[var(--color-binance-gray)] text-xs leading-relaxed">
            Hệ thống sử dụng đơn vị <strong className="text-[var(--color-binance-yellow)]">Coin</strong> cho mọi giao dịch. Nạp coin để thuê số OTP.
          </p>
        </div>

        {/* Instructions Card */}
        <div className="md:col-span-8 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 border-b border-[var(--color-binance-border)] pb-3">
            <FileText size={16} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-sm font-semibold">Hướng dẫn sử dụng</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-[var(--color-binance-gray)]">
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">1</span>
              <p>Chọn quốc gia <strong className="text-[var(--color-binance-light)]">Việt Nam / Lào</strong> và tìm kiếm ứng dụng muốn lấy OTP (Telegram, FB, Gmail...).</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">2</span>
              <p>Nhấp chọn nhà mạng (tuỳ chọn) rồi bấm <strong className="text-[var(--color-binance-light)]">&ldquo;Thuê số ngay&rdquo;</strong>. Hệ thống cấp số điện thoại ngay lập tức.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">3</span>
              <p>Nhập số điện thoại vào ứng dụng, đợi 1–3 phút. Mã OTP sẽ đồng bộ tự động bên dưới.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-[var(--color-binance-border)] flex items-center justify-center font-bold text-white flex-shrink-0">4</span>
              <p>Nếu số không nhận được tin nhắn, bạn <strong className="text-white">không bị trừ coin</strong>. Thời gian chờ tối đa 5–10 phút.</p>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: TABS */}
      <div className="flex border-b border-[var(--color-binance-border)] gap-2">
        <button
          onClick={() => setActiveTab("rent")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "rent" ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]" : "border-transparent text-[var(--color-binance-gray)] hover:text-white"}`}
        >
          <Phone size={16} /> Thuê số trực tuyến
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "history" ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]" : "border-transparent text-[var(--color-binance-gray)] hover:text-white"}`}
        >
          <History size={16} /> Lịch sử thuê
        </button>
      </div>

      {/* SECTION 3 & 4 & 5: MAIN LAYOUT (Trái / Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CỘT TRÁI: Form, History, Active Rentals */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {activeTab === "rent" ? (
            <>
              {/* Order Form Card */}
              <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg flex flex-col gap-5">
                {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-binance-gray)] uppercase tracking-wider mb-2">1. Chọn Quốc Gia</label>
              <div className="flex gap-3">
                {[{ code: "vn", label: "Việt Nam (VN)" }, { code: "la", label: "Lào (LA)" }].map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => setCountry(code)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-sm border text-sm font-medium transition-all cursor-pointer ${country === code ? "border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]" : "border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)] hover:border-gray-500 hover:text-white"}`}
                  >
                    <img
                      src={`/logos/${code}.svg`}
                      alt={label}
                      className="w-5 h-4 object-cover rounded-sm"
                      onError={(e) => {
                        e.target.src = "/logos/default.svg";
                      }}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-binance-gray)] uppercase tracking-wider mb-2">2. Chọn Dịch Vụ / Ứng Dụng</label>

              <div className="flex flex-wrap gap-2 mb-3">
                {popularServices.map((pop) => {
                  const isActive = selectedService?.name.toLowerCase().includes(pop.search);
                  return (
                    <button
                      key={pop.id}
                      onClick={() => {
                        setSearchQuery(pop.search);
                        const found = services.find(s => s.name.toLowerCase().includes(pop.search));
                        if (found) setSelectedService(found);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${isActive ? "bg-[var(--color-binance-yellow)] text-black font-semibold border-[var(--color-binance-yellow)]" : "bg-[var(--color-binance-darker)] border-[var(--color-binance-border)] text-[var(--color-binance-gray)] hover:text-white hover:border-gray-500"}`}
                    >
                      <BrandIcon name={pop.search} />
                      {pop.name}
                    </button>
                  );
                })}
              </div>

              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-binance-gray)]" />
                <Input
                  placeholder="Tìm kiếm ứng dụng (Ví dụ: Facebook, Telegram...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-sm max-h-48 overflow-y-auto">
                {loadingServices ? (
                  <div className="p-8 text-center text-[var(--color-binance-gray)] text-sm flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-[var(--color-binance-yellow)]" />
                    Đang tải danh sách dịch vụ...
                  </div>
                ) : filteredServices.length > 0 ? (
                  <div className="divide-y divide-[var(--color-binance-border)]/40">
                    {filteredServices.map((service) => {
                      const isSel = selectedService?.id === service.id;
                      return (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${isSel ? "bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)] font-semibold" : "hover:bg-[var(--color-binance-border)]/30"}`}
                        >
                          <span>{service.name}</span>
                          <span className={isSel ? "text-[var(--color-binance-yellow)]" : "text-[var(--color-binance-gray)]"}>
                            {formatCoin(service.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[var(--color-binance-gray)] text-sm">
                    {isConnected ? "Không tìm thấy dịch vụ nào phù hợp." : "Đang kết nối hệ thống..."}
                  </div>
                )}
              </div>
            </div>

            {/* Network */}
            {networks.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-binance-gray)] uppercase tracking-wider mb-2">
                  3. Chọn Nhà Mạng (Tùy chọn, để trống = Ngẫu nhiên)
                </label>
                <div className="flex flex-wrap gap-2">
                  {networks.map((net) => {
                    const isSel = selectedNetworks.includes(net.name);
                    const cfg = NETWORK_CONFIG[net.name] || { color: "#888", label: net.name };
                    return (
                      <button
                        key={net.id}
                        onClick={() => toggleNetwork(net.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-all cursor-pointer font-medium ${isSel ? "border-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)]" : "border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] text-[var(--color-binance-gray)] hover:text-white hover:border-gray-500"}`}
                      >
                        <img
                          src={`/logos/${net.name.toLowerCase()}.svg`}
                          alt={cfg.label}
                          className="w-5 h-5 rounded-md object-contain bg-white p-0.5"
                          onError={(e) => {
                            e.target.src = "/logos/default.svg";
                          }}
                        />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Advanced */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer"
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Cấu hình nâng cao (Đầu số / Thuê lại số cũ)
              </button>

              {showAdvanced && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--color-binance-darker)] p-4 rounded-md border border-[var(--color-binance-border)] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-binance-gray)] mb-1">Chỉ lấy đầu số (cách nhau bởi &apos;|&apos;)</label>
                    <Input placeholder="Ví dụ: 90|91|98" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-binance-gray)] mb-1">Tránh đầu số (cách nhau bởi &apos;|&apos;)</label>
                    <Input placeholder="Ví dụ: 94|96|97" value={exceptPrefix} onChange={(e) => setExceptPrefix(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-[var(--color-binance-gray)] mb-1">Thuê lại số điện thoại cũ</label>
                    <Input placeholder="Nhập số điện thoại gốc (84... hoặc 856...)" value={customNumber} onChange={(e) => setCustomNumber(e.target.value)} className="h-9 text-xs" />
                    <p className="text-[10px] text-[var(--color-binance-gray)] mt-1">
                      * Dùng giá trị &apos;re_phone_number&apos; hoặc &apos;PhoneOriginal&apos; để thuê lại số đã thuê trước đó.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary & Order */}
            <div className="border-t border-[var(--color-binance-border)] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="text-sm">
                {selectedService ? (
                  <div>
                    Đã chọn: <span className="font-semibold text-white">{selectedService.name}</span>
                    <span className="text-[var(--color-binance-yellow)] font-bold ml-2">({formatCoin(selectedService.price)})</span>
                  </div>
                ) : (
                  <span className="text-[var(--color-binance-gray)]">Chưa chọn dịch vụ</span>
                )}
              </div>

              <Button
                onClick={handleRent}
                disabled={loadingRent || !selectedService || !isConnected}
                className="w-full sm:w-48 h-11 flex items-center justify-center gap-2 text-base shadow-lg"
              >
                {loadingRent ? (
                  <><RefreshCw size={16} className="animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Phone size={16} /> Thuê Số Ngay</>
                )}
              </Button>
            </div>

            </div>
            {/* End of Order Form Card */}

            {/* Sound panel (Moved to Left Column) */}
            <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--color-binance-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Wifi size={16} className="text-[var(--color-binance-yellow)]" />
                  <h3 className="text-sm font-semibold">Quét Tín Hiệu Tin Nhắn</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-[10px] text-[var(--color-binance-gray)] uppercase">Auto 4s</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-binance-gray)]">Âm báo có OTP:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        localStorage.setItem("otp_sound_enabled", String(next));
                      }}
                      className={`p-1.5 rounded-md border transition-all cursor-pointer ${soundEnabled ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10" : "border-[var(--color-binance-border)] text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)]"}`}
                    >
                      {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                    <button
                      onClick={() => { playAlertSound(); toast.success("Đã phát âm thanh thông báo mẫu!"); }}
                      className="text-xs text-[var(--color-binance-gray)] hover:text-white hover:underline cursor-pointer"
                    >
                      Thử âm thanh
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)] p-3.5 rounded border border-[var(--color-binance-border)] leading-relaxed">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5 text-[13px]">
                    <AlertCircle size={14} className="text-[var(--color-binance-yellow)]" />
                    Lưu ý quan trọng
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] mt-1.5">
                    <li>Nếu số không nhận được tin nhắn, bạn sẽ <strong className="text-white">không bị trừ coin</strong>.</li>
                    <li>Thời gian chờ tin nhắn của SIM khoảng 5 – 10 phút.</li>
                    <li>Không đóng trang này khi đang chờ OTP để tránh gián đoạn tiến trình.</li>
                  </ul>
                </div>
              </div>
            </div>
            </>
          ) : (
            <OtpHistoryBox hideHeader={true} onRentAgain={handleRentAgain} />
          )}

        {/* ACTIVE RENTALS (Bây giờ nó nằm chung trong cột TRÁI và chạy dọc xuống) */}
        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b border-[var(--color-binance-border)] pb-3">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-[var(--color-binance-yellow)] shrink-0" />
              <h2 className="text-sm font-semibold whitespace-nowrap">SIM Đang Hoạt Động</h2>
            </div>
            <span suppressHydrationWarning className="bg-[var(--color-binance-border)]/50 text-white text-xs px-2.5 py-1 rounded-full font-mono">
              {activeRentals.length} số
            </span>
          </div>

          {activeRentals.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-binance-border)] rounded-xl">
              <div className="w-12 h-12 rounded-full bg-[var(--color-binance-darker)] flex items-center justify-center text-[var(--color-binance-gray)] mb-3">
                <Phone size={22} />
              </div>
              <p className="text-[var(--color-binance-gray)] text-sm">Chưa có số nào đang hoạt động</p>
              <p className="text-[var(--color-binance-gray)] text-xs mt-1 opacity-60">Thuê số ở khung bên trên để nhận OTP</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeRentals.map((rental) => {
                const durationSecs = 300;
                const elapsed = Math.floor((now - new Date(rental.createdAt).getTime()) / 1000);
                const remaining = Math.max(0, durationSecs - elapsed);
                const pct = (remaining / durationSecs) * 100;
                const m = Math.floor(remaining / 60);
                const s = remaining % 60;
                const formattedTime = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

                const isWaiting = rental.status === 0;
                const isCompleted = rental.status === 1;
                const isExpired = rental.status === 2 || (isWaiting && remaining === 0);
                const isPhoneCopied = copiedText === rental.phone_number;
                const isCodeCopied = copiedText === rental.code;
                const carrier = detectCarrier(rental.phone_number, rental.countryCode);

                const borderColor = isCompleted ? "#22c55e" : isExpired ? "#4b5563" : "#f0b90b";

                return (
                  <div
                    key={rental.request_id}
                    className={`relative rounded-xl border bg-[var(--color-binance-darker)]/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-black/20 overflow-hidden ${isExpired ? "opacity-55" : ""}`}
                    style={{ borderColor }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${borderColor}aa, transparent)` }} />

                    <div className="flex flex-col md:flex-row items-stretch md:items-center p-3 gap-4">
                      
                      {/* Cột 1: Thông tin dịch vụ */}
                      <div className="flex items-center gap-3 w-full md:w-[200px] shrink-0">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] flex items-center justify-center relative shadow-inner">
                          <BrandIcon name={rental.service_name?.toLowerCase()} />
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--color-binance-dark)] ${isCompleted ? "bg-green-500" : isExpired ? "bg-gray-500" : "bg-yellow-500 animate-pulse"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[var(--color-binance-light)] leading-snug truncate" title={rental.service_name}>{rental.service_name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Globe size={10} className="text-blue-400 shrink-0" />
                            <span className="text-[10px] font-semibold text-[var(--color-binance-gray)]">{rental.countryISO?.toUpperCase()}</span>
                            {carrier && (
                              <>
                                <span className="text-[10px] text-[var(--color-binance-gray)]/40">·</span>
                                <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-bold tracking-wide ${carrier.bg} border-transparent ${carrier.text}`}>
                                  {carrier.name}
                                </span>
                              </>
                            )}
                            <span className="text-[10px] text-[var(--color-binance-gray)]/40">·</span>
                            <span className="text-[10px] text-[var(--color-binance-yellow)] font-mono whitespace-nowrap">{formatCoin(rental.price)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cột 2: Số điện thoại */}
                      <div className="w-full md:w-[170px] shrink-0">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2 bg-[var(--color-binance-darker)] rounded-lg px-3 py-2 border border-[var(--color-binance-border)]/60">
                            <span className="font-mono font-bold text-white text-[13px] tracking-wide truncate">
                              {rental.countryCode ? `+${rental.countryCode} ` : ""}{rental.phone_number}
                            </span>
                            <button onClick={() => copy(rental.phone_number)} className="text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer shrink-0" title="Copy số điện thoại">
                              {isPhoneCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                          {isWaiting && !isExpired && (
                            <div className="flex items-center gap-2 px-1">
                              <div className="h-1 flex-1 bg-[var(--color-binance-border)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #f0b90b, #fbbf24)` }} />
                              </div>
                              <span className="font-mono text-[10px] text-yellow-400 shrink-0">{formattedTime}</span>
                            </div>
                          )}
                          {isCompleted && (
                            <div className="flex items-center gap-1.5 text-[10px] text-green-400 px-1 font-medium">
                              <CheckCircle2 size={10} /> Đã nhận được OTP
                            </div>
                          )}
                          {isExpired && (
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1 font-medium">
                              <XCircle size={10} /> Đã hết hạn
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cột 3: OTP Code */}
                      <div className="w-full md:flex-1">
                        <div className={`flex items-center justify-between gap-3 px-4 py-2 rounded-lg border h-[42px] ${
                          isCompleted && rental.code
                            ? "bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.08)]"
                            : "bg-[var(--color-binance-darker)] border-[var(--color-binance-border)]/60"
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`text-[10px] uppercase tracking-widest font-bold ${isCompleted && rental.code ? "text-green-400/80" : "text-[var(--color-binance-gray)]"}`}>
                              Mã OTP
                            </div>
                            {isCompleted && rental.code ? (
                              <span className="font-mono font-black text-green-400 text-xl tracking-[0.2em]">{rental.code}</span>
                            ) : (
                              <span className="font-mono text-xs text-[var(--color-binance-gray)]/40 italic">
                                {isExpired ? "Thất bại" : "Đang chờ..."}
                              </span>
                            )}
                          </div>
                          {isCompleted && rental.code && (
                            <button onClick={() => copy(rental.code)} className="shrink-0 flex items-center justify-center p-1.5 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer" title="Copy mã OTP">
                              {isCodeCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cột 4: Nút hành động */}
                      <div className="shrink-0 flex md:flex-col items-center justify-end gap-1.5 border-t md:border-t-0 md:border-l border-[var(--color-binance-border)]/40 pt-3 md:pt-0 md:pl-3">
                        <button onClick={() => handleRentAgain(rental)} title="Thuê lại số này" className="p-1.5 rounded-lg text-[var(--color-binance-gray)] hover:text-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/10 transition-colors cursor-pointer">
                          <RefreshCw size={15} />
                        </button>
                        <button onClick={() => handleRemoveRental(rental.request_id)} title="Xóa thẻ này" className="p-1.5 rounded-lg text-[var(--color-binance-gray)] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Phần SMS nằm dưới cùng */}
                    {(rental.smsContent || rental.createdAt) && (
                      <div className="bg-[var(--color-binance-darker)]/40 border-t border-[var(--color-binance-border)]/30 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-binance-gray)]/50 font-medium">
                          <Calendar size={11} className="shrink-0" />
                          <span>
                            {rental.createdAt
                              ? new Date(rental.createdAt).toLocaleString("vi-VN", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                                })
                              : "—"}
                          </span>
                        </div>
                        {rental.smsContent && (
                           <div className="flex-1 flex justify-end overflow-hidden">
                             {rental.isSound ? (
                               <audio src={rental.smsContent} controls className="w-full sm:w-[250px] h-7" />
                             ) : (
                               <div className="text-[11px] text-[var(--color-binance-light)] font-mono truncate" title={rental.smsContent}>
                                 <span className="text-[var(--color-binance-gray)]/50 mr-1.5">SMS:</span>
                                 {rental.smsContent}
                               </div>
                             )}
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
        {/* HẾT CỘT TRÁI */}

        {/* CỘT PHẢI: WebScrcpy */}
        <div className="lg:col-span-5 sticky top-20 flex flex-col h-[calc(100vh-100px)] pt-2 pb-4">
          <WebScrcpy />
        </div>

      </div>

    </div>
  );
}
