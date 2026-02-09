import express from "express";
import {
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    commentOnTask,
    listTasks
} from "../controller/TaskController.js";
import { authenticateToken } from "../middleware/Auth.js";

const router = express.Router();

router.use(authenticateToken); // Protect all task routes

router.post("/teams/:teamId/tasks", createTask);
router.get("/teams/:teamId/tasks", listTasks);
router.put("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);
router.patch("/tasks/:taskId/move", moveTask);
router.patch("/tasks/:taskId/assign", assignTask);
router.post("/tasks/:taskId/comment", commentOnTask);

export default router;
