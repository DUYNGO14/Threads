import { atom } from "recoil";
import CryptoJS from "crypto-js";

const secretKey = "your-very-strong-secret-key"; // Khóa bí mật để mã hóa

// Hàm mã hóa dữ liệu
const encryptData = (data) => {
  console.log("Encrypting data:", data);
  try {
    const json = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(json, secretKey).toString();
    return encrypted;
  } catch (error) {
    console.error("Failed to encrypt data", error);
    return null;
  }
};

// Hàm giải mã dữ liệu
const decryptData = (encrypted) => {
  try {
    console.log("Decrypting data:", encrypted);
    const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // Kiểm tra nếu chuỗi JSON hợp lệ
    if (!decrypted) {
      throw new Error("Decrypted data is empty or invalid");
    }

    const parsedData = JSON.parse(decrypted);
    return parsedData;
  } catch (error) {
    console.error("Failed to decrypt data", error);
    return null;
  }
};

// Lấy dữ liệu từ localStorage khi khởi tạo
const savedUser = localStorage.getItem("user-threads");
let initialUser = null;

if (savedUser) {
  try {
    initialUser = decryptData(savedUser);
  } catch (error) {
    console.error("Failed to initialize userAtom with saved data", error);
    localStorage.removeItem("user-threads"); // Xóa dữ liệu không hợp lệ
  }
}

const userAtom = atom({
  key: "userAtom",
  default: initialUser,
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet((newValue) => {
        if (newValue) {
          const encrypted = encryptData(newValue);
          localStorage.setItem("user-threads", encrypted);
        } else {
          console.log("Removing user data from localStorage");
          localStorage.removeItem("user-threads");
        }
      });
    },
  ],
});

export default userAtom;
