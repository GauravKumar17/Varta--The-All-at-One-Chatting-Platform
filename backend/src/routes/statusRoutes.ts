import express from "express";
import { createStatus,getStatuses,viewStatus, deleteStatus, getStatusViewers} from "../controllers/statusController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinary.js";
const router = express.Router();

router.post('/createStatus',authMiddleware,multerMiddleware,createStatus);
router.get('/getStatuses',authMiddleware,getStatuses);
router.post('/viewStatus/:statusId',authMiddleware,viewStatus);
router.delete('/deleteStatus/:statusId',authMiddleware,deleteStatus);
router.get('/getStatusViewers/:statusId',authMiddleware,getStatusViewers);



export default router;
