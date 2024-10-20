import { Request, Response } from "express";
import { validationResult } from "express-validator";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


export const requestAESKey = (req: Request, res: Response) => {
  console.log("Received request for AES key generation."); 

  try {
    const aesKey = crypto.randomBytes(4).readUInt32BE(0).toString();
    console.log(`Generated AES key: ${aesKey}`);
    res.status(200).json({ aesKey });
  } catch (err) {
    console.error("Error generating AES key:", err);
    res.status(500).json({ message: "Error generating AES key", error: err.message });
  }
};

export const processFile = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const aesKey = parseUInt32(req.body.aesKey);
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const iv = crypto.randomBytes(16);
    const aesBufferKey = Buffer.alloc(32);
    aesBufferKey.writeUInt32BE(aesKey, 0);
    const filePath = path.join(process.cwd(), "uploads", file.filename);
    const fileData = fs.readFileSync(filePath);
    const cipher = crypto.createCipheriv("aes-256-cbc", aesBufferKey, iv);
    let encrypted = cipher.update(fileData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const encryptedFilePath = path.join(__dirname, "uploads", `${file.filename}.enc`);
    fs.writeFileSync(encryptedFilePath, Buffer.concat([iv, encrypted]));
    const formData = new FormData();
    formData.append("file", fs.createReadStream(encryptedFilePath), file.filename);
    const publisherUrl = "https://publisher.walrus-testnet.walrus.space/v1/store?epochs=5";
    const response = await axios.put(publisherUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const fileId = response.data.newlyCreated.blobObject.id;
    fs.unlinkSync(encryptedFilePath);
    res.status(201).json({ message: "File processed, encrypted, and uploaded", fileId });
  } catch (err) {
    console.error("Error processing or uploading file:", err);
    res.status(500).json({ message: "Error processing or uploading file", error: err.message });
  }
};

export const requestDecryptedFile = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const aesKey = parseUInt32(req.body.aesKey);
  const { dataId } = req.body;

  try {
    const encryptedFileContent = Buffer.from("...");
    const iv = encryptedFileContent.slice(0, 16);
    const encryptedData = encryptedFileContent.slice(16);

    const aesBufferKey = Buffer.alloc(32);
    aesBufferKey.writeUInt32BE(aesKey, 0);
    const decipher = crypto.createDecipheriv("aes-256-cbc", aesBufferKey, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ message: "Error decrypting file", error: err.message });
  }
};

const parseUInt32 = (key: string): number => {
  const numKey = parseInt(key, 10);
  if (isNaN(numKey) || numKey < 0 || numKey > 0xFFFFFFFF) {
    throw new Error("Invalid AES key: must be a valid uint32");
  }
  return numKey;
};
