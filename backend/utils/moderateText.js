import { Filter } from "bad-words";
import {
  badWordsVietnameseStrict,
  badWordsVietnameseSoft,
} from "../constants/badWords.js";

const moderateText = (text) => {
  const filterStrict = new Filter();
  filterStrict.addWords(...badWordsVietnameseStrict);

  const filterSoft = new Filter();
  filterSoft.addWords(...badWordsVietnameseSoft);

  const normalizedText = text.normalize("NFC").toLowerCase();

  // Kiểm tra từ nặng trước
  if (filterStrict.isProfane(normalizedText)) {
    return { ok: false, message: "The post contains inappropriate language." };
  }

  const cleanedSoft = filterSoft.clean(normalizedText);

  return { ok: true, cleanedText: cleanedSoft };
};

const cleanCommentText = (text) => {
  const filterStrict = new Filter();
  filterStrict.addWords(...badWordsVietnameseStrict);

  const filterSoft = new Filter();
  filterSoft.addWords(...badWordsVietnameseSoft);

  const normalizedText = text.normalize("NFC");

  if (filterStrict.isProfane(normalizedText)) {
    return { ok: false, message: "The post contains inappropriate language." };
  }

  // Clean từ nhẹ và trả về
  const cleanedSoft = filterSoft.clean(normalizedText);

  return { ok: true, cleanedText: cleanedSoft };
};

export { moderateText, cleanCommentText };
