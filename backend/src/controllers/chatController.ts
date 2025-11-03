import type { Request, Response } from "express";
import prisma from "../config/db.js";
import { uploadFileToCloudinary } from "../config/cloudinary.js";

export type MessageRequestBody = {
    senderId: number;
    receiverId: number;
    content: string;
    messageStatus?: 'SENT' | 'DELIVERED' | 'READ';
}

//In TypeScript (and JavaScript), whenever you mark a function as async,
//that function automatically returns a Promise, no matter what’s inside it.
//The async keyword means:“This function might contain await calls, so I’ll wrap everything in a Promise.”

export const sendMessage = async (req:Request, res:Response):Promise<void> => {
    try {
        const {senderId,receiverId,content,messageStatus}:MessageRequestBody = req.body;
        const file = req.file;

        if(!senderId || !receiverId){
            res.status(400).json({message:"SenderId and ReceiverId are required"});
            return;
        }

        //check if conversation already exsists between these two users
        let conversation = await prisma.conversations.findFirst({
            where:{
                isGroup:false,
                participants:{
                    some:{userId:senderId},
                },
                AND:{
                    participants:{
                        some:{userId:receiverId}
                    }
                }
            },
            include:{
                participants:true,
            }
        })
        // create a new conversation if not exsists
        if(!conversation){
            conversation = await prisma.conversations.create({
                data:{
                    isGroup:false,
                    participants:{
                        create:[
                            {userId:senderId},
                            {userId:receiverId}
                        ],
                    },
                },
                include:{
                    participants:true,  
                }
            })
        }

    //upload media to cloudinary if file exsists
    let mediaUrl:string | null =  null;
    let contentType: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "LOCATION" = "TEXT";
    if(file){
        const uploadFile = await uploadFileToCloudinary(file);
        if(!uploadFile || !uploadFile.secure_url){
            res.status(500).json({message:"Failed to upload media"});
            return;
        }
        mediaUrl = uploadFile.secure_url;
        
        //determine content type based on mimetype
        if(file.mimetype.startsWith("image")){
            contentType = "IMAGE";
        }else if(file.mimetype.startsWith("video")){
            contentType = "VIDEO";
        }else if(file.mimetype.startsWith("audio")){
            contentType = "AUDIO";
        }else if(file.mimetype.startsWith("document")){
            contentType = "DOCUMENT";
        }else if(file.mimetype.startsWith("location")){
            contentType = "LOCATION";
        }else{
             res.status(400).json({message:"Unsupported media type"});
             return;
        }

    }else if(content?.trim()){
        contentType = "TEXT";
    }else{
        res.status(400).json({message:"Either content or media file is required"});
        return;
    }

    //create message
    const message = await prisma.messages.create({
        data:{
            conversation:{connect:{id:conversation.id}},
            sender:{connect:{id:senderId}},
            receiver:{connect:{id:receiverId}},
            content,
            contentType,
            mediaUrl,
            MessageStatus: messageStatus || "SENT",

        },
        include:{
            sender:{
                select:{
                    username:true,
                    profilePic:true,
                }
            },
            receiver:{
                select:{
                    username:true,
                    profilePic:true,
                }
            }
        }
    })

    //update conversation's last message
    await prisma.conversations.update({
        where:{id:conversation.id},
        data:{
            lastMessageId:message.id,
            participants:{
                updateMany:{
                    where:{userId:receiverId},
                    data:{unreadCount:{increment:1}},
            }
        }
    }
    })
    res.status(201).json({message:"Message sent successfully", data:message});
    return;
    
}catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ message: "Internal Server Error in sendMessage" });  
        
    }
}