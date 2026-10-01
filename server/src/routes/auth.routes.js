import { Router } from "express";
import {
  changePassword,
  login,
  logout,
  me,
  register,
  registerCustomer,
  updateProfile,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/customer/register", authLimiter, validate(registerSchema), registerCustomer);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);
router.post("/password", requireAuth, validate(changePasswordSchema), changePassword);

export default router;
