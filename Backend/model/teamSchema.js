import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  addedAt: { type: Date, default: Date.now },
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [memberSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Team", teamSchema);
