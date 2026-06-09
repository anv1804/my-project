"use client";

import { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import {
  Phone, RefreshCw, Search, Copy, Check, Timer,
  Globe, Wifi, AlertCircle, History, FileText,
  Volume2, VolumeX, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useAuthStore } from "@/store/useAuthStore";

// Giá hiển thị = giá ViOTP × 2, đơn vị coin
const formatCoin = (num) => {
  if (num == null) return "0 coin";
  return new Intl.NumberFormat("vi-VN").format(Math.round(num * 2)) + " coin";
};

// Inline brand SVG icons
const BrandIcon = ({ name }) => {
  switch (name) {
    case "gmail": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#EA4335"/><path d="M8 14l16 11L40 14" stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round"/><path d="M8 14v20h32V14L24 25 8 14z" fill="#EA4335"/><path d="M8 14l16 11L40 14" stroke="white" strokeWidth="2.5" fill="none"/></svg>
    );
    case "telegram": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#2CA5E0"/><path d="M10 23.5l8 3.5 3 8.5 4-5 7 5 6-22-28 10z" fill="white"/><path d="M18 27l-1 7 3-4" fill="#C8DAEA"/></svg>
    );
    case "facebook": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#1877F2"/><path d="M32 8h-5c-3.3 0-6 2.7-6 6v4h-4v6h4v16h6V24h4l1-6h-5v-4c0-1.1.9-2 2-2h3V8z" fill="white"/></svg>
    );
    case "shopee": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#EE4D2D"/><path d="M24 8c-4.4 0-8 3.6-8 8h-6l2 24h24l2-24h-6c0-4.4-3.6-8-8-8zm0 3c2.8 0 5 2.2 5 5H19c0-2.8 2.2-5 5-5zm0 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="white"/></svg>
    );
    case "viber": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#7360F2"/><path d="M24 8C15.2 8 8 14.4 8 22.2c0 4.7 2.4 8.9 6.2 11.6v5.2l5-2.4c1.5.4 3.2.6 4.8.6 8.8 0 16-6.4 16-14.2C40 14.4 32.8 8 24 8zm8 17.4l-2.6 2.6c-.4.4-1 .5-1.4.2-1.2-.8-2.4-1.8-3.4-2.9-1-1-2-2.2-2.8-3.4-.3-.5-.2-1.1.2-1.5l2.4-2.4c.4-.4.4-1 0-1.4l-3-3c-.4-.4-1-.4-1.4 0l-1.8 1.8c-.8.8-1 2-.6 3 1.4 3.8 4.4 6.8 8.2 8.2 1 .4 2.2.2 3-.6L32 24c.4-.4 1-.4 1.4 0l.6.6c.4.4.4 1 0 1.4l-2 1.4z" fill="white"/></svg>
    );
    case "tiktok": return (
      <svg width="15" height="15" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="#010101"/><path d="M34 12c-2.5 0-4.8-1.5-5.8-3.8V28a8 8 0 1 1-8-8v4.4a3.6 3.6 0 1 0 3.6 3.6V6h4c.2 2.8 2 5.2 4.5 6.5V16c-1.6 0-3.2-.4-4.5-1.2" fill="white"/></svg>
    );
    default: return null;
  }
};

// Network brand config
const NETWORK_CONFIG = {
  MOBIFONE:     { color: "#0080C6", label: "Mobifone" },
  VINAPHONE:    { color: "#CC0000", label: "Vinaphone" },
  VIETTEL:      { color: "#E30613", label: "Viettel" },
  VIETNAMOBILE: { color: "#FF6D00", label: "Vietnamobile" },
  ITELECOM:     { color: "#9B51E0", label: "Itelecom" },
  WINTEL:       { color: "#0EA5E9", label: "Wintel" },
};

