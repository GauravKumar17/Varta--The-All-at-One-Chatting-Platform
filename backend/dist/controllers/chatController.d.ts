import type { Request, Response } from "express";
export type MessageRequestBody = {
    senderId: number;
    receiverId: number;
    content: string;
    messageStatus?: 'SENT' | 'DELIVERED' | 'READ';
};
export declare const sendMessage: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=chatController.d.ts.map