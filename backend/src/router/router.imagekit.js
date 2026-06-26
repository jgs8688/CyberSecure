import "dotenv/config";
import ImageKit from "imagekit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const imagekitData = async (fileBuffer) => {
  try {
    const timestamp = Date.now();

    const result = await imagekit.upload({
      file: fileBuffer, // can be buffer, file stream, or base64
      fileName: `CyberSecure-web_Report_${timestamp}.pdf`,
      folder: "/CyberSecure-web_reports",
      useUniqueFileName: false, // use your own filename format
    });

    console.log("Uploading PDF buffer to ImageKit...");
    console.log("PDF uploaded to ImageKit!");
    console.log("PDF URL:", result.url);

    if (!result.url) {
      throw new Error("Failed to get PDF URL from ImageKit");
    }

    return result.url;
  } catch (error) {
    console.error("ImageKit Upload failed:", error);
    throw error;
  }
};

export default imagekitData;
