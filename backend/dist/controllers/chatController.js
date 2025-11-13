import prisma from "../config/db.js";
import { uploadFileToCloudinary } from "../config/cloudinary.js";
//In TypeScript (and JavaScript), whenever you mark a function as async,
//that function automatically returns a Promise, no matter what’s inside it.
//The async keyword means:“This function might contain await calls, so I’ll wrap everything in a Promise.”
export const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;
        if (!senderId || !receiverId) {
            res.status(400).json({ message: "SenderId and ReceiverId are required" });
            return;
        }
        //check if conversation already exsists between these two users
        let conversation = await prisma.conversations.findFirst({
            where: {
                isGroup: false,
                participants: {
                    some: { userId: senderId },
                },
                AND: {
                    participants: {
                        some: { userId: receiverId }
                    }
                }
            },
            include: {
                participants: true,
            }
        });
        // create a new conversation if not exsists
        if (!conversation) {
            conversation = await prisma.conversations.create({
                data: {
                    isGroup: false,
                    participants: {
                        create: [
                            { userId: senderId },
                            { userId: receiverId }
                        ],
                    },
                },
                include: {
                    participants: true,
                }
            });
        }
        //upload media to cloudinary if file exsists
        let mediaUrl = null;
        let contentType = "TEXT";
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile || !uploadFile.secure_url) {
                res.status(500).json({ message: "Failed to upload media" });
                return;
            }
            mediaUrl = uploadFile.secure_url;
            //determine content type based on mimetype
            // The MIME type in Cloudinary is a metadata property that defines the content type 
            // (e.g., image/png, video/mp4) of your uploaded file.
            // Cloudinary uses it automatically to serve the correct file format and set the right Content-Type header for clients.
            if (file.mimetype.startsWith("image")) {
                contentType = "IMAGE";
            }
            else if (file.mimetype.startsWith("video")) {
                contentType = "VIDEO";
            }
            else if (file.mimetype.startsWith("audio")) {
                contentType = "AUDIO";
            }
            else if (file.mimetype.startsWith("document")) {
                contentType = "DOCUMENT";
            }
            else if (file.mimetype.startsWith("location")) {
                contentType = "LOCATION";
            }
            else {
                res.status(400).json({ message: "Unsupported media type" });
                return;
            }
        }
        else if (content?.trim()) {
            contentType = "TEXT";
        }
        else {
            res.status(400).json({ message: "Either content or media file is required" });
            return;
        }
        //create message
        const message = await prisma.messages.create({
            data: {
                conversation: { connect: { id: conversation.id } },
                sender: { connect: { id: senderId } },
                receiver: { connect: { id: receiverId } },
                content,
                contentType,
                mediaUrl,
                MessageStatus: messageStatus || "SENT",
            },
            include: {
                sender: {
                    select: {
                        username: true,
                        profilePic: true,
                    }
                },
                receiver: {
                    select: {
                        username: true,
                        profilePic: true,
                    }
                }
            }
        });
        //update conversation's last message
        await prisma.conversations.update({
            where: { id: conversation.id },
            data: {
                lastMessageId: message.id,
                participants: {
                    updateMany: {
                        where: { userId: receiverId },
                        data: { unreadCount: { increment: 1 } },
                    }
                }
            }
        });
        res.status(201).json({ message: "Message sent successfully", data: message });
        return;
    }
    catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({ message: "Internal Server Error in sendMessage" });
    }
};
export const getMessages = async (req, res) => {
    const conversationId = Number(req.params.conversationId);
    const userId = req.userId;
    try {
        //check if conversation exsists
        const conversation = await prisma.conversations.findUnique({
            where: { id: conversationId },
            include: { participants: true }
        });
        if (!conversation) {
            res.status(404).json({ message: "Conversation not found" });
            return;
        }
        //check if user is a participant of the conversation
        const isParticipant = conversation.participants.some(participant => participant.userId === Number(userId));
        if (!isParticipant) {
            res.status(403).json({ message: "Forbidden: You are not a participant of this conversation" });
            return;
        }
        //fetch messages
        const messages = await prisma.messages.findMany({
            where: { conversationId: conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true,
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true,
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        //update messge status for unread messages to 'READ'
        await prisma.messages.updateMany({
            where: {
                conversationId: conversationId,
                receiverId: Number(userId),
                MessageStatus: { in: ['SENT', 'DELIVERED'] }
            },
            data: { MessageStatus: 'READ' }
        });
        //reset unread count for the user in conversation -> participants->ConversationParticipants->unreadCount
        await prisma.conversations.update({
            where: { id: conversationId },
            data: {
                participants: {
                    updateMany: {
                        where: { userId: Number(userId) },
                        data: { unreadCount: 0 }
                    }
                }
            }
        });
        res.status(200).json({ message: "Messages fetched successfully", data: messages });
        return;
    }
    catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ message: "Internal Server Error in getMessages" });
    }
};
export const markAsRead = async (req, res) => {
    const { messageIds } = req.body.messageIds;
    const userId = req.userId;
    try {
        //get relevent mesage to determine senders
        //Find all messages whose id is in the messageIds list and whose receiver is the current user
        const allMessages = await prisma.messages.findMany({
            where: {
                id: { in: messageIds.map((id) => Number(id)) },
                receiverId: Number(userId)
            }
        });
        if (allMessages.length === 0) {
            res.status(404).json("No messages found for the user");
            return;
        }
        await prisma.messages.updateMany({
            where: {
                id: { in: messageIds.map((id) => Number(id)) },
                receiverId: Number(userId)
            },
            data: {
                MessageStatus: 'READ'
            }
        });
    }
    catch (error) {
        console.error("Error in markAsRead:", error);
        res.status(500).json({ message: "Internal Server Error in markAsRead" });
        return;
    }
};
/// deelete one or multiple messages
export const deleteMessages = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.userId;
    try {
        if (!messageIds || messageIds.length === 0) {
            res.status(400).json({ message: "messageIds are required" });
            return;
        }
        //check messages where sender is the user, to delete them
        const messages = await prisma.messages.findMany({
            where: {
                id: { in: messageIds.map((id) => Number(id)) },
                senderId: Number(userId)
            }
        });
        if (messages.length === 0) {
            res.status(404).json("No messages found for the user or not aauthorized to delete");
            return;
        }
        //delete messages
        await prisma.messages.deleteMany({
            where: {
                id: { in: messages.map((msg) => msg.id) },
                senderId: Number(userId)
            }
        });
        res.status(200).json({ message: "Messages deleted successfully" });
        return;
    }
    catch (error) {
        console.error("Error in deleteMessages:", error);
        res.status(500).json({ message: "Internal Server Error in deleteMessages" });
        return;
    }
};
//# sourceMappingURL=chatController.js.map