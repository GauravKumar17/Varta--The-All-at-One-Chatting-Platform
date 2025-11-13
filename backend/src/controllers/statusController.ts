import type {Request, Response} from 'express';
import prisma from '../config/db.js';
import { uploadFileToCloudinary } from "../config/cloudinary.js";

 interface StatusRequestBody{
    content: string;
    contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION';
}

export const createStatus = async(req:Request, res:Response):Promise<void> =>{
    const {content ,contentType}:StatusRequestBody = req.body;
    const userId = (req as any).userId;
    const file = req.file;

    let finalContentType=  contentType;

    if(!content || !contentType){
        res.status(4000).json({message:"content and content type are required"})
    }

    try {
        let mediaUrl:string | null = null;
        if(file){
            const uploadFile = await uploadFileToCloudinary(file);
            if(!uploadFile || !uploadFile.secure_url){
                res.status(500).json({messsage:"Failed to upload file to cloudinary"})
                return;
            }
            mediaUrl = uploadFile.secure_url;

            //determine content type based on mimetype
            // The MIME type in Cloudinary is a metadata property that defines the content type 
            // (e.g., image/png, video/mp4) of your uploaded file.
            // Cloudinary uses it automatically to serve the correct file format and set the right Content-Type header for clients.
            if(file.mimetype.startsWith("image")){
                finalContentType = "IMAGE";
            }else if(file.mimetype.startsWith("video")){
                finalContentType = "VIDEO";
            }else if(file.mimetype.startsWith("audio")){
                finalContentType = "AUDIO";
            }else if(file.mimetype.startsWith("document")){
                finalContentType = "DOCUMENT";
            }else if(file.mimetype.startsWith("location")){
                finalContentType = "LOCATION";
            }else{
                 res.status(400).json({message:"Unsupported media type"});
                 return;
            }
        }else if(content?.trim()){
            finalContentType = "TEXT";
        }else{
            res.json({message:"Either content or media file is required"});
            return;
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); //status expires in 24 hours

        const newStatus = await prisma.userStatus.create({
            data:{
                userId:userId,
                content:content,
                contentType:finalContentType,
                mediaUrl:mediaUrl,
                expiresAt:expiresAt,
            },
            include:{
                user:{select:{id:true, username:true, profilePic:true}}
            }
        })

        res.json({message:"Status created successfully", status:newStatus});
        return;      
    } catch (error) {
        console.log("Error creating status", error);
        res.status(500).json({message:"Internal server error from createStatus"});
        return;
        
    }
}


export const getStatuses = async(req:Request, res:Response):Promise<void> =>{
    const userId = (req as any).userId;
    try {
        const stasuses = await prisma.userStatus.findMany({
            where:{
                expiresAt:{
                    gt:new Date()
                }
            },
            include:{
                user:{
                    select:{
                        id:true,
                        username:true,
                        profilePic:true,
                    }
                },
                views:{
                    include:{
                        viewer:{
                            select:{
                                id:true,
                                username:true,
                                profilePic:true,
                            }
                        }

                    }

                }
            }
        })
        res.json({message:"Statuses fetched successfully", statuses:stasuses});
        return;
        
    } catch (error) {
        console.log("Error fetching statuses", error);
        res.status(500).json({message:"Internal server error from getStatuses"});
        return;
        
    }
}

export const viewStatus = async(req:Request, res:Response):Promise<void> =>{
    const viewerId = (req as any).userId;
    const {statusId} = req.params;

    try {
        //check if status exists
        const status = await prisma.userStatus.findUnique({
            where:{id:Number(statusId),
                expiresAt:{gt: new Date()}},
            include:{
                user:{select:{id:true, username:true, profilePic:true}}
            }
        
        })
        if(!status){
            res.status(404).json({message:"Status not found or Expired"});
            return;
        }
        //check if viewer has already viewed the status, if not hen create a view record
        const updateView = await prisma.userStatusView.upsert({
            where:{
                statusId_viewerId:{
                    statusId:status.id,
                    viewerId:viewerId
                },

            },
            update:{}, //no action if already viewed
            create:{
                statusId:Number(statusId),
                viewerId:Number(viewerId),
            }

        })
        res.json({message:"Status viewed successfully", status:status, view:updateView});
        return;

        
    } catch (error) {
        console.log("Error viewing status", error);
        res.status(500).json({message:"Internal server error from viewStatus"});
        return;
        
    }
}

// When user want to see who vieewed their status
export const getStatusViewers = async(req:Request,res:Response):Promise<void> =>{
    const userId = (req as any).userId;
    const {statusId} = req.params;
    try {
        // check
        const status = await prisma.userStatus.findUnique({
            where:{id:Number(statusId)},
            select:{userId:true}

        })
        if(!status){
            res.status(404).json({message:"Status not found"});
            return;
        }
        if(status.userId !== Number(userId)){
            res.status(403).json({message:"Unauthorized to view viewers of this status"});
            return;
        }
        const viewers = await prisma.userStatusView.findMany({
            where:{statusId:Number(statusId)},
            include:{
                viewer:{
                    select:{
                        id:true,
                        username:true,
                        profilePic:true,
                    }
                }
            }
        })

        res.json({message:"Viewers fetched successfully", viewers:viewers})
        return;
    } catch (error) {
        console.log("Error fetching status viewers", error);
        res.status(500).json({message:"Internal server error from getStatusViewers"});
        return;
        
    }

}

export const deleteStatus = async(req:Request, res:Response):Promise<void> =>{
    const userId = (req as any).userId;
    const {statusId} = req.params;

    try {
        const status = await prisma.userStatus.findUnique({
            where:{id:Number(statusId)}
        })
        if(!status){
            res.status(404).json({message:"Status not found"});
            return;
        }
        if(status.userId !== Number(userId)){
            res.status(403).json({message:"Unauthorized to delete this status"});
            return;
        }

        await prisma.userStatus.delete({
            where:{id:Number(statusId)}   
        })
        res.json({message:"Status deleted successfully"});
        return;
        
    } catch (error) {
        console.log("Error deleting status", error);
        res.status(500).json({message:"Internal server error from deleteStatus"});
        return;
        
    }
}