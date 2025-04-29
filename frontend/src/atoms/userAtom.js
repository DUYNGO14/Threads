import { recoilPersist } from "recoil-persist";
import CryptoJS from "crypto-js";
import { atom } from "recoil";

const secretKey = "your-very-strong-secret-key"; // Khóa giải mã

const { persistAtom } = recoilPersist({
  key: "user-threads",
  storage: localStorage,
  serializer: {
    stringify: (data) => {
      const json = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(json, secretKey).toString();
      return encrypted;
    },
    parse: (encrypted) => {
      try {
        const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
      } catch (error) {
        console.error("Failed to decrypt recoil persisted data", error);
        return null;
      }
    },
  },
});

const userAtom = atom({
  key: "userAtom",
  default: null,
  effects_UNSTABLE: [persistAtom],
});

export default userAtom;
