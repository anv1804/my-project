"use client";

import { useState, useRef, useEffect } from "react";
import { Smartphone, MonitorPlay, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Yume-chan packages
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";
import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import { WebCodecsVideoDecoder, InsertableStreamVideoFrameRenderer, WebGLVideoFrameRenderer, BitmapVideoFrameRenderer } from "@yume-chan/scrcpy-decoder-webcodecs";
import { TinyH264Decoder } from "@yume-chan/scrcpy-decoder-tinyh264";
import { Consumable, WritableStream } from "@yume-chan/stream-extra";

export default function WebScrcpy() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceModel, setDeviceModel] = useState("");
  const [useSoftwareDecoder, setUseSoftwareDecoder] = useState(false);
  const [videoElement, setVideoElement] = useState(null);
  const containerRef = useRef(null);
  // Append video element to DOM when ready
  useEffect(() => {
    if (isConnected && containerRef.current && videoElement) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(videoElement);
    }
  }, [isConnected, videoElement]);

  // refs for cleanup
  const adbRef = useRef(null);
  const scrcpyRef = useRef(null);
  const decoderRef = useRef(null);
  const deviceRef = useRef(null);

  const disconnect = async () => {
    try {
      if (scrcpyRef.current) await scrcpyRef.current.close();
      if (adbRef.current) await adbRef.current.close();
      if (decoderRef.current) decoderRef.current.dispose();
      if (containerRef.current) containerRef.current.innerHTML = "";
      setVideoElement(null);
    } catch (err) {
      console.error(err);
    }
    adbRef.current = null;
    scrcpyRef.current = null;
    decoderRef.current = null;
    deviceRef.current = null;
    setIsConnected(false);
    setDeviceModel("");
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // 1. Lấy thiết bị
      if (!AdbDaemonWebUsbDeviceManager.BROWSER) {
        throw new Error("Trình duyệt không hỗ trợ WebUSB.");
      }
      toast.loading("Đang yêu cầu kết nối USB...", { id: "scrcpy", duration: 30000 });
      const device = await AdbDaemonWebUsbDeviceManager.BROWSER.requestDevice();
      if (!device) {
        setIsConnecting(false);
        return;
      }
      deviceRef.current = device;
      
      // 2. Kết nối
      toast.loading("Đang mở kết nối thiết bị...", { id: "scrcpy", duration: 30000 });
      const connection = await device.connect();
      const credentialStore = new AdbWebCredentialStore();
      
      toast.loading("Vui lòng BẬT MÀN HÌNH điện thoại và NHẤN CHO PHÉP (ALLOW) nếu được hỏi...", { id: "scrcpy", duration: 60000 });
      const authPromise = AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore,
      });
      const authTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Quá thời gian chờ xác nhận (60s). Vui lòng RÚT CÁP RA CẮM LẠI và mở khóa màn hình điện thoại để bấm CHO PHÉP.")), 60000));
      const transport = await Promise.race([authPromise, authTimeout]);
      
      const adb = new Adb(transport);
      adbRef.current = adb;

      // Get device info
      const model = await adb.getProp("ro.product.model");
      setDeviceModel(model.trim());

      // 3. Push Scrcpy server
      toast.loading("Đang đẩy file máy chủ Scrcpy vào thiết bị...", { id: "scrcpy", duration: 30000 });
      const res = await fetch("/scrcpy-server.jar?v=3.3.3");
      const buffer = await res.arrayBuffer();
      
      const sync = await adb.sync();
      await sync.write({
        filename: "/data/local/tmp/scrcpy-server.jar",
        file: new Blob([buffer]).stream(),
      });
      sync.dispose();

      // 5. Start Scrcpy
      toast.loading("Vui lòng BẬT MÀN HÌNH điện thoại và chọn BẮT ĐẦU (Start Now)...", { id: "scrcpy", duration: 30000 });
      const options = new AdbScrcpyOptionsLatest({
        maxSize: 1080,
        bitRate: 8000000,
        maxFps: 60,
        videoEncoder: useSoftwareDecoder ? "OMX.google.h264.encoder" : undefined, // Force Android Software Encoder for 100% compatibility
        audio: false,
        control: true, // Cho phép điều khiển
      }, {
        version: "3.3.3" // Khôi phục lại 3.3.3 (phiên bản custom của Yume-chan)
      });
      
      // Start Scrcpy with a 15-second timeout
      const scrcpyPromise = AdbScrcpyClient.start(adb, "/data/local/tmp/scrcpy-server.jar", options);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout kết nối tới thiết bị (Quá 15s). Vui lòng thử lại hoặc khởi động lại đt.")), 15000));
      
      const scrcpy = await Promise.race([scrcpyPromise, timeoutPromise]);
      scrcpyRef.current = scrcpy;

      // 5. Decode Video
      const videoStream = await scrcpy.videoStream;
      if (!videoStream) {
        throw new Error("Không nhận được luồng video từ điện thoại");
      }
      
      let renderer;
      try {
        renderer = new WebGLVideoFrameRenderer();
      } catch (e) {
        console.warn("WebGL not supported, falling back to Bitmap renderer");
        renderer = new BitmapVideoFrameRenderer();
      }

      const decoder = new WebCodecsVideoDecoder({
        codec: videoStream.metadata.codec,
        renderer,
      });
      const domElement = renderer.element || renderer.canvas;

      decoderRef.current = decoder;
      
      // Style the renderer (canvas) to fit nicely
      domElement.style.position = "absolute";
      domElement.style.top = "0";
      domElement.style.left = "0";
      domElement.style.width = "100%";
      domElement.style.height = "100%";
      domElement.style.objectFit = "contain";
      domElement.style.borderRadius = "0.5rem";
      domElement.style.touchAction = "none"; // Khóa mọi hành vi zoom/scroll của trình duyệt để vuốt mượt nhất
      
      // Force play if it's a video element (fixes autoplay issues)
      if (domElement instanceof HTMLVideoElement) {
        domElement.playsInline = true;
        domElement.play().catch(e => console.error("Play error:", e));
      }
      
      setVideoElement(domElement);

      videoStream.stream.pipeTo(decoder.writable).catch(e => {
        console.error("Video pipe error:", e);
        toast.error(`Lỗi giải mã: ${e.message || "Video không được hỗ trợ"}. Hãy bật chế độ "Sửa lỗi đen màn hình" để ép điện thoại dùng chuẩn video cơ bản nhất.`, { id: "scrcpy", duration: 10000 });
      });

      // 6. Handle Control Injection (Mouse/Touch/Scroll)
      // Dịch sự kiện chuột trên DOM renderer (canvas) sang tọa độ Scrcpy
      let isDragging = false;
      let lastMoveTime = 0;
      
      // Xử lý Lăn Chuột / Vuốt Touchpad (CỰC KỲ QUAN TRỌNG ĐỂ HẾT LAG KHI CUỘN)
      domElement.addEventListener("wheel", (e) => {
        e.preventDefault();
        if (!scrcpyRef.current || !scrcpyRef.current.controller) return;

        const rect = domElement.getBoundingClientRect();
        const clientWidth = rect.width;
        const clientHeight = rect.height;
        const videoWidth = decoder.width || 1080;
        const videoHeight = decoder.height || 1920;
        const videoRatio = videoWidth / videoHeight;
        const clientRatio = clientWidth / clientHeight;

        let renderWidth, renderHeight, offsetX, offsetY;
        if (videoRatio > clientRatio) {
          renderWidth = clientWidth; renderHeight = clientWidth / videoRatio;
          offsetX = 0; offsetY = (clientHeight - renderHeight) / 2;
        } else {
          renderHeight = clientHeight; renderWidth = clientHeight * videoRatio;
          offsetX = (clientWidth - renderWidth) / 2; offsetY = 0;
        }

        const x = e.clientX - rect.left - offsetX;
        const y = e.clientY - rect.top - offsetY;
        const clampedX = Math.max(0, Math.min(x, renderWidth));
        const clampedY = Math.max(0, Math.min(y, renderHeight));
        const pointerX = Math.round((clampedX / renderWidth) * videoWidth);
        const pointerY = Math.round((clampedY / renderHeight) * videoHeight);

        // Normalize cuộn (Scrcpy nhận scrollX, scrollY từ -1 đến 1)
        const scrollX = e.deltaX === 0 ? 0 : e.deltaX > 0 ? -1 : 1;
        const scrollY = e.deltaY === 0 ? 0 : e.deltaY > 0 ? -1 : 1;

        scrcpyRef.current.controller.injectScroll({
          pointerX,
          pointerY,
          videoWidth,
          videoHeight,
          scrollX,
          scrollY,
          buttons: 0,
        });
      }, { passive: false });

      // Use Pointer events and preventDefault to stop browser's native drag-and-drop from hijacking the swipe
      domElement.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        
        // Chuột phải (button === 2) => Nút Back
        if (e.button === 2) {
          if (scrcpyRef.current?.controller) {
            // Action Down = 0, Up = 1. KEYCODE_BACK = 4
            scrcpyRef.current.controller.injectKeyCode({ action: 0, keyCode: 4, metaState: 0, repeat: 0 });
            scrcpyRef.current.controller.injectKeyCode({ action: 1, keyCode: 4, metaState: 0, repeat: 0 });
          }
          return;
        }

        domElement.setPointerCapture(e.pointerId);
        isDragging = true;
        sendTouchEvent(e, 0 /* ACTION_DOWN */);
      });

      domElement.addEventListener("pointermove", (e) => {
        e.preventDefault();
        if (!isDragging) return;
        
        // CỰC KỲ QUAN TRỌNG: Dùng performance.now() (độ chính xác micro-giây) thay vì rAF/Date.now.
        // Giới hạn ở 8ms (125Hz). Giúp loại bỏ hoàn toàn 16ms độ trễ rAF, tạo cảm giác Zero-Latency như Native!
        const now = performance.now();
        if (now - lastMoveTime < 8) return; 
        lastMoveTime = now;
        
        sendTouchEvent(e, 2 /* ACTION_MOVE */);
      });

      domElement.addEventListener("pointerup", (e) => {
        e.preventDefault();
        if (domElement.hasPointerCapture(e.pointerId)) {
          domElement.releasePointerCapture(e.pointerId);
        }
        isDragging = false;
        sendTouchEvent(e, 1 /* ACTION_UP */);
      });

      domElement.addEventListener("pointercancel", (e) => {
        e.preventDefault();
        if (domElement.hasPointerCapture(e.pointerId)) {
          domElement.releasePointerCapture(e.pointerId);
        }
        if (isDragging) {
          isDragging = false;
          sendTouchEvent(e, 1 /* ACTION_UP */);
        }
      });
      
      // Prevent context menu
      domElement.addEventListener("contextmenu", (e) => e.preventDefault());

      function sendTouchEvent(e, action) {
        if (!scrcpyRef.current || !scrcpyRef.current.controller) return;
        
        const rect = domElement.getBoundingClientRect();
        const clientWidth = rect.width;
        const clientHeight = rect.height;

        // Tọa độ gốc của video
        const videoWidth = decoder.width || 1080;
        const videoHeight = decoder.height || 1920;

        // Tính toán object-fit: contain
        const videoRatio = videoWidth / videoHeight;
        const clientRatio = clientWidth / clientHeight;

        let renderWidth, renderHeight, offsetX, offsetY;

        if (videoRatio > clientRatio) {
          // Video rộng hơn container
          renderWidth = clientWidth;
          renderHeight = clientWidth / videoRatio;
          offsetX = 0;
          offsetY = (clientHeight - renderHeight) / 2;
        } else {
          // Video hẹp hơn container
          renderHeight = clientHeight;
          renderWidth = clientHeight * videoRatio;
          offsetX = (clientWidth - renderWidth) / 2;
          offsetY = 0;
        }

        const x = e.clientX - rect.left - offsetX;
        const y = e.clientY - rect.top - offsetY;

        // Tránh return sớm làm mất tín hiệu nhả chuột (ACTION_UP) khi vuốt ra ngoài mép
        // Thay vào đó, giới hạn tọa độ ở mép viền video (Clamp)
        const clampedX = Math.max(0, Math.min(x, renderWidth));
        const clampedY = Math.max(0, Math.min(y, renderHeight));

        // Tọa độ Scrcpy chuẩn hóa
        const pointerX = Math.round((clampedX / renderWidth) * videoWidth);
        const pointerY = Math.round((clampedY / renderHeight) * videoHeight);

        scrcpyRef.current.controller.injectTouch({
          action,
          pointerId: 0n,
          pointerX,
          pointerY,
          videoWidth,
          videoHeight,
          pressure: action === 1 ? 0 : 1,
          actionButton: 1, // BUTTON_PRIMARY
          buttons: 1,
        });
      }

      toast.success("Kết nối thành công!", { id: "scrcpy" });
      setIsConnected(true);
    } catch (err) {
      console.error("Scrcpy Error:", err);
      if (err.output) {
        console.error("Server output:", err.output.join("\n"));
        toast.error(`Server crash: ${err.output[err.output.length - 1] || "Xem console"}`, { id: "scrcpy" });
      }
      if (err.message?.includes("already in use") || err.message?.includes("busy")) {
        toast.error(
          "Lỗi: Thiết bị đang bị phần mềm khác chiếm giữ!\n\nVui lòng đóng các tab web khác đang dùng USB, hoặc tắt phần mềm ADB trên máy (adb kill-server) rồi cắm lại cáp.",
          { id: "scrcpy", duration: 8000 }
        );
      } else {
        toast.error(`Lỗi: ${err.message}`, { id: "scrcpy" });
      }
      disconnect();
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <div className="bg-[#0b0e14] p-1.5 rounded-[2rem] border border-[var(--color-binance-border)] shadow-2xl relative overflow-hidden mt-6">
      {/* Inner Core */}
      <div className="bg-[#12161f] rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] p-5 lg:p-8 relative z-10 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-binance-yellow)]/10 border border-[var(--color-binance-yellow)]/20 flex items-center justify-center">
              <MonitorPlay className="text-[var(--color-binance-yellow)]" size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white tracking-tight">Trình chiếu Thiết Bị</h2>
              <p className="text-xs text-[var(--color-binance-gray)] mt-1">Giao thức WebUSB cực thấp độ trễ</p>
            </div>
          </div>
          
          {isConnected && (
            <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              <span className="text-[10px] font-mono text-green-400 tracking-widest uppercase">Live • {deviceModel}</span>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Cột trái: Điều khiển & Hướng dẫn */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Yêu cầu hệ thống</p>
                <ul className="space-y-3 text-[13px] text-white/50">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-green-500/50" />
                    <span>Trình duyệt Chromium (Chrome, Edge, Cốc Cốc)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-green-500/50" />
                    <span>Bật <strong>Gỡ lỗi USB (USB Debugging)</strong> trong Tùy chọn nhà phát triển</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--color-binance-yellow)]/50" />
                    <span>Xác nhận hộp thoại "Allow USB debugging" trên điện thoại</span>
                  </li>
                </ul>
              </div>

              {!isConnected && (
                <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)]/50 cursor-pointer group transition-colors hover:bg-[var(--color-binance-darker)]">
                  <input
                    type="checkbox"
                    checked={useSoftwareDecoder}
                    onChange={(e) => setUseSoftwareDecoder(e.target.checked)}
                    className="mt-0.5 rounded border-white/10 bg-black/20 text-[var(--color-binance-yellow)] focus:ring-[var(--color-binance-yellow)]/30 focus:ring-offset-0"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-white/90">Chế độ tương thích (Safe Mode)</span>
                    <span className="text-xs text-white/40 leading-relaxed">Tích chọn nếu máy tính của bạn báo lỗi đen màn hình, EncodingError, hoặc không hỗ trợ giải mã phần cứng.</span>
                  </div>
                </label>
              )}
            </div>

            <div className="mt-auto pt-4">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full group relative flex items-center justify-between bg-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/90 text-black p-2 rounded-full font-bold text-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(252,213,53,0.1)]"
                >
                  <span className="pl-6 tracking-wide">
                    {isConnecting ? "ĐANG KHỞI TẠO LUỒNG..." : "KẾT NỐI USB ĐIỆN THOẠI"}
                  </span>
                  <div className="w-10 h-10 shrink-0 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:-translate-x-1">
                    {isConnecting ? <Loader2 size={18} className="animate-spin text-black/80" /> : <Smartphone size={18} className="text-black/80" strokeWidth={2} />}
                  </div>
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="w-full group relative flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2 rounded-full font-bold text-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                >
                  <span className="pl-6 tracking-wide">NGẮT KẾT NỐI</span>
                  <div className="w-10 h-10 shrink-0 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:-translate-x-1">
                    <XCircle size={18} className="text-red-400" strokeWidth={2} />
                  </div>
                </button>
              )}
            </div>

          </div>

          {/* Cột phải: Viewport Màn Hình */}
          <div className="lg:col-span-6 flex items-center justify-center">
            {/* Double Bezel for Phone Frame */}
            <div className="p-2 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-2xl w-full max-w-[340px]">
              <div className="w-full bg-[#050505] rounded-[calc(2rem-0.5rem)] border border-black shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] relative overflow-hidden flex items-center justify-center group/screen" style={{ aspectRatio: "9/19" }}>
                {!isConnected ? (
                  <div className="text-white/20 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Smartphone size={24} strokeWidth={1} />
                    </div>
                    <span className="text-xs font-medium tracking-widest uppercase opacity-50">Chờ tín hiệu</span>
                  </div>
                ) : (
                  <div className="w-full h-full relative cursor-pointer" title="Chuột trái: Chạm | Chuột phải: Quay lại (Back)">
                    <div ref={containerRef} className="w-full h-full bg-black" />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
