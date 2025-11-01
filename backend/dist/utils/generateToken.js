import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import { number, string } from "zod";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in your .env file");
}
export const generateToken = (userId) => {
    const token = JWT.sign({ userId
    }, JWT_SECRET, {
        expiresIn: '1y'
    });
    return token;
};
//# sourceMappingURL=generateToken.js.map