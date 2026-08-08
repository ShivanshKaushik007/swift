import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// For generic message attachments (images, pdfs, etc)
const attachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Check if file is raw (not an image or video, e.g. pdf, zip)
    const resource_type = file.mimetype.startsWith("image") || file.mimetype.startsWith("video") ? "auto" : "raw";
    return {
      folder: "swift-chat/attachments",
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")}`,
    };
  },
});

export const uploadAttachment = multer({ storage: attachmentStorage });

export default cloudinary;
