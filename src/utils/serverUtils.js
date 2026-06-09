// Lõi In-memory xử lý Caching và Rate Limit
// Lưu ý: Trong môi trường Production (như Vercel Serverless), memory này sẽ bị reset khi server sleep.
// Giải pháp thực tế dài hạn là dùng Upstash Redis.

const requestLog = new Map();
const apiCache = new Map();

/**
 * Hàm kiểm tra Rate Limit chống Spam
 * @param {string} ip Địa chỉ IP người dùng
 * @param {number} limit Số lượng request tối đa (VD: 5)
 * @param {number} windowMs Cửa sổ thời gian tính bằng mili-giây (VD: 60000 = 1 phút)
 * @returns {boolean} true nếu hợp lệ, false nếu bị block
 */
export function checkRateLimit(ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const userRecord = requestLog.get(ip) || { count: 0, startTime: now };

  if (now - userRecord.startTime > windowMs) {
    // Nếu đã qua cửa sổ thời gian, reset đếm
    userRecord.count = 1;
    userRecord.startTime = now;
    requestLog.set(ip, userRecord);
    return true;
  }

  if (userRecord.count >= limit) {
    // Nếu vượt quá số lần cho phép
    return false;
  }

  // Nếu hợp lệ
  userRecord.count += 1;
  requestLog.set(ip, userRecord);
  return true;
}

/**
 * Đọc dữ liệu từ Cache
 * @param {string} key Từ khóa (VD: url video TikTok)
 */
export function getCache(key) {
  const cached = apiCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    apiCache.delete(key);
    return null; // Cache hết hạn
  }
  
  return cached.data;
}

/**
 * Ghi dữ liệu vào Cache
 * @param {string} key Từ khóa
 * @param {any} data Dữ liệu cần lưu
 * @param {number} ttlMs Thời gian sống (Time to live) bằng mili-giây
 */
export function setCache(key, data, ttlMs = 300000) { // Mặc định 5 phút
  apiCache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
}
