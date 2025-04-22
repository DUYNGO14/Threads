const sanitizeUsername = (username) => {
  return username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") // Thay khoảng trắng bằng _
    .replace(/[^a-z0-9_-]/g, ""); // Loại bỏ ký tự không hợp lệ
};
export default sanitizeUsername;