export default function OtpRentBox() {
  const { user, profile, openLoginModal } = useAuthStore();

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

  // Lists & state — lazy initializers to avoid setState inside effects
  const [activeRentals, setActiveRentals] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("otp_active_rentals");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [historyRentals, setHistoryRentals] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("otp_sound_enabled");
    return saved === null ? true : saved === "true";
  });
  const [now, setNow] = useState(0);

  // Loading flags
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingRent, setLoadingRent] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const refundCoins = async (amount) => {
    try {
      const res = await fetch("/api/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund", amount }),
      });
      const data = await res.json();
      if (data.success) {
        useAuthStore.setState(state => ({ profile: { ...state.profile, coins: data.coins } }));
      }
    } catch {}
  };

  // Polling for waiting rentals (every 4s)
  useEffect(() => {
    const waiting = activeRentals.filter(r => r.status === 0);
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
              const idx = updated.findIndex(r => r.request_id === rental.request_id);
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
                if (newStatus === 1) {
                  toast.success(`Nhận OTP thành công cho số ${rental.phone_number}!`);
                  if (soundEnabled) playAlertSound();
                } else if (newStatus === 2) {
                  toast.error(`Yêu cầu thuê số ${rental.phone_number} đã hết hạn!`);
                  if (!result.data.Code && rental.coinCost) {
                    refundCoins(rental.coinCost).then(() => {
                      toast.success(`Đã hoàn ${new Intl.NumberFormat("vi-VN").format(rental.coinCost)} coin cho số ${rental.phone_number}`);
                    });
                  }
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

  const handleRent = async () => {
    if (!isConnected) { toast.error("Hệ thống chưa sẵn sàng, vui lòng đợi..."); return; }
    if (!selectedService) { toast.error("Vui lòng chọn một dịch vụ cần thuê!"); return; }

    if (!user) {
      openLoginModal("Vui lòng đăng nhập để thuê số OTP!");
      return;
    }

    const coinCost = Math.round(selectedService.price * 2);
    const currentCoins = profile?.coins ?? 0;
    if (currentCoins < coinCost) {
      toast.error(`Không đủ coin! Cần ${new Intl.NumberFormat("vi-VN").format(coinCost)} coin, bạn đang có ${new Intl.NumberFormat("vi-VN").format(currentCoins)} coin.`);
      return;
    }

    setLoadingRent(true);

    // Deduct coins atomically before calling ViOTP
    const deductRes = await fetch("/api/coins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deduct", amount: coinCost }),
    });
    const deductData = await deductRes.json();

    if (!deductData.success) {
      toast.error(deductData.message || "Không thể trừ coin. Vui lòng thử lại!");
      setLoadingRent(false);
      return;
    }
    useAuthStore.setState(state => ({ profile: { ...state.profile, coins: deductData.coins } }));

    let path = `request/getv2?serviceId=${selectedService.id}&country=${country}`;
    if (selectedNetworks.length > 0) path += `&network=${encodeURIComponent(selectedNetworks.join("|"))}`;
    if (prefix.trim()) path += `&prefix=${encodeURIComponent(prefix.trim())}`;
    if (exceptPrefix.trim()) path += `&exceptPrefix=${encodeURIComponent(exceptPrefix.trim())}`;
    if (customNumber.trim()) path += `&number=${encodeURIComponent(customNumber.trim())}`;

    try {
      const res = await fetch(`/api/otp?path=${path}`);
      if (!res.ok) throw new Error("Lỗi kết nối máy chủ");
      const data = await res.json();

      if (data.status_code === 200 && data.success) {
        const item = data.data;
        setActiveRentals(prev => [{
          request_id: item.request_id,
          phone_number: item.phone_number,
          re_phone_number: item.re_phone_number,
          countryISO: item.countryISO,
          countryCode: item.countryCode,
          service_name: selectedService.name,
          service_id: selectedService.id,
          price: selectedService.price,
          coinCost,
          status: 0,
          code: "",
          smsContent: "",
          isSound: false,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        toast.success(`Yêu cầu thuê số thành công: ${item.phone_number}`);
        if (customNumber) setCustomNumber("");
      } else {
        await refundCoins(coinCost);
        let msg = data.message || "Không thể thuê số.";
        if (data.status_code === -2) msg = "Hệ thống OTP không đủ số dư. Vui lòng liên hệ admin!";
        if (data.status_code === -3) msg = "Kho số dịch vụ này đang tạm hết.";
        if (data.status_code === -4) msg = "Ứng dụng này không tồn tại hoặc tạm dừng.";
        if (data.status_code === 429) msg = "Vượt quá giới hạn số chờ tin nhắn tối đa.";
        toast.error(msg);
      }
    } catch (err) {
      await refundCoins(coinCost);
      toast.error("Lỗi khi gửi yêu cầu thuê số: " + err.message);
    } finally {
      setLoadingRent(false);
    }
  };

  const toggleNetwork = (name) =>
    setSelectedNetworks(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const handleRemoveRental = (requestId) => {
    setActiveRentals(prev => prev.filter(r => r.request_id !== requestId));
    toast.success("Đã xóa phiên thuê khỏi danh sách hiển thị");
  };

  const handleRentAgain = (rental) => {
    setCountry(rental.countryISO?.toLowerCase() === "vn" ? "vn" : "la");
    setCustomNumber(rental.phone_number);
    const matched = services.find(s => s.id === rental.service_id);
    setSelectedService(matched || { id: rental.service_id, name: rental.service_name, price: rental.price });
    toast.success(`Đã điền số ${rental.phone_number} vào ô thuê lại`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchHistory = async () => {
    if (!isConnected) { toast.error("Hệ thống chưa sẵn sàng!"); return; }
    setLoadingHistory(true);
    const today = new Date().toISOString().split("T")[0];
    const past = new Date();
    past.setDate(past.getDate() - 7);
    const fromDate = past.toISOString().split("T")[0];
    const path = `session/historyv2?limit=50&fromDate=${fromDate}&toDate=${today}`;
    try {
      const res = await fetch(`/api/otp?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.status_code === 200 && data.success) {
        setHistoryRentals(data.data || []);
        toast.success("Tải lịch sử giao dịch thành công!");
      } else {
        toast.error(data.message || "Không thể tải lịch sử thuê số");
      }
    } catch {
      toast.error("Lỗi khi tải lịch sử.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full text-[var(--color-binance-light)]">

      {/* SECTION 1: STATUS + GUIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* System Status Card */}
        <div className="lg:col-span-4 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-binance-border)] pb-3">
            <Wifi size={18} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-lg font-semibold">Trạng thái hệ thống</h2>
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
        <div className="lg:col-span-8 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 border-b border-[var(--color-binance-border)] pb-3">
            <FileText size={18} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-lg font-semibold">Hướng dẫn sử dụng</h2>
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
          onClick={() => { setActiveTab("history"); fetchHistory(); }}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "history" ? "border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]" : "border-transparent text-[var(--color-binance-gray)] hover:text-white"}`}
        >
          <History size={16} /> Lịch sử thuê
        </button>
      </div>

      {/* SECTION 3: RENT FORM */}
      {activeTab === "rent" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* Order Form */}
          <div className="xl:col-span-7 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-lg flex flex-col gap-5">

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
                    <Globe size={16} /> {label}
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
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                          style={{ backgroundColor: isSel ? "var(--color-binance-yellow)" : "#22c55e" }}
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

          {/* Sound panel */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--color-binance-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Wifi size={18} className="text-[var(--color-binance-yellow)]" />
                  <h3 className="font-semibold">Quét Tín Hiệu Tin Nhắn</h3>
                </div>
                <div className="flex items-center gap-2">
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
          </div>

        </div>
      ) : (
        /* SECTION 4: HISTORY */
        <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--color-binance-yellow)]">
                <History size={18} /> Lịch Sử Thuê Số (7 ngày gần nhất)
              </h2>
              <p className="text-[var(--color-binance-gray)] text-xs mt-1">Hiển thị tối đa 50 yêu cầu thuê số trong tuần vừa qua.</p>
            </div>
            <Button onClick={fetchHistory} disabled={loadingHistory} className="flex gap-2 text-xs">
              <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
              Tải lại lịch sử
            </Button>
          </div>

          <div className="overflow-x-auto">
            {loadingHistory ? (
              <div className="p-16 text-center text-[var(--color-binance-gray)] text-sm flex items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin text-[var(--color-binance-yellow)]" />
                Đang truy vấn lịch sử thuê số từ hệ thống...
              </div>
            ) : historyRentals.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-binance-border)] text-[var(--color-binance-gray)] uppercase font-semibold">
                    <th className="py-3 px-4">Mã GD</th>
                    <th className="py-3 px-4">Dịch Vụ</th>
                    <th className="py-3 px-4">Số Điện Thoại</th>
                    <th className="py-3 px-4">OTP</th>
                    <th className="py-3 px-4">Nội Dung SMS</th>
                    <th className="py-3 px-4">Giá (Coin)</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-binance-border)]/45">
                  {historyRentals.map((hist) => {
                    const statusText = hist.Status === 1 ? "Hoàn thành" : hist.Status === 2 ? "Hết hạn" : "Đang chờ";
                    const statusColor = hist.Status === 1
                      ? "text-[var(--color-binance-success)] bg-[var(--color-binance-success)]/10 border-[var(--color-binance-success)]/20"
                      : hist.Status === 2
                      ? "text-[var(--color-binance-gray)] bg-gray-500/10 border-gray-500/20"
                      : "text-[var(--color-binance-yellow)] bg-[var(--color-binance-yellow)]/10 border-[var(--color-binance-yellow)]/20";
                    return (
                      <tr key={hist.ID} className="hover:bg-[var(--color-binance-border)]/10 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-gray-400">#{hist.ID}</td>
                        <td className="py-3.5 px-4 font-semibold text-white">{hist.ServiceName}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold">{hist.PhoneOriginal || hist.Phone}</td>
                        <td className="py-3.5 px-4">
                          {hist.Code ? (
                            <span className="bg-[var(--color-binance-yellow)]/10 text-[var(--color-binance-yellow)] px-2 py-1.5 rounded-sm font-mono font-bold text-sm border border-[var(--color-binance-yellow)]/20">
                              {hist.Code}
                            </span>
                          ) : <span className="text-[var(--color-binance-gray)] italic">-</span>}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-[var(--color-binance-gray)]" title={hist.SmsContent}>
                          {hist.SmsContent || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--color-binance-yellow)] font-mono font-semibold">{formatCoin(hist.Price)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusColor}`}>{statusText}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[var(--color-binance-gray)]">
                          {new Date(hist.CreatedTime).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center text-[var(--color-binance-gray)] text-sm">
                Không tìm thấy dữ liệu lịch sử thuê số.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: ACTIVE RENTALS */}
      <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b border-[var(--color-binance-border)] pb-3">
          <div className="flex items-center gap-2">
            <Phone size={20} className="text-[var(--color-binance-yellow)]" />
            <h2 className="text-lg font-semibold">SIM Đang Hoạt Động & Chờ OTP</h2>
          </div>
          <span className="bg-[var(--color-binance-border)]/50 text-white text-xs px-2.5 py-1 rounded-full font-mono">
            {activeRentals.length} số
          </span>
        </div>

        {activeRentals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-binance-border)] rounded-lg">
            <div className="w-12 h-12 rounded-full bg-[var(--color-binance-darker)] flex items-center justify-center text-[var(--color-binance-gray)] mb-3">
              <Phone size={22} />
            </div>
            <p className="text-[var(--color-binance-gray)] text-sm">Không có số điện thoại nào đang hoạt động.</p>
            <p className="text-[var(--color-binance-gray)] text-xs mt-1">Yêu cầu thuê số ở khung bên trên để nhận OTP trực tuyến.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--color-binance-border)]/50 rounded-lg border border-[var(--color-binance-border)] overflow-hidden">
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

              const accentColor = isCompleted
                ? "var(--color-binance-success)"
                : isExpired
                ? "#6b7280"
                : "var(--color-binance-yellow)";

              return (
                <div
                  key={rental.request_id}
                  className={`relative flex flex-col ${isExpired ? "opacity-60" : ""} ${isCompleted ? "bg-[var(--color-binance-success)]/[0.03]" : ""}`}
                >
                  {/* Colored left border accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accentColor }} />

                  {/* Main row */}
                  <div className="flex items-center gap-3 pl-5 pr-4 py-3">

                    {/* Service name + country */}
                    <div className="shrink-0 w-28 min-w-0">
                      <div className="text-xs font-semibold text-[var(--color-binance-light)] truncate">{rental.service_name}</div>
                      <div className="text-[10px] text-[var(--color-binance-gray)] flex items-center gap-1 mt-0.5">
                        <Globe size={9} className="text-blue-400" /> {rental.countryISO}
                      </div>
                    </div>

                    {/* Phone number */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono font-bold text-white text-sm tracking-wide truncate">
                        {rental.countryCode ? `+${rental.countryCode} ` : ""}{rental.phone_number}
                      </span>
                      <button
                        onClick={() => copy(rental.phone_number)}
                        className="shrink-0 p-1 text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer"
                      >
                        {isPhoneCopied
                          ? <Check size={13} className="text-[var(--color-binance-success)]" />
                          : <Copy size={13} />
                        }
                      </button>
                    </div>

                    {/* Status / Timer / OTP */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isWaiting && (
                        <>
                          <RefreshCw size={12} className="animate-spin text-[var(--color-binance-yellow)]" />
                          <span className="font-mono text-xs text-yellow-400 flex items-center gap-1 tabular-nums">
                            <Timer size={11} className="animate-pulse" />{formattedTime}
                          </span>
                        </>
                      )}
                      {isCompleted && rental.code && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[var(--color-binance-success)] text-lg tracking-widest">
                            {rental.code}
                          </span>
                          <button
                            onClick={() => copy(rental.code)}
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-[var(--color-binance-success)]/15 border border-[var(--color-binance-success)]/30 text-[var(--color-binance-success)] hover:bg-[var(--color-binance-success)]/25 transition-colors cursor-pointer"
                          >
                            {isCodeCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                          </button>
                        </div>
                      )}
                      {isCompleted && !rental.code && (
                        <span className="flex items-center gap-1 text-xs text-[var(--color-binance-success)]">
                          <CheckCircle2 size={13} /> Thành công
                        </span>
                      )}
                      {isExpired && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <XCircle size={13} /> Hết hạn
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <span className="shrink-0 text-xs font-mono text-[var(--color-binance-yellow)] hidden sm:block">
                      {formatCoin(rental.price)}
                    </span>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => handleRentAgain(rental)}
                        title="Thuê lại số này"
                        className="p-1.5 rounded text-[var(--color-binance-gray)] hover:text-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-border)]/50 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        onClick={() => handleRemoveRental(rental.request_id)}
                        title="Xóa phiên này"
                        className="p-1.5 rounded text-[var(--color-binance-gray)] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar (waiting) */}
                  {isWaiting && (
                    <div className="mx-5 mb-2 h-0.5 bg-[var(--color-binance-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--color-binance-yellow)] to-amber-400 transition-all duration-1000 ease-linear"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  {/* SMS content (if received) */}
                  {rental.smsContent && (
                    <div className="mx-5 mb-3 px-3 py-2 bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded text-xs text-[var(--color-binance-gray)]">
                      {rental.isSound ? (
                        <audio src={rental.smsContent} controls className="w-full h-7" />
                      ) : (
                        <p className="font-mono text-white/80 whitespace-pre-wrap select-all leading-relaxed">{rental.smsContent}</p>
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
  );
}
