import express from "express";
import authControllers from "../controllers/authControllers.js";
const router = express.Router();

router.post('/sendOtp',authControllers.sendOtp);
router.post('/verifyOtp', authControllers.verifyOtp)

export default router;


