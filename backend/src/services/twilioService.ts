import twilio from 'twilio';
import dotenv from 'dotenv';
import type { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck.js';
dotenv.config();

const ACC_SID = process.env.TWILIO_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SERVICE_SID = process.env.TWILIO_SERVICE;

if (!SERVICE_SID) {
    throw new Error("TWILIO_SERVICE environment variable is not set");
}
if (!ACC_SID || !AUTH_TOKEN) {
  throw new Error("Twilio SID or Auth Token environment variable is not set");
}

const client = twilio(ACC_SID,AUTH_TOKEN);

export const sendOtpToPhoneNumber = async(phoneNumber:string): Promise<void> =>{
    try {
        console.log("sending otp to this number ",phoneNumber)
        if(!phoneNumber){
            throw new Error("phone number is required")
        }
        const response = await client.verify.v2.services(SERVICE_SID).verifications.create({
            to:phoneNumber,
            channel:'sms'
        });
        console.log("this is my otp response ", response)
        
    } catch (error) {
        console.log(error);
        throw new Error("Failed to send otp")
        
    }
}

export const verifyPhoneNumberOtp = async(phoneNumber: string, otp: string): Promise<VerificationCheckInstance>=>{
    try {
        if(!phoneNumber || !otp){
            throw new Error("Phone number and otp is required")
        }
        const response = await client.verify.v2.services(SERVICE_SID).verificationChecks.create({
            to: phoneNumber,
            code: otp
        })
        console.log("verification response: ",response);
        return response;
    } catch (error) {
        console.log("Error verifying OTP: ",error);
        throw new Error("Failed to verify OTP");
    }
}


