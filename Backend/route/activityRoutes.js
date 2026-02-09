import express from "express";
import { getActivityLogs } from "../controller/ActivityController.js";
import { authenticateToken } from "../middleware/Auth.js";
import { apiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", authenticateToken, apiLimiter, getActivityLogs);

export default router;
