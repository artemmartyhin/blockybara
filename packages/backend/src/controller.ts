import express from "express";
import { body } from "express-validator";
import multer from "multer";
import {
  requestAESKey,
  processFile,
  requestDecryptedFile,
  decryptFile
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
  body("container").isString().withMessage("Invalid container address"),
  body("sender").isString().withMessage("Invalid sender address"),
  requestDecryptedFile
);

router.post(
  "/decrypt",
  body("aesKey").isString().withMessage("Invalid AES key"),
  body("blobId").isString().withMessage("Invalid blob ID"),
  decryptFile
);

export default router;
