import cloudinary from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export const uploadFileToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.path) {
            return reject(new Error('No file provided'));
        }
        const isVideo = file.mimetype && file.mimetype.startsWith('video');
        const options = {
            resource_type: isVideo ? 'video' : 'image',
        };
        const uploader = isVideo
            ? cloudinary.v2.uploader.upload_large
            : cloudinary.v2.uploader.upload;
        uploader(file.path, options, (error, result) => {
            // remove local file after upload
            fs.unlink(file.path, () => { });
            if (error)
                return reject(error);
            resolve(result);
        });
    });
};
export const multerMiddleware = multer({ dest: 'uploads/' }).single('media');
//# sourceMappingURL=cloudinary.js.map