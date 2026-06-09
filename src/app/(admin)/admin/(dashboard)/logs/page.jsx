export default function LogsPage() {
  const dummyLogs = [
    { id: 1, time: "10:30 AM", ip: "113.190.23.11", action: "Tải Video TikTok", status: "Thành công" },
    { id: 2, time: "10:28 AM", ip: "42.112.55.22", action: "Tải Video TikTok", status: "Thất bại" },
    { id: 3, time: "10:15 AM", ip: "14.232.12.99", action: "Dùng Tool FB Formatter", status: "Thành công" },
    { id: 4, time: "09:45 AM", ip: "115.79.14.33", action: "Đăng nhập Admin", status: "Cảnh báo" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-8 text-slate-900">Logger Truy Cập</h1>
      
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-sm font-medium text-slate-500">
              <th className="p-4 pl-6 font-medium">Thời gian</th>
              <th className="p-4 font-medium">IP Address</th>
              <th className="p-4 font-medium">Hành động</th>
              <th className="p-4 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {dummyLogs.map(log => (
              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 pl-6 text-slate-500">{log.time}</td>
                <td className="p-4 font-medium text-slate-900">{log.ip}</td>
                <td className="p-4 text-slate-700">{log.action}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    log.status === 'Thành công' ? 'bg-green-100 text-green-700' :
                    log.status === 'Thất bại' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
