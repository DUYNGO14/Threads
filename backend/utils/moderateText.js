import { Filter } from "bad-words";
import {
  badWordsVietnameseStrict,
  badWordsVietnameseSoft,
} from "../constants/badWords.js";

// Regex phát hiện biến thể như đjt, c*c, l0n...
const variantRegexPatterns = [
  // địt, djt, đjt, dit (địt) với các biến thể
  /d[^\w]*[i|j][^\w]*t/i, // đjt, dit, địt
  /l[^\w]*[o0][^\w]*n/i, // l0n, lon, l0m
  /c[^\w]*[a@][^\w]*[c|k]/i, // c@c, c*k, cak
  /đ[^\w]*[ụu~][^\w]*(m|ê|e)?/i, // đụ, đụ mẹ, đụ m
  /v[^\w]*[aã~][^\w]*i[^\w]*(l[oô]n|c[aă]c)/i, // vãi lồn, vãi cặc
  /t[^\w]*h[^\w]*a[^\w]*n[^\w]*g/i, // thằng
  /c[^\w]*h[^\w]*ó[^\w]*m/i, // chó má, chó mẹ
  /b[^\w]*a[^\w]*c[^\w]*h/i, // bitch, ba ch
  /s[^\w]*h[^\w]*i[^\w]*t/i, // shit
];

const normalizeText = (text) => {
  return text.normalize("NFC").toLowerCase().trim();
};

// Setup filters
const filterStrict = new Filter();
filterStrict.addWords(...badWordsVietnameseStrict);

const filterSoft = new Filter();
filterSoft.addWords(...badWordsVietnameseSoft);

export const moderateTextSmart = (text) => {
  const normalizedText = normalizeText(text);

  // 1. Kiểm tra biến thể từ tục (viết lái, thay kí tự)
  for (const pattern of variantRegexPatterns) {
    if (pattern.test(normalizedText)) {
      console.log("Detected disguised profanity:", normalizedText); // Log lỗi cho việc kiểm tra
      return {
        ok: false,
        message: "Content contains offensive language.",
      };
    }
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
