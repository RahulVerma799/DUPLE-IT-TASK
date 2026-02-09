import ActivityLog from "../model/activityLogSchema.js";

// Get all activity logs (protected)
export const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .populate("task", "title")
            .populate("performedBy", "name email")
            .sort({ timestamp: -1 })
            .limit(100);

        res.json({ success: true, logs });
    } catch (err) {
        console.error("Error fetching activity logs:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
