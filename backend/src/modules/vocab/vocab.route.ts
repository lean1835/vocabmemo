import { Router } from "express";
import { validate } from "@common/middlewares/validate.middleware";
import { authenticationMiddleware } from "@common/middlewares/authen.middleware";
import { createVocabSchema, updateVocabSchema } from "./vocab.validation";
import {
  createVocab,
  getVocabs,
  getVocabById,
  updateVocab,
  deleteVocab,
  getVocabMetadata,
} from "./vocab.controller";

const router = Router();

// Toàn bộ các route từ vựng bắt buộc phải đăng nhập
router.use(authenticationMiddleware);

router.post("/", validate(createVocabSchema), createVocab);
router.get("/", getVocabs);
router.get("/metadata", getVocabMetadata);
router.get("/:id", getVocabById);
router.put("/:id", validate(updateVocabSchema), updateVocab);
router.delete("/:id", deleteVocab);

export default router;
