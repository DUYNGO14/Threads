import { LIMIT_PAGINATION_POST } from "../../constants/pagination.js";

const getPaginationParams = (req) => {
  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || LIMIT_PAGINATION_POST;

  // Đảm bảo giá trị tối thiểu
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 50) limit = 50;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export default getPaginationParams;
