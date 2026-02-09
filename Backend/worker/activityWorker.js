import { Worker, Queue } from "bullmq";
import ActivityLog from "../model/activityLogSchema.js";
import dotenv from "dotenv";

dotenv.config();

const connection = {
    url: process.env.REDIS_URL
};

export const activityQueue = new Queue("activity-logs", { connection });

// Define the worker to process activity logs
const worker = new Worker("activity-logs", async (job) => {
    const { taskId, action, userId } = job.data;
    console.log(`Processing activity log: ${action} on task ${taskId}`);
    try {
        await ActivityLog.create({
            task: taskId,
            action,
            performedBy: userId,
            timestamp: new Date()
        });
    } catch (err) {
        console.error("Worker error logging activity:", err);
    }
}, { connection });

worker.on("completed", (job) => {
    console.log(`Log completed for job ${job.id}`);
});

worker.on("failed", (job, err) => {
    console.error(`Log failed for job ${job.id}: ${err.message}`);
});
