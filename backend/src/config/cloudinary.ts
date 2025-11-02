import cloudinary from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();


cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});


// Upload file to Cloudinary
interface LocalFile {
    path: string;
    mimetype?: string | null;
}

interface CloudinaryUploadOptions {
    resource_type?: 'image' | 'video' | string;
}

type CloudinaryUploadResult = any;

type CloudinaryCallback = (error: Error | null | undefined, result?: CloudinaryUploadResult) => void;
type CloudinaryUploader = (path: string, options: CloudinaryUploadOptions, callback: CloudinaryCallback) => void;

export const uploadFileToCloudinary = (file?: LocalFile | null): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
        if (!file || !file.path) {
            return reject(new Error('No file provided'));
        }

        const isVideo = file.mimetype && file.mimetype.startsWith('video');
        const options: CloudinaryUploadOptions = {
            resource_type: isVideo ? 'video' : 'image',
        };

        const uploader: CloudinaryUploader = isVideo
            ? (cloudinary.v2.uploader.upload_large as CloudinaryUploader)
            : (cloudinary.v2.uploader.upload as CloudinaryUploader);

        uploader(file.path, options, (error, result) => {
            // remove local file after upload
            fs.unlink(file.path, () => {});
            if (error) return reject(error);
            resolve(result);
        });
    });
};

export const multerMiddleware = multer({dest:'uploads/'}).single('media');

