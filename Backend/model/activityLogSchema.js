import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  action: { type: String, required: true }, // Created, Updated, Moved, Assigned
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("ActivityLog", activityLogSchema);
