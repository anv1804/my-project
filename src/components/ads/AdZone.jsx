export default function AdZone({ id, className = "" }) {
  // Tại đây bạn có thể chèn Google Adsense, Banner Affiliate, vv...
  return (
    <div className={`w-full border-2 border-dashed border-[var(--color-binance-border)] bg-[var(--color-binance-dark)]/50 rounded-lg flex flex-col items-center justify-center p-4 min-h-[100px] text-[var(--color-binance-gray)] transition-colors ${className}`}>
      <span className="text-xs uppercase font-semibold tracking-wider">Vùng Quảng Cáo (Ad Zone)</span>
      <span className="text-[10px] opacity-70">ID: {id}</span>
      <span className="text-[10px] opacity-50 mt-1">Sẵn sàng chèn Script ở đây</span>
    </div>
  );
}
