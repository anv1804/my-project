import AppleSidebar from "@/components/admin/AppleSidebar";

export default function AdminDashboardLayout({ children }) {
  return (
    <div className="flex">
      <AppleSidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
