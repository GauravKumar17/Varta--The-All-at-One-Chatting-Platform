import type { Request, Response } from "express";
export declare const sendOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const viewProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkAuthenticated: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authControllers.d.ts.map