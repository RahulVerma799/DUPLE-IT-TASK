import express from "express";
import userRoutes from "./userRoutes.js";
import teamRoutes from "./teamRoutes.js";
import taskRoutes from "./taskRoutes.js";
import activityRoutes from "./activityRoutes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/teams", teamRoutes);
router.use("/activity", activityRoutes);
router.use("/", taskRoutes);

export default router;
