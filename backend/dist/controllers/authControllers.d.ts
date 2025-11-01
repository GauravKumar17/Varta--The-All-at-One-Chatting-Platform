import type { Request, Response } from "express";
declare const _default: {
    sendOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    verifyOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateProfile: (req: Request, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=authControllers.d.ts.map