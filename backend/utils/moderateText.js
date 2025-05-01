import { Filter } from "bad-words";
import {
  badWordsVietnameseStrict,
  badWordsVietnameseSoft,
} from "../constants/badWords.js";

// Regex phát hiện biến thể như đjt, c*c, l0n...
const variantRegexPatterns = [
  /l[^\w]*[o0][^\w]*n(?![a-z])/i, // Chỉ khớp với "lon", "l0n", không khớp với các từ khác
  /c[^\w]*[a@][^\w]*[c|k](?![a-z])/i, // Chỉ khớp với "c@c", "c*k", không khớp với từ hợp lệ
  /đ[^\w]*[ụu~][^\w]*(m|ê|e)?(?![a-z])/i, // Chỉ khớp với "đụ", "đụ mẹ", không khớp với từ khác
  /v[^\w]*[aã~][^\w]*i[^\w]*(l[oô]n|c[aă]c)(?![a-z])/i, // Chỉ khớp với "vãi lồn", "vãi cặc"
  /t[^\w]*h[^\w]*a[^\w]*n[^\w]*g(?![a-z])/i, // Chỉ khớp với "thằng"
  /c[^\w]*h[^\w]*ó[^\w]*m(?![a-z])/i, // Chỉ khớp với "chó má", "chó mẹ"
  /b[^\w]*a[^\w]*c[^\w]*h(?![a-z])/i, // Chỉ khớp với "bitch", "ba ch"
  /s[^\w]*h[^\w]*i[^\w]*t(?![a-z])/i, // Chỉ khớp với "shit"
];

const normalizeText = (text) => {
  return text
    .normalize("NFC") // Chuẩn hóa Unicode
    .toLowerCase() // Chuyển thành chữ thường
    .replace(/[^\w\s]/g, "") // Loại bỏ ký tự đặc biệt
    .trim(); // Xóa khoảng trắng thừa
};

// Setup filters
const filterStrict = new Filter();
filterStrict.addWords(...badWordsVietnameseStrict);

const filterSoft = new Filter();
filterSoft.addWords(...badWordsVietnameseSoft);
const checkProfanityVariants = (text) => {
  const normalizedText = normalizeText(text); // Chuẩn hóa văn bản
  const words = normalizedText.split(/\s+/); // Tách nội dung thành từng từ

  for (const word of words) {
    for (const pattern of variantRegexPatterns) {
      if (pattern.test(word)) {
        console.log("Matched pattern:", pattern.toString(), "for word:", word); // Log biểu thức regex khớp
        return {
          ok: false,
          message: "Content contains disguised offensive language.",
          matchedPattern: pattern.toString(), // Biểu thức regex khớp
          matchedWord: word, // Từ bị phát hiện
        };
      }
    }
  }

  return {
    ok: true,
    message: "No disguised offensive language detected.",
  };
};
export const moderateTextSmart = (text) => {
  const normalizedText = normalizeText(text);

  // 1. Kiểm tra biến thể từ tục (viết lái, thay kí tự)
  const variantCheck = checkProfanityVariants(normalizedText);
  if (!variantCheck.ok) {
    console.log("Detected offensive language:", variantCheck.message);
    console.log("Matched pattern:", variantCheck.matchedPattern);
    console.log("Matched word:", variantCheck.matchedWord);
    return {
      ok: false,
      message: variantCheck.message,
      matchedWord: variantCheck.matchedWord,
    };
  }

  // 2. Kiểm tra từ cấm nặng (chặn ngay)
  if (filterStrict.isProfane(normalizedText)) {
    console.log("Detected strict profanity:", normalizedText); // Log lỗi cho việc kiểm tra
    return {
      ok: false,
      message: "Content contains offensive language.",
    };
  }

  // 3. Kiểm tra từ cấm nhẹ → làm sạch
  const cleanedSoft = filterSoft.clean(normalizedText);

  return {
    ok: true,
    message: "Nội dung đã được kiểm duyệt sơ bộ.",
    cleanedText: cleanedSoft,
  };
};
