export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-8 text-slate-900">Tổng quan Hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Apple Style Cards */}
        {[
          { title: "Lượt tải Video", value: "1,204", today: "+12%" },
          { title: "Sử dụng Tool FB", value: "342", today: "+5%" },
          { title: "Yêu cầu Landing Page", value: "12", today: "-2%" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
            <h3 className="text-sm font-medium text-slate-500">{stat.title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">{stat.value}</span>
              <span className={`text-sm font-medium ${stat.today.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.today}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
