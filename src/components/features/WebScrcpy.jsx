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
import { Consumable, WritableStream } from "@yume-chan/stream-extra";

export default function WebScrcpy() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceModel, setDeviceModel] = useState("");
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
      
      toast.loading("Vui lòng NHẤN CHO PHÉP (ALLOW) trên màn hình điện thoại nếu được hỏi...", { id: "scrcpy", duration: 30000 });
      const authPromise = AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore,
      });
      const authTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Quá thời gian chờ xác nhận (15s). Vui lòng kiểm tra màn hình điện thoại.")), 15000));
      const transport = await Promise.race([authPromise, authTimeout]);
      
      const adb = new Adb(transport);
      adbRef.current = adb;

      // Get device info
      const model = await adb.getProp("ro.product.model");
      setDeviceModel(model.trim());

      // 3. Push Scrcpy server
      toast.loading("Đang đẩy file máy chủ Scrcpy vào thiết bị...", { id: "scrcpy", duration: 30000 });
      const res = await fetch("/scrcpy-server.jar");
      const buffer = await res.arrayBuffer();
      
      const sync = await adb.sync();
      await sync.write({
        filename: "/data/local/tmp/scrcpy-server.jar",
        file: new Blob([buffer]).stream(),
      });
      sync.dispose();

      // 4. Start Scrcpy
      toast.loading("Vui lòng BẬT MÀN HÌNH điện thoại và chọn BẮT ĐẦU (Start Now)...", { id: "scrcpy", duration: 30000 });
      const options = new AdbScrcpyOptionsLatest({
        maxSize: 720,
        bitRate: 4000000,
        audio: false,
        control: true, // Cho phép điều khiển
      }, {
        version: "3.3.3"
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
      
      // Bắt buộc dùng WebGL: Bỏ qua InsertableStream vì bộ đệm MediaStream của Chrome 
      // sẽ tự động drop (vứt bỏ) frame nếu timestamp bị trễ, gây hiện tượng khựng/giật cục (stutter).
      // WebGL sẽ vẽ ngay lập tức bất chấp timestamp.
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
      decoderRef.current = decoder;
      
      const domElement = renderer.element || renderer.canvas;
      
      // Style the renderer (canvas) to fit nicely
      domElement.style.position = "absolute";
      domElement.style.top = "0";
      domElement.style.left = "0";
      domElement.style.width = "100%";
      domElement.style.height = "100%";
      domElement.style.objectFit = "contain";
      domElement.style.borderRadius = "0.5rem";
      
      // Force play if it's a video element (fixes autoplay issues)
      if (domElement instanceof HTMLVideoElement) {
        domElement.playsInline = true;
        domElement.play().catch(e => console.error("Play error:", e));
      }
      
      setVideoElement(domElement);

      videoStream.stream.pipeTo(decoder.writable).catch(console.error);

      // 6. Handle Control Injection (Mouse/Touch)
      // Dịch sự kiện chuột trên DOM renderer (canvas) sang tọa độ Scrcpy
      // Use Pointer events and preventDefault to stop browser's native drag-and-drop from hijacking the swipe
      let isDragging = false;
      let moveEventPending = false;
      let lastMoveEvent = null;

      domElement.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        domElement.setPointerCapture(e.pointerId);
        isDragging = true;
        sendTouchEvent(e, 0 /* ACTION_DOWN */);
      });

      domElement.addEventListener("pointermove", (e) => {
        e.preventDefault();
        if (!isDragging) return;
        
        // Cực kỳ quan trọng: Chuột gaming/touchpad báo cáo tọa độ hàng trăm lần mỗi giây.
        // Gửi toàn bộ qua WebUSB sẽ làm nghẽn cổ chai luồng truyền tải, gây ra hiện tượng khựng (stutter/lag).
        // Giải pháp: Gom các sự kiện di chuyển và chỉ gửi 1 lần mỗi khung hình (60fps) thông qua requestAnimationFrame.
        lastMoveEvent = e;
        if (!moveEventPending) {
          moveEventPending = true;
          requestAnimationFrame(() => {
            if (isDragging && lastMoveEvent) {
              sendTouchEvent(lastMoveEvent, 2 /* ACTION_MOVE */);
            }
            moveEventPending = false;
          });
        }
      });

      domElement.addEventListener("pointerup", (e) => {
        e.preventDefault();
        if (domElement.hasPointerCapture(e.pointerId)) {
          domElement.releasePointerCapture(e.pointerId);
        }
        isDragging = false;
        
        // Đẩy nốt sự kiện di chuyển cuối cùng nếu đang bị giữ lại
        if (moveEventPending && lastMoveEvent) {
          sendTouchEvent(lastMoveEvent, 2 /* ACTION_MOVE */);
          moveEventPending = false;
        }
        
        sendTouchEvent(e, 1 /* ACTION_UP */);
      });

      domElement.addEventListener("pointercancel", (e) => {
        e.preventDefault();
        if (domElement.hasPointerCapture(e.pointerId)) {
          domElement.releasePointerCapture(e.pointerId);
        }
        if (isDragging) {
          isDragging = false;
          moveEventPending = false; // Xóa hàng đợi
          sendTouchEvent(e, 1 /* ACTION_UP */);
        }
      });
      
      // Prevent context menu
      domElement.addEventListener("contextmenu", (e) => e.preventDefault());

      function sendTouchEvent(e, action) {
        if (!scrcpyRef.current || !scrcpyRef.current.controller) return;
        
        const domElement = decoder.renderer.element || decoder.renderer.canvas;
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
    <div className="flex flex-col gap-4 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] p-4 sm:p-6 rounded-xl shadow-lg mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MonitorPlay className="text-[var(--color-binance-yellow)]" size={20} />
          <h2 className="text-base font-bold text-white">Xem Màn Hình Qua WebUSB (BETA)</h2>
        </div>
        {isConnected && (
          <span className="text-[11px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {deviceModel}
          </span>
        )}
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Hướng dẫn & Điều khiển */}
        <div className="flex-1 space-y-4">
          <div className="text-sm text-[var(--color-binance-gray)] bg-[var(--color-binance-darker)] p-4 rounded-lg border border-[var(--color-binance-border)]">
            <p className="font-semibold text-white mb-2">Yêu cầu:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs opacity-90">
              <li>Chỉ hỗ trợ Chrome, Edge, Cốc Cốc.</li>
              <li>Điện thoại Android cần cắm cáp USB vào máy tính.</li>
              <li>Đã bật <strong>Developer Options</strong> và <strong>USB Debugging</strong> (Gỡ lỗi USB) trên điện thoại.</li>
              <li>Xác nhận hộp thoại "Allow USB debugging" trên điện thoại nếu hiển thị.</li>
            </ul>
          </div>

          <div className="flex gap-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-[var(--color-binance-yellow)] hover:bg-[var(--color-binance-yellow)]/90 text-black px-4 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
              >
                {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                {isConnecting ? "Đang kết nối..." : "Kết Nối USB Điện Thoại"}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors"
              >
                <XCircle size={16} />
                Ngắt kết nối
              </button>
            )}
          </div>
        </div>

        {/* Viewport Màn Hình */}
        <div className="w-full lg:w-[350px] shrink-0 bg-black rounded-xl border-2 border-[var(--color-binance-darker)] shadow-inner relative overflow-hidden flex items-center justify-center" style={{ aspectRatio: "9/19" }}>
          {!isConnected ? (
            <div className="text-[var(--color-binance-gray)] flex flex-col items-center gap-3 opacity-50">
              <Smartphone size={40} />
              <span className="text-sm font-semibold">Chưa kết nối</span>
            </div>
          ) : (
            <div className="w-full h-full relative cursor-pointer" title="Bạn có thể thao tác chuột trực tiếp lên đây">
              <div ref={containerRef} className="w-full h-full bg-black" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
