import cloudinary from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

const { CLOUD_API_KEY, CLOUD_SECRET_KEY, CLOUD_NAME } = process.env;
cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_SECRET_KEY,
});

export const uploadImage = async (fileBuffer, filename) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          chunk_size: 6000000,
          resource_type: "image",
          folder: "Packdraw-Clone",
          public_id: filename,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(fileBuffer);
    });

    return result.secure_url;
  } catch (error) {
    throw error;
  }
};
