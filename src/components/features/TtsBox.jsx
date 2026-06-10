"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Download, Mic, Settings2, Activity, Plus, Trash2, Camera, X, Crop } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

export default function TtsBox() {
  const [blocks, setBlocks] = useState([""]);
  const text = blocks.join("\n\n");
  const [voices, setVoices] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('v1');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const [provider, setProvider] = useState('tiktokvn');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const tiktokVnModels = [
    { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh', desc: 'Nam • Trầm ấm', avatar: '👨🏻', pitchMod: 1, rateMod: 1 },
    { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My', desc: 'Nữ • Ngôn tình', avatar: '👩🏻', pitchMod: 1, rateMod: 1 }
  ];

  const activeModels = provider === 'tiktokvn' ? tiktokVnModels : [];

  useEffect(() => {
    setSelectedModelId(activeModels[0].id);
  }, [provider]);

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      setCompletedCrop(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result?.toString() || '');
        setCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImgBlob = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        resolve(blob);
      }, 'image/png');
    });
  };

  const runOcrOnCrop = async () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height || !imgRef.current) {
      toast.error("Vui lòng kéo thả chuột để khoanh vùng chữ cần quét!");
      return;
    }

    setCropModalOpen(false);

    try {
      setIsOcrLoading(true);
      setOcrProgress(0);
      const toastId = toast.loading("Đang xử lý và làm nét vùng ảnh cắt...");

      const croppedBlob = await getCroppedImgBlob(imgRef.current, completedCrop);
      if (!croppedBlob) throw new Error("Crop failed");

      // Tiền xử lý ảnh (phóng to, tăng độ tương phản) để AI đọc chữ chuẩn xác hơn
      const preprocessedImage = await new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const scale = 2;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            let v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            v = v < 128 ? v * 0.7 : v * 1.3;
            if (v > 255) v = 255;
            data[i] = data[i + 1] = data[i + 2] = v;
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(croppedBlob);
      });

      const Tesseract = (await import('tesseract.js')).default;
      
      toast.loading("Đang phân tích hình ảnh...", { id: toastId });

      const result = await Tesseract.recognize(
        preprocessedImage,
        'vie',
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.floor(m.progress * 100));
            }
          }
        }
      );

      // Xóa khoảng trắng thừa do AI sinh ra
      let extractedText = result.data.text.trim();
      extractedText = extractedText.replace(/  +/g, ' ');

      if (!extractedText) {
        toast.error("Không tìm thấy văn bản nào trong vùng bạn chọn!", { id: toastId });
        return;
      }

      // Append to blocks or update the last empty block
      setBlocks(prev => {
        const newBlocks = [...prev];
        const lastBlock = newBlocks[newBlocks.length - 1];
        if (lastBlock.trim() === "") {
          newBlocks[newBlocks.length - 1] = extractedText;
        } else {
          newBlocks.push(extractedText);
        }
        return newBlocks;
      });
      
      toast.success("Trích xuất văn bản thành công!", { id: toastId });

    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Có lỗi xảy ra khi phân tích ảnh.");
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePlay = async (index = -1) => {
    let textToPlay = index === -1 ? text : blocks[index];

    if (!textToPlay.trim()) {
      toast.error("Vui lòng nhập nội dung cần đọc!");
      return;
    }

    const wasPlayingIndex = playingIndex;
    const wasIsPlaying = isPlaying;

    // Dừng triệt để audio hiện tại (dù đang phát hay đang tải)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }

    if (wasIsPlaying || wasPlayingIndex !== null) {
      setIsPlaying(false);
      setPlayingIndex(null);
      // Nếu bấm lại chính ô đang phát/tải thì chỉ mang tính chất Dừng.
      if (wasPlayingIndex === index) return;
    }

    if (provider === 'elevenlabs') {
      toast.error("Tính năng Giọng PRO đang được phát triển!");
      return;
    }

    setPlayingIndex(index);

    // --- TikTok VN (Edge TTS) Fallback ---
    // Edge TTS giới hạn ~ 500 ký tự mỗi lần nghe thử
    const previewText = textToPlay.slice(0, 500);
    if (textToPlay.length > 500) {
      toast.success("Bản nghe thử giới hạn 500 ký tự đầu. Vui lòng Tải File để lấy toàn bộ.");
    }

    const toastId = toast.loading("Đang gọi máy chủ Tiếng Việt...");
    const url = `/api/tts-edge?text=${encodeURIComponent(previewText)}&voice=${selectedModelId}&rate=${rate}&pitch=${pitch}`;
    const audio = new Audio(url);
    
    audio.preservesPitch = false;
    audio.mozPreservesPitch = false;
    audio.webkitPreservesPitch = false;

    audio.onplaying = () => { setIsPlaying(true); toast.dismiss(toastId); };
    audio.onwaiting = () => { setIsPlaying(false); };
    audio.onended = () => { setIsPlaying(false); setPlayingIndex(null); };
    audio.onerror = () => {
      setIsPlaying(false);
      setPlayingIndex(null);
      toast.dismiss(toastId);
      toast.error("Lỗi kết nối máy chủ giọng nói.");
    };

    audioRef.current = audio;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        if (e.name !== 'AbortError') {
          console.error("Audio play error:", e);
        }
      });
    }
  };

  const handleGenerateMp3 = async (index = -1) => {
    let textToDownload = index === -1 ? text : blocks[index];

    if (!textToDownload.trim()) {
      toast.error("Vui lòng nhập nội dung!");
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlayingIndex(null);
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Fake progress while waiting for real download
      let p = 10;
      setProgress(p);
      const interval = setInterval(() => {
        p += Math.floor(Math.random() * 10);
        if (p > 90) p = 90;
        setProgress(p);
      }, 500);

      const response = await fetch(`/api/tts-edge?text=${encodeURIComponent(textToDownload)}&voice=${selectedModelId}&rate=${rate}&pitch=${pitch}`);
      
      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        throw new Error("Lỗi tải file từ máy chủ");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `tiktok_voice_${new Date().getTime()}.mp3`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Tải file MP3 thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Tải file thất bại. Vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--color-binance-border)]">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-binance-yellow)]/10 flex items-center justify-center text-[var(--color-binance-yellow)]">
          <Mic size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-binance-light)]">Tạo Giọng Nói AI</h2>
          <p className="text-sm text-[var(--color-binance-gray)]">Chuyển văn bản thành giọng đọc tự nhiên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Nhập văn bản */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-3">
            {blocks.map((blockText, index) => (
              <div key={index} className="relative group">
                <textarea
                  value={blockText}
                  onChange={(e) => {
                    const newBlocks = [...blocks];
                    newBlocks[index] = e.target.value;
                    setBlocks(newBlocks);
                  }}
                  placeholder={`Nhập kịch bản đoạn ${index + 1} của bạn vào đây...`}
                  className="w-full h-32 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-4 text-[var(--color-binance-light)] placeholder-[var(--color-binance-gray)] focus:border-[var(--color-binance-yellow)] outline-none resize-none transition-colors"
                />
                
                {/* Nút phát riêng rẽ cho từng ô */}
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button
                    onClick={() => handlePlay(index)}
                    className={cn(
                      "flex items-center text-xs font-bold px-2 py-1.5 rounded-md bg-[var(--color-binance-darker)] border transition-colors",
                      isPlaying && playingIndex === index
                        ? "border-red-500 text-red-500 hover:bg-red-500/10"
                        : "border-[var(--color-binance-border)] text-[var(--color-binance-light)] hover:border-[var(--color-binance-yellow)] hover:text-[var(--color-binance-yellow)]"
                    )}
                  >
                    {playingIndex === index ? (
                      isPlaying ? (
                        <><Square size={12} className="mr-1" /> Dừng</>
                      ) : (
                        <><Activity size={12} className="mr-1 animate-spin" /> Đang tải...</>
                      )
                    ) : (
                      <><Play size={12} className="mr-1" /> Nghe ô này</>
                    )}
                  </button>
                  <button
                    onClick={() => handleGenerateMp3(index)}
                    className="flex items-center text-xs font-bold px-2 py-1.5 rounded-md bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] text-[var(--color-binance-light)] hover:border-[var(--color-binance-yellow)] hover:text-[var(--color-binance-yellow)] transition-colors"
                  >
                    <Download size={12} className="mr-1" /> Tải
                  </button>
                </div>

                {blocks.length > 1 && (
                  <button 
                    onClick={() => {
                      const newBlocks = blocks.filter((_, i) => i !== index);
                      setBlocks(newBlocks);
                    }}
                    className="absolute top-3 right-3 text-[var(--color-binance-gray)] hover:text-red-500 bg-[var(--color-binance-darker)] p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Xóa đoạn này"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 text-xs text-[var(--color-binance-gray)]">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setBlocks([...blocks, ""])}
                className="flex items-center text-[var(--color-binance-yellow)] hover:text-yellow-300 font-bold px-3 py-1.5 bg-[var(--color-binance-yellow)]/10 hover:bg-[var(--color-binance-yellow)]/20 rounded-md transition-colors"
              >
                <Plus size={14} className="mr-1" /> Thêm ô nhập mới
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isOcrLoading}
                className="flex items-center text-[var(--color-binance-light)] hover:text-[var(--color-binance-yellow)] font-bold px-3 py-1.5 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] hover:border-[var(--color-binance-yellow)] rounded-md transition-colors"
                title="Tải ảnh lên để trích xuất chữ"
              >
                {isOcrLoading ? (
                  <><Activity size={14} className="mr-1 animate-spin" /> Đang quét {ocrProgress}%</>
                ) : (
                  <><Camera size={14} className="mr-1" /> Trích xuất từ Ảnh</>
                )}
              </button>
            </div>
            
            <div className="bg-[var(--color-binance-dark)] px-2 py-1 rounded-md border border-[var(--color-binance-border)]">
              {text.length} / 5000 ký tự
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className={cn("flex-1", playingIndex === -1 && (isPlaying ? "border-red-500 text-red-500 hover:text-red-400 hover:border-red-400" : "border-yellow-500 text-yellow-500"))}
              onClick={() => handlePlay(-1)}
              disabled={isGenerating}
            >
              {playingIndex === -1 ? (
                isPlaying ? (
                  <><Square size={16} className="mr-2" /> Dừng Tất Cả</>
                ) : (
                  <><Activity size={16} className="mr-2 animate-spin" /> Đang xử lý...</>
                )
              ) : (
                <><Play size={16} className="mr-2" /> Nghe Tất Cả</>
              )}
            </Button>
            
            <Button 
              variant="primary" 
              className="flex-1 relative overflow-hidden"
              onClick={() => handleGenerateMp3(-1)}
              disabled={isGenerating || !text.trim()}
            >
              {isGenerating ? (
                <div className="absolute inset-0 bg-[var(--color-binance-yellow)] flex items-center justify-center">
                  <Activity className="animate-spin mr-2" size={16} /> 
                  Đang xử lý {progress}%
                </div>
              ) : (
                <><Download size={16} className="mr-2" /> Tải File MP3</>
              )}
            </Button>
          </div>
        </div>

        {/* Cột phải: Cài đặt giọng nói */}
        <div className="space-y-6 bg-[var(--color-binance-dark)] border border-[var(--color-binance-border)] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 size={16} className="text-[var(--color-binance-yellow)]" />
            <h3 className="font-bold text-[var(--color-binance-light)]">Tùy Chỉnh Giọng Đọc</h3>
          </div>

          <div className="flex bg-[var(--color-binance-darker)] p-1 rounded-lg border border-[var(--color-binance-border)] mb-6">
            <button 
              onClick={() => setProvider('tiktokvn')}
              className={cn("flex-1 py-1.5 text-sm font-bold rounded-md transition-all focus:outline-none", provider === 'tiktokvn' ? "bg-[var(--color-binance-yellow)] text-[var(--color-binance-darker)]" : "text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)]")}
            >
              TikTok VN (Free)
            </button>
            <button 
              onClick={() => toast("Tính năng Giọng PRO đang được phát triển và sẽ sớm ra mắt!", { icon: "🚧", style: { borderRadius: '10px', background: '#333', color: '#fff' } })}
              className="flex-1 py-1.5 text-sm font-bold rounded-md transition-all focus:outline-none text-[var(--color-binance-gray)] hover:text-[var(--color-binance-light)] bg-[var(--color-binance-dark)] border border-dashed border-[var(--color-binance-border)]"
            >
              Giọng PRO 👑
            </button>
          </div>



          <div className="mb-6">
            <label className="text-sm text-[var(--color-binance-gray)] block mb-3">Chọn mô hình giọng nói</label>
            <div className="grid grid-cols-2 gap-3">
              {activeModels.map((model) => {
                const isActive = selectedModelId === model.id;
                const activeColor = 'var(--color-binance-yellow)';
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    style={isActive ? { borderColor: activeColor, backgroundColor: 'rgba(240, 185, 11, 0.1)' } : {}}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 focus:outline-none",
                      isActive 
                        ? "shadow-sm scale-105"
                        : "border-[var(--color-binance-border)] bg-[var(--color-binance-darker)] hover:border-[var(--color-binance-gray)]"
                    )}
                  >
                    <span className="text-3xl mb-1">{model.avatar}</span>
                    <span className="font-bold text-[13px] whitespace-nowrap" style={{ color: isActive ? activeColor : 'var(--color-binance-light)' }}>
                      {model.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-binance-gray)]">{model.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm text-[var(--color-binance-gray)]">Tốc độ đọc (Speed)</label>
              <span className="text-sm font-bold text-[var(--color-binance-light)]">{rate}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" max="2" step="0.1" 
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-binance-yellow)] cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm text-[var(--color-binance-gray)]">Độ trầm bổng (Pitch)</label>
              <span className="text-sm font-bold text-[var(--color-binance-light)]">{pitch}</span>
            </div>
            <input 
              type="range" 
              min="0.5" max="2" step="0.1" 
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-[var(--color-binance-yellow)] cursor-pointer"
            />
          </div>

          {provider === 'tiktokvn' && (
            <div className="mt-6 p-3 bg-[var(--color-binance-yellow)]/10 border border-[var(--color-binance-yellow)]/20 rounded-lg">
              <p className="text-xs text-[var(--color-binance-yellow)] leading-relaxed">
                * Mẹo: Đây chính là 2 giọng "Cô gái ngôn tình" (Hoài My) và "Thanh niên trầm ấm" (Nam Minh) làm mưa làm gió trên Tiktok VN (Sử dụng công nghệ Azure AI hoàn toàn miễn phí).
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-binance-darker)] border border-[var(--color-binance-border)] rounded-2xl w-[calc(100vw-2rem)] max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-binance-border)]">
              <h3 className="text-lg font-bold text-[var(--color-binance-light)] flex items-center gap-2">
                <Crop size={20} className="text-[var(--color-binance-yellow)]" />
                Khoanh vùng chữ cần trích xuất
              </h3>
              <button 
                onClick={() => setCropModalOpen(false)}
                className="text-[var(--color-binance-gray)] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[var(--color-binance-dark)]">
              {cropImageSrc && (
                <ReactCrop 
                  crop={crop} 
                  onChange={(_, percentCrop) => setCrop(percentCrop)} 
                  onComplete={(c) => setCompletedCrop(c)}
                  className="max-h-full"
                >
                  <img 
                    ref={imgRef}
                    src={cropImageSrc} 
                    alt="Crop Preview" 
                    className="max-h-[60vh] object-contain"
                    onLoad={(e) => {
                      // Tự động chọn 80% vùng ở giữa khi vừa load ảnh
                      const { width, height } = e.currentTarget;
                      setCrop({
                        unit: '%',
                        width: 80,
                        height: 50,
                        x: 10,
                        y: 25
                      });
                    }}
                  />
                </ReactCrop>
              )}
            </div>

            <div className="p-4 border-t border-[var(--color-binance-border)] flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCropModalOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                variant="primary" 
                onClick={runOcrOnCrop}
                className="flex items-center gap-2"
              >
                <Camera size={18} /> Quét vùng đã chọn
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
