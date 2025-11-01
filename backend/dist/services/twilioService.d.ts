import type { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck.js';
export declare const sendOtpToPhoneNumber: (phoneNumber: string) => Promise<void>;
export declare const verifyPhoneNumberOtp: (phoneNumber: string, otp: string) => Promise<VerificationCheckInstance>;
//# sourceMappingURL=twilioService.d.ts.map