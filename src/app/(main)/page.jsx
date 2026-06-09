import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function Home() {
  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-4xl mx-auto flex flex-col gap-10">
      <header className="border-b border-[var(--color-binance-border)] pb-6">
        <h1 className="text-3xl font-bold text-[var(--color-binance-light)] mb-2">
          MMO <span className="text-[var(--color-binance-yellow)]">Tools</span> Hub
        </h1>
        <p className="text-[var(--color-binance-gray)] text-sm">
          Nền tảng công cụ tự động hóa & tải video không logo dành riêng cho dân Affiliate và MMO.
        </p>
      </header>

      {/* Demo Component ghép nối từ Atoms (Input + Button) */}
      <section className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-[var(--color-binance-yellow)] rounded-sm"></div>
          <h2 className="text-xl font-semibold text-[var(--color-binance-light)]">Tải Video TikTok / Douyin</h2>
        </div>
        
        <p className="text-[var(--color-binance-gray)] text-sm mb-5">
          Dán đường dẫn video vào bên dưới, hệ thống sẽ tự động bóc tách logo và trả về video chất lượng cao nhất.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="https://www.tiktok.com/@abc/video/123..." className="flex-1" />
          <Button variant="primary" className="sm:w-auto w-full">Tiến hành Tải</Button>
        </div>
      </section>
    </main>
  );
}
