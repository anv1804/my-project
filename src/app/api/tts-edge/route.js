import { NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import path from 'path';
import os from 'os';
import fs from 'fs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const voiceId = searchParams.get('voice') || 'vi-VN-NamMinhNeural'; // Default "Thanh niên trầm ấm"
  const rateParam = searchParams.get('rate');
  const pitchParam = searchParams.get('pitch');

  if (!text) {
    return new NextResponse('Missing text parameter', { status: 400 });
  }

  let rate = 'default';
  if (rateParam) {
    const val = parseFloat(rateParam);
    if (!isNaN(val) && val !== 1) {
      const p = Math.round((val - 1) * 100);
      rate = p > 0 ? `+${p}%` : `${p}%`;
    }
  }

  let pitch = 'default';
  if (pitchParam) {
    const val = parseFloat(pitchParam);
    if (!isNaN(val) && val !== 1) {
      const p = Math.round((val - 1) * 100);
      pitch = p > 0 ? `+${p}%` : `${p}%`;
    }
  }

  try {
    const tts = new EdgeTTS({
      voice: voiceId,
      lang: 'vi-VN',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: rate,
      pitch: pitch
    });

    const tempFilePath = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);
    
    // Tạo file MP3
    await tts.ttsPromise(text, tempFilePath);
    
    // Đọc file thành Buffer
    const audioBuffer = fs.readFileSync(tempFilePath);
    
    // Xóa file tạm ngay lập tức
    fs.unlinkSync(tempFilePath);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error("Edge TTS Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
