import { LIMIT_PAGINATION_POST } from "../../constants/pagination.js";

const getPaginationParams = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || LIMIT_PAGINATION_POST;
  if (limit > 50) limit = 50;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
export default getPaginationParams;
