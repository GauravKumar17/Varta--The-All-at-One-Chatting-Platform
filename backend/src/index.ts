import express from "express";
import prisma,{initDB} from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import bodyParser from "body-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use("/api/auth",authRoutes)
app.use("/api/chat", chatRoutes)

const PORT = process.env.PORT || 5001;

initDB().then(() => {
    app.listen(PORT,()=>{
          console.log("listening on port "+PORT);
      })
}).catch((err) => {
    console.log("Error starting server",err);
})
