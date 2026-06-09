export default function AdsPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-8 text-slate-900">Quản lý Quảng cáo</h1>
      
      <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
        <h2 className="text-xl font-medium mb-6">Cấu hình Vùng Hiển thị</h2>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Top Banner (Dưới Header)</label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-[14px] px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition-all h-24 resize-none"
              placeholder="Nhập mã Script Adsense hoặc HTML Banner vào đây..."
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Sidebar Banner (Bên trái)</label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-[14px] px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition-all h-24 resize-none"
              placeholder="Nhập mã Script Adsense hoặc HTML Banner vào đây..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button className="bg-[#0071E3] text-white rounded-[14px] px-6 py-3 text-[15px] font-medium hover:bg-[#0060C0] transition-colors shadow-sm cursor-pointer">
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
