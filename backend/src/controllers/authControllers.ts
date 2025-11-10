import type { Request, Response } from "express";
import { otpGenerator } from "../utils/otpGenerator.js";
import prisma from "../config/db.js";
import { sendOtpToEmail } from "../services/emailService.js";
import { sendOtpToPhoneNumber,verifyPhoneNumberOtp } from "../services/twilioService.js";
import { generateToken } from "../utils/generateToken.js";
import { uploadFileToCloudinary } from "../config/cloudinary.js";

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const {phoneNumber, phoneSuffix, email} = req.body;
        const otp = otpGenerator();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        //OTP verification by Email
        if(email){
            const user = await prisma.user.upsert({ //upsert is used to update a record if it exists or create it if it doesn’t,
                where:{email}, //check if user with email exists
                update:{
                    otp:otp,
                    otpExpiry:otpExpiry,
                },
                create:{
                    email,
                    otp:otp,
                    otpExpiry:otpExpiry,
                }
            });
            await sendOtpToEmail(email,otp);
            console.log(`OTP for email ${user.email} saved successfully.`);
            return res.status(200).json({message:"OTP sent to email",email});
        }

        //Otp verification by Phone Number
        if(!phoneNumber || !phoneSuffix){
            return res.status(400).json({
                message:"Phone Number and Country Code are required"
            })
        }

        const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
        const user = await prisma.user.upsert({
            where:{phoneNumber: fullPhoneNumber},
            update:{
                otp: otp,
                otpExpiry: otpExpiry,
            },
            create:{
                phoneNumber: fullPhoneNumber,
                otp: otp,
                otpExpiry: otpExpiry,
            }

        })
        await sendOtpToPhoneNumber(fullPhoneNumber)
        console.log(`OTP for ${user.phoneNumber} saved successfully.`);
        return res.status(200).json({message:"OTP sent to phone",phoneNumber:fullPhoneNumber});

    } catch (error) {
        console.error("Error in sendOtp:", error);
        return res.status(500).json({message:"Internal Server Error"});    
    }

};


export const verifyOtp = async(req:Request, res:Response)=>{

    try {
        const { phoneNumber, phoneSuffix, email, otp } = req.body;
        if(!otp){
            return res.status(400).json({message:"otp is required"});
        }

        let user = null;

        //verify email OTP 
        if(email){
             user = await prisma.user.findUnique({where:{email}});
            if(!user){
                return res.status(404).json({message:"User not found"})
            }
            const now = new Date();
            if(!user.otp || String(user.otp) !== String(otp) || !user.otpExpiry || now > user.otpExpiry){
                return res.status(400).json({message:"Invalid or expired OTP"});
            }

            await prisma.user.update({
                where:{email},
                data:{
                    isVerified: true,
                    otp: null,
                    otpExpiry: null
                }
            
            });


           
        }else{
            //verify phone Number otp

            if(!phoneNumber || !phoneSuffix){
                return res.status(400).json({mesaage:"Phone number and Country code is required"});
            }
            const fullPhoneNumber = `+${phoneSuffix}${phoneNumber}`;
            user = await prisma.user.findUnique({ where: { phoneNumber: fullPhoneNumber } });
            if(!user){
                return res.status(404).json({message:"User not Found"})
            }
            const result = await verifyPhoneNumberOtp(fullPhoneNumber, otp);
            if(result.status !== "approved"){
                return res.status(400).json({message:"Invalid OTP"});
            }
            await prisma.user.update({
                where: { phoneNumber: fullPhoneNumber },
                data: { isVerified: true, otp: null, otpExpiry: null }
            });

            
            
        } 

        const token = generateToken(user.id);
        res.cookie("auth_token",token,{
            httpOnly:true,
            maxAge:1000*60*24*365
        });
        return res.json({message:"OTP verification success", token:token})

        

    } catch (error) {
        console.error("Error verifying phone OTP:", error);
        return res.status(500).json({ message: "Internal server error from authControllers" });
        
    }
}

export const updateProfile = async (req: Request, res: Response) => {
    const { username, agreedToTerms, about } = req.body;
    const userId = (req as any).userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const data: any = {};
        if (username !== undefined) data.username = username;
        if (typeof agreedToTerms !== "undefined") data.agreedToTerms = agreedToTerms;
        if (about !== undefined) data.about = about;

        const file = req.file;
        if (file) {
            const uploadResult = await uploadFileToCloudinary(file);
            data.profilePic = uploadResult.secure_url;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data,
        });

        return res.status(200).json({ message: "Profile updated", user: updatedUser });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const viewProfile = async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });

    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                profilePic: true,
                about: true    
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "Profile fetched successfully", user });
        
    } catch (error) {
        console.error("Error viewing profile:", error);
        return res.status(500).json({ message: "Internal Server Error from viewProfile" });
        
    }
}

//this prevents the user from accessing protected routes if not authenticated/logged-in
export const checkAuthenticated = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized for authentication" });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User is authenticated", user });
    } catch (error) {
        console.error("Error checking authentication:", error);
        return res.status(500).json({ message: "Internal Server Error" });
        
    }
}


export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("auth_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
        return res.status(200).json({message:"Logged out successfully"});
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({message:"Internal Server Error"});
        
    }
}

export const getAllUsers = async (req: Request, res: Response) => {
    const loggedInUserId = (req as any).userId;
    try {
        //fetch all users except the logged-in user
        const users = await prisma.user.findMany({
            where:{ id: { not: loggedInUserId } },
            select: {
                id: true,
                username: true,
                profilePic: true,
                lastSeen: true,
                isOnline: true,
                about: true,
                phoneNumber: true,
                phoneSuffix: true
            }
                
        });

        //For each user, check if there is an existing conversation between that user and the logged-in user.

        const userWithConversation = await Promise.all(users.map(async (user)=>{
            const conversation = await prisma.conversations.findFirst({
                where:{
                    participants:{
                        some:{
                           userId:loggedInUserId
                        },
                    },
                    AND:{
                        participants:{
                            some:{
                                userId:user.id
                            },
                        }
                    }
                },
                include: {
                    lastMessage: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    profilePic: true,
                                },
                            },
                            receiver: {
                                select: {
                                    id: true,
                                    username: true,
                                    profilePic: true,
                                },
                            },
                        },
                    },
                },
            })
         }))
        res.json(userWithConversation)
        
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal Server Error at getUsers" });
    }
}


