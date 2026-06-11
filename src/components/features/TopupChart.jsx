"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";

export default function TopupChart() {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coins/stats?period=${period}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] p-3 rounded-lg shadow-xl">
          <p className="text-[var(--color-binance-gray)] text-xs mb-1">{label}</p>
          <p className="text-[var(--color-binance-yellow)] font-bold">
            {new Intl.NumberFormat("vi-VN").format(payload[0].value)} Coin
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-base font-bold text-[var(--color-binance-light)] flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--color-binance-yellow)]" />
            Thống kê nạp tiền
          </h2>
          <p className="text-xs text-[var(--color-binance-gray)] mt-1">
            Tổng lượng coin nạp vào theo thời gian
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-binance-light)] focus:outline-none focus:border-[var(--color-binance-yellow)] transition-colors"
          >
            <option value="7">7 ngày qua</option>
            <option value="30">30 ngày qua</option>
            <option value="all">Tất cả</option>
          </select>
          <button 
            onClick={fetchStats}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full h-[250px] sm:h-[300px]">
        {loading && data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-binance-gray)]">
            <RefreshCw size={24} className="animate-spin mb-2 text-[var(--color-binance-yellow)]" />
            <span className="text-sm">Đang tải biểu đồ...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-binance-gray)] text-sm">
            Chưa có dữ liệu giao dịch
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F0B90B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                stroke="#848E9C" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#848E9C" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#F0B90B" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAmount)" 
                activeDot={{ r: 6, fill: "#F0B90B", stroke: "#1E2329", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
