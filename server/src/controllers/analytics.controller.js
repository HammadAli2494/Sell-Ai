import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as analyticsService from "../services/analytics.service.js";

export const getMine = asyncHandler(async (req, res) => {
  const days = req.validatedQuery?.days;
  const analytics = await analyticsService.getStoreAnalytics(req.store.id, { days });
  sendSuccess(res, { analytics });
});
