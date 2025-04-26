import CryptoJS from "crypto-js";

// Key bí mật (nên lưu trong biến môi trường nếu cần siêu bảo mật)
const secretKey = "your-very-strong-secret-key";

// Hàm lưu dữ liệu đã mã hóa
function saveEncryptedData(key, data) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    secretKey
  ).toString();
  localStorage.setItem(key, encrypted);
}

// Hàm đọc và giải mã dữ liệu
function loadEncryptedData(key) {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;

  const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

  try {
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error("Lỗi giải mã:", error);
    return null;
  }
}

export { saveEncryptedData, loadEncryptedData };
