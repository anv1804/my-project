import { cn } from "@/utils/cn";

export default function Button({ children, className, variant = 'primary', ...props }) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all rounded-sm px-3.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm cursor-pointer h-9 sm:h-10 select-none active:scale-[0.98]";
  const variants = {
    primary: "bg-[var(--color-binance-yellow)] text-black hover:bg-[var(--color-binance-yellow-hover)] font-semibold",
    secondary: "bg-[var(--color-binance-border)] text-[var(--color-binance-light)] hover:bg-[#3b434f]",
    outline: "border border-[var(--color-binance-border)] text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)]"
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
