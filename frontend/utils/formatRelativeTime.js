import moment from "moment";

function formatRelativeTime(createdAt) {
  const now = moment();
  const time = moment(createdAt);

  // Nếu trong cùng ngày
  if (now.isSame(time, "day")) {
    return time.fromNow(); // ví dụ: "26 phút trước"
  }

  // Nếu hôm qua
  if (now.subtract(1, "day").isSame(time, "day")) {
    return "Tomorrow";
  }

  // Nếu trong cùng tuần
  if (now.isSame(time, "week")) {
    return time.format("dddd"); // ví dụ: "Thứ sáu"
  }

  // Nếu khác tuần thì hiển thị dd/MM/yyyy - HH:mm
  return time.format("DD/MM/YYYY - HH:mm");
}

export default formatRelativeTime;
