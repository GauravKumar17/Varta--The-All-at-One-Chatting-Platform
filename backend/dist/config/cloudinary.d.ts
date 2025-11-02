interface LocalFile {
    path: string;
    mimetype?: string | null;
}
type CloudinaryUploadResult = any;
export declare const uploadFileToCloudinary: (file?: LocalFile | null) => Promise<CloudinaryUploadResult>;
export declare const multerMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export {};
//# sourceMappingURL=cloudinary.d.ts.map