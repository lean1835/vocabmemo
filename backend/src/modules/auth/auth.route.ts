import { Router } from "express";
import { validate } from "@common/middlewares/validate.middleware";
import { authenticationMiddleware } from "@common/middlewares/authen.middleware";
import { registerSchema, loginSchema } from "./auth.validation";
import { register, login, getMe } from "./auth.controller";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authenticationMiddleware, getMe);

export default router;
