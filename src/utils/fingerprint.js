/**
 * Device Fingerprinting Utility
 * Thu thập các tín hiệu trình duyệt và tạo fingerprint hash ổn định.
 * Dùng để nhận diện thiết bị ngay cả khi đổi tài khoản hoặc dùng IP khác.
 */

// Simple djb2-like hash cho string (không cần crypto subtle ở đây)
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // Giữ 32-bit unsigned
  }
  return hash.toString(16).padStart(8, '0');
}

// Canvas fingerprint: vẽ text và shape, lấy pixel data hash
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.font = '11pt Arial';
    ctx.fillText('AnvTools🔒#2024', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.font = '18pt Times New Roman';
    ctx.fillText('AnvTools🔒#2024', 4, 17);
    return hashString(canvas.toDataURL());
  } catch {
    return 'no-canvas';
  }
}

// WebGL renderer info
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'no-ext';
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
    return hashString(vendor + '|' + renderer);
  } catch {
    return 'no-webgl';
  }
}

// Thu thập tất cả tín hiệu
function collectSignals() {
  const nav = navigator;
  const scr = screen;

  return [
    nav.userAgent || '',
    nav.language || '',
    nav.languages ? nav.languages.join(',') : '',
    String(nav.hardwareConcurrency || 0),
    String(nav.deviceMemory || 0),
    String(nav.platform || ''),
    String(nav.maxTouchPoints || 0),
    `${scr.width}x${scr.height}x${scr.colorDepth}`,
    String(scr.pixelDepth || 0),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    String(new Date().getTimezoneOffset()),
    String(!!nav.cookieEnabled),
    String(!!window.indexedDB),
    String(!!window.localStorage),
    String(!!window.sessionStorage),
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ].join('||');
}

let _cachedFingerprint = null;

/**
 * Tạo fingerprint hash cho thiết bị hiện tại.
 * Kết quả được cache trong session để tránh tính lại nhiều lần.
 * @returns {string} Fingerprint hex string
 */
export function getDeviceFingerprint() {
  if (_cachedFingerprint) return _cachedFingerprint;

  // Thử đọc từ sessionStorage trước
  try {
    const cached = sessionStorage.getItem('_anvfp');
    if (cached) {
      _cachedFingerprint = cached;
      return cached;
    }
  } catch {}

  const signals = collectSignals();
  const fp = hashString(signals);
  _cachedFingerprint = fp;

  try {
    sessionStorage.setItem('_anvfp', fp);
  } catch {}

  return fp;
}
