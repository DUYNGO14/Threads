// setup/setupErrorHandler.js
import { notFound, errorHandler } from "../middlewares/errorHandler.js";

export const setupErrorHandler = (app) => {
  app.use(notFound);
  app.use(errorHandler);
};
