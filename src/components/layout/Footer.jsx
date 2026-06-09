import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] py-8 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-binance-gray)]">
            © {new Date().getFullYear()} MMO Tools Hub. All rights reserved.
          </span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-[var(--color-binance-gray)]">
          <Link href="/privacy" className="hover:text-[var(--color-binance-light)] transition-colors">Bảo mật</Link>
          <Link href="/terms" className="hover:text-[var(--color-binance-light)] transition-colors">Điều khoản</Link>
          <Link href="/contact" className="hover:text-[var(--color-binance-light)] transition-colors">Liên hệ</Link>
        </div>
      </div>
    </footer>
  );
}
