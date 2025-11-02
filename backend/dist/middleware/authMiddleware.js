import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
export const authMiddleware = (req, res, next) => {
    const token = req.cookies?.auth_token || req.headers?.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded?.userId) {
            return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
        }
        req.userId = decoded.userId;
        next();
    }
    catch {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};
//# sourceMappingURL=authMiddleware.js.map