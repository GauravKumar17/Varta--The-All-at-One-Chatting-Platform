import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;
export async function initDB() {
    try {
        await prisma.$connect();
        console.log("Database connected");
    }
    catch (error) {
        console.log("Database connection error", error);
    }
}
//# sourceMappingURL=db.js.map