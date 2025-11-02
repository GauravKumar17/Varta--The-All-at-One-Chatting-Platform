import express from "express";
import { updateProfile, sendOtp, verifyOtp, logout, checkAuthenticated } from "../controllers/authControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinary.js";
const router = express.Router();
router.post('/sendOtp', sendOtp);
router.post('/verifyOtp', verifyOtp);
router.put('/updateProfile', authMiddleware, multerMiddleware, updateProfile);
router.get('/logout', logout);
router.get('/checkAuth', authMiddleware, checkAuthenticated);
export default router;
//# sourceMappingURL=authRoute.js.map