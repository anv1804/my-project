import Script from "next/script";

export default function AdZone({ id, className = "" }) {
  return (
    <div className={`w-full overflow-hidden flex flex-col items-center justify-center min-h-[100px] ${className}`}>
      <Script 
        id="google-adsense-script"
        async 
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9261091305105087" 
        crossOrigin="anonymous" 
        strategy="afterInteractive"
      />
      {/* Vùng dự phòng nếu Auto Ads chưa hiện */}
      <div className="w-full h-full border-2 border-dashed border-[var(--color-binance-border)] bg-[var(--color-binance-dark)]/50 rounded-lg flex flex-col items-center justify-center p-4 text-[var(--color-binance-gray)]">
        <span className="text-xs uppercase font-semibold tracking-wider">Advertisement</span>
      </div>
    </div>
  );
}
