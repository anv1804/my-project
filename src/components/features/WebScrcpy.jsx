"use client";

import { useState, useRef, useEffect } from "react";
import { Smartphone, MonitorPlay, XCircle, Loader2, Volume1, Volume2, Power } from "lucide-react";
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
  const credentialStoreRef = useRef(null);

  const disconnect = async () => {
    try {
      if (scrcpyRef.current) {
        try { await scrcpyRef.current.close(); } catch (e) { console.error("Scrcpy close error", e); }
      }
      if (adbRef.current) {
        try { await adbRef.current.close(); } catch (e) { console.error("Adb close error", e); }
      }
      if (decoderRef.current) {
        try { decoderRef.current.dispose(); } catch (e) { console.error("Decoder dispose error", e); }
      }
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

  const injectKey = (keyCode) => {
    if (!scrcpyRef.current || !scrcpyRef.current.controller) return;
    try {
      scrcpyRef.current.controller.injectKeyCode({
        action: 0, // DOWN
        keyCode,
        repeat: 0,
        metaState: 0,
      });
      scrcpyRef.current.controller.injectKeyCode({
        action: 1, // UP
        keyCode,
        repeat: 0,
        metaState: 0,
      });
    } catch (e) {
      console.error("Inject key error:", e);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // Initialize credential store once
      if (!credentialStoreRef.current) {
        credentialStoreRef.current = new AdbWebCredentialStore();
      }

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
      
      toast.loading("Vui lòng BẬT MÀN HÌNH điện thoại và NHẤN CHO PHÉP (ALLOW) nếu được hỏi...", { id: "scrcpy", duration: 60000 });
      const authPromise = AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore: credentialStoreRef.current,
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
    <div className="bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--color-binance-border)] flex items-center justify-between bg-[var(--color-binance-dark)]/50 shrink-0">
        <div className="flex items-center gap-3">
          <MonitorPlay className="text-[var(--color-binance-yellow)]" size={20} strokeWidth={2} />
          <h2 className="text-sm font-semibold text-white tracking-wide">TRÌNH CHIẾU THIẾT BỊ</h2>
        </div>
        
        {isConnected && (
          <div className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            <span className="text-[10px] font-mono text-green-400 tracking-wider uppercase">Live • {deviceModel}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex flex-col gap-6 flex-1 min-h-0">
        
        {/* Cột trái: Điều khiển & Hướng dẫn (Chỉ hiển thị khi CHƯA kết nối) */}
        {!isConnected && (
          <div className="flex flex-col gap-5">
            
            <div className="p-4 rounded-lg bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] space-y-3">
              <p className="text-xs font-semibold text-white/80 uppercase">Yêu cầu hệ thống</p>
              <ul className="space-y-2 text-xs text-[var(--color-binance-gray)]">
                <li className="flex items-start gap-2">
                  <div className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-green-500/60" />
                  <span>Trình duyệt Chromium (Chrome, Edge, Cốc Cốc)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-green-500/60" />
                  <span>Bật <strong>Gỡ lỗi USB (USB Debugging)</strong> trong Cài đặt</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--color-binance-yellow)]/60" />
                  <span>Xác nhận "Allow USB debugging" trên điện thoại</span>
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-lg border border-[var(--color-binance-border)] bg-[var(--color-binance-darker)]/40 cursor-pointer transition-colors hover:bg-[var(--color-binance-darker)]">
              <input
                type="checkbox"
                checked={useSoftwareDecoder}
                onChange={(e) => setUseSoftwareDecoder(e.target.checked)}
                className="mt-0.5 rounded border-white/10 bg-black/20 text-[var(--color-binance-yellow)] focus:ring-[var(--color-binance-yellow)]/30 focus:ring-offset-0"
              />
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-white/90">Chế độ tương thích (Safe Mode)</span>
                <span className="text-[11px] text-[var(--color-binance-gray)] leading-relaxed">Tích chọn nếu máy tính của bạn báo lỗi đen màn hình hoặc không hỗ trợ giải mã phần cứng.</span>
              </div>
            </label>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/90 text-black py-3 px-4 rounded-lg font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
              {isConnecting ? "ĐANG KHỞI TẠO LUỒNG..." : "KẾT NỐI USB ĐIỆN THOẠI"}
            </button>
          </div>
        )}

        {/* Viewport Màn Hình (Chỉ hiển thị khi ĐÃ kết nối) */}
        {isConnected && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            
            {/* Phone Frame */}
            <div 
              className="w-full flex-1 min-h-0 bg-[#0b0e14] rounded-lg border border-[var(--color-binance-border)] shadow-inner relative overflow-hidden flex items-center justify-center"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(252,213,53,0.05) 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            >
              <div className="w-full h-full relative cursor-pointer" title="Chuột trái: Chạm | Chuột phải: Quay lại (Back)">
                <div ref={containerRef} className="w-full h-full" />
              </div>
            </div>

            {/* Thanh điều khiển phụ (Control Bar) */}
            <div className="flex items-center justify-center gap-2 p-1.5 rounded-lg bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)]">
              <button 
                onClick={() => injectKey(25)} 
                className="p-2 rounded hover:bg-white/10 text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer" 
                title="Giảm âm lượng"
              >
                <Volume1 size={18} />
              </button>
              <button 
                onClick={() => injectKey(24)} 
                className="p-2 rounded hover:bg-white/10 text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer" 
                title="Tăng âm lượng"
              >
                <Volume2 size={18} />
              </button>
              <button 
                onClick={() => injectKey(26)} 
                className="p-2 rounded hover:bg-white/10 text-[var(--color-binance-gray)] hover:text-white transition-colors cursor-pointer" 
                title="Nguồn (Tắt/Mở màn hình)"
              >
                <Power size={18} />
              </button>
              
              <div className="w-px h-6 bg-[var(--color-binance-border)] mx-2" />
              
              <button
                onClick={disconnect}
                className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 px-3 rounded text-xs font-bold transition-all active:scale-[0.95] cursor-pointer"
                title="Ngắt kết nối"
              >
                <XCircle size={14} /> NGẮT KẾT NỐI
              </button>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
