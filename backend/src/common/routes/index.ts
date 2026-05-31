import { Router } from "express";
import AuthRoute from "@modules/auth/auth.route";
import VocabRoute from "@modules/vocab/vocab.route";

const router = Router();

router.use("/auth", AuthRoute);
router.use("/vocab", VocabRoute);

export default router;
