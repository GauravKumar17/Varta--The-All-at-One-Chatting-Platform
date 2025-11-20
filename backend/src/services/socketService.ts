import {Server, Socket} from 'socket.io';
import http from "http";
import prisma from '../config/db.js';
import { is } from 'zod/locales';
import { MessageStatus } from '@prisma/client';

interface userSocketMap {
    [userId: string]:string;  // this line says that socket mao should have its key as string and value as string
}

const usersocketMap:userSocketMap = {}; // creates an object which stores key:value

// function to initialize socket connection
export const initSocket = (server:http.Server)=>{
    const io = new Server(server,{
        cors:{
            origin: "*",
            methods: ["GET","POST","PUT","DELETE","OPTIONS"]
        },
        pingTimeout:60000, // time after which connection is closed if no pong is received from client
    })

    //this event is fired when a client connects to the server
    io.on("connection",(socket:Socket)=>{
        console.log("Socket connected:",socket.id);

        socket.on("user_connected",async(userId:string)=>{
            try{
                usersocketMap[userId] = socket.id; // mapping userId to socket id
                socket.join(userId); // joining a room with the name of userId
                console.log(`User ${userId} is online`)

                await prisma.user.update({
                    where: { id: Number(userId) },
                    data: {
                        isOnline: true,
                        lastSeen: new Date(),
                    },
                });
                io.emit("user_status",{userId, isOnline:true}); // broadcasting to all clients that user is online

            }catch(err){
                console.error("Error in user_connected event:",err);
            }
            // send all online users to every connected client
            io.emit("online-users",Object.keys(usersocketMap)); // emitting list of online users to all connected clients
        })


        // Return online status of requested users
        socket.on("get_user_status",(requestedUserId:string, callback)=>{
            const isOnline = !!usersocketMap[requestedUserId]; // !! converts any value to true/false

        
            //returns to client when client on the order side does socket.emit("get_user_status",userId,(data)=>{})
            callback({ 
                userId:requestedUserId,
                isOnline:isOnline,
                lastSeen:isOnline? new Date():null
            })

        })

        //send message
        socket.on("send_message",async({senderId,receiverId,message})=>{
            try {
                const receiverSocketId = usersocketMap[receiverId];
                if(receiverSocketId){
                    
                    io.to(receiverSocketId).emit("receive-message",{
                        senderId,
                        message
                    })
                }
                
            } catch (error) {
                console.error("error sending message from send_message");
                socket.emit("message_error",{error:"Failed to send message"})
                
            }
        })

        // update message as read and notify the sender in realtime
        socket.on("message_read",async({messageIds,senderId})=>{
            try {

                await prisma.messages.updateMany({
                    where:{
                        id:{in:messageIds.map((id:string)=>Number(id))},
                    },
                    data:{
                        MessageStatus:"READ"
                    }
                });

                const senderSocketId = usersocketMap[senderId];

                // send real-time "message_status_update",for every message
                if(senderSocketId){
                    messageIds.forEach((messageId: string) => {
                        io.to(senderSocketId).emit("message_status_update",{
                            messageId: Number(messageId),
                            MessageStatus: "Read"
                            
                        })
                        
                    });
                }

                
                
            } catch (error) {
                console.log("Error updating messages read status",error)
                
            }
        })

        //typing status
        
        socket.on("typing", ({ senderId, receiverId}) => {
        const receiverSocket = usersocketMap[receiverId];
        // Send "typing" event only to that receiver
        if(receiverSocket){
            io.to(receiverSocket).emit("typing", senderId);
        }
    });


    })




}

