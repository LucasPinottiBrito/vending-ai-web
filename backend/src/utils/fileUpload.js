const fs = require("node:fs");
const path = require("node:path");

const multer = require("multer");

const env = require("../config/env");
const ApiError = require("./ApiError");

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedJsonMimeTypes = new Set([
  "application/json",
  "text/json",
  "text/plain",
  "application/octet-stream",
]);

fs.mkdirSync(env.uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.uploadPath);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    cb(null, `${Date.now()}-${safeBase || "product"}${ext}`);
  },
});

function imageFileFilter(req, file, cb) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new ApiError(400, "Invalid image type", "INVALID_FILE_TYPE"));
    return;
  }

  cb(null, true);
}

const productImageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

function jsonFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== ".json" || !allowedJsonMimeTypes.has(file.mimetype)) {
    cb(new ApiError(400, "Invalid JSON file type", "INVALID_FILE_TYPE"));
    return;
  }

  cb(null, true);
}

const jsonFileUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: jsonFileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
});

module.exports = {
  productImageUpload,
  jsonFileUpload,
};
