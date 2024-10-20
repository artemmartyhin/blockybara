import express from "express";
import { body } from "express-validator";
import multer from "multer";
import {
  requestAESKey,
  processFile,
  requestDecryptedFile,
} from "./service";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/request-aes-key", requestAESKey);

router.post(
  "/process",
  upload.single("file"),
  body("aesKey").isString().withMessage("AES key is required"),
  processFile
);

router.post(
  "/request",
  body("dataId").isString().withMessage("Invalid data ID"),
  body("aesKey").isString().withMessage("Invalid AES key"),
  requestDecryptedFile
);

export default router;
