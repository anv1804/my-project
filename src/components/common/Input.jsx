import { cn } from "@/utils/cn";

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-9 sm:h-10 w-full rounded-sm border border-[var(--color-binance-border)] bg-[var(--color-binance-dark)] px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--color-binance-light)] placeholder:text-[var(--color-binance-gray)] focus:outline-none focus:border focus:border-[var(--color-binance-yellow)] transition-all",
        className
      )}
      {...props}
    />
  );
}
