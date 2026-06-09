export const metadata = {
  title: "Admin Dashboard",
};

export default function AdminRootLayout({ children }) {
  // Ghi đè CSS toàn cục cho nhánh Admin (Apple Design)
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 font-sans selection:bg-[#0071E3] selection:text-white">
      {children}
    </div>
  );
}
