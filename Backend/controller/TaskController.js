import Task from "../model/taskSchema.js";
import Team from "../model/teamSchema.js";
import User from "../model/userSchema.js";
import redis from "../config/RedisDb.js";
import { activityQueue } from "../worker/activityWorker.js";

// Helper to clear task cache for a team
const clearTaskCache = async (teamId) => {
  try {
    const keys = await redis.keys(`tasks:${teamId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("Cache clear error:", err);
  }
};

// Create a task
export const createTask = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { title, description, assignedTo } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Title is required" });
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    if (!team.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(403).json({ success: false, message: "Not a team member" });
    const task = await Task.create({ team: teamId, title, description, assignedTo });

    // Background logging using BullMQ
    activityQueue.add("log", { taskId: task._id, action: "Created", userId: req.user._id });

    await clearTaskCache(teamId);
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    const team = await Team.findById(task.team);
    if (!team.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(403).json({ success: false, message: "Not a team member" });
    if (title) task.title = title;
    if (description) task.description = description;
    if (status && ["TODO", "DOING", "DONE"].includes(status)) task.status = status;
    task.updatedAt = new Date();
    await task.save();

    activityQueue.add("log", { taskId: task._id, action: "Updated", userId: req.user._id });

    await clearTaskCache(task.team);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    const team = await Team.findById(task.team);
    if (!team.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(403).json({ success: false, message: "Not a team member" });
    await Task.findByIdAndDelete(taskId);

    activityQueue.add("log", { taskId: taskId, action: "Deleted", userId: req.user._id });

    await clearTaskCache(task.team);
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Move a task between columns
export const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    if (!["TODO", "DOING", "DONE"].includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    const team = await Team.findById(task.team);
    if (!team.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(403).json({ success: false, message: "Not a team member" });
    task.status = status;
    task.updatedAt = new Date();
    await task.save();

    activityQueue.add("log", { taskId: taskId, action: `Moved to ${status}`, userId: req.user._id });

    await clearTaskCache(task.team);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Assign a task to a member
export const assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    const team = await Team.findById(task.team);
    if (!team.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(403).json({ success: false, message: "Not a team member" });
    if (!team.members.some(m => m.user.toString() === userId)) return res.status(400).json({ success: false, message: "User not in team" });
    task.assignedTo = userId;
    task.updatedAt = new Date();
    await task.save();

    activityQueue.add("log", { taskId: taskId, action: "Assigned", userId: req.user._id });

    await clearTaskCache(task.team);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Comment on a task
export const commentOnTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Comment text required" });
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    const team = await Team.findById(task.team);
    if (!team.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(403).json({ success: false, message: "Not a team member" });
    task.comments.push({ text, createdBy: req.user._id });
    task.updatedAt = new Date();
    await task.save();

    activityQueue.add("log", { taskId: taskId, action: "Commented", userId: req.user._id });

    await clearTaskCache(task.team);
    res.json({ success: true, comments: task.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// List tasks with pagination, search, filter, sort
export const listTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { page = 1, limit = 10, search = "", assignedTo, sort = "desc" } = req.query;

    const cacheKey = `tasks:${teamId}:${page}:${limit}:${search}:${assignedTo || 'all'}:${sort}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    if (!team.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(403).json({ success: false, message: "Not a team member" });

    const query = { team: teamId };
    if (search) query.title = { $regex: search, $options: "i" };
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate("assignedTo", "_id name email")
      .populate("comments.createdBy", "_id name")
      .sort({ createdAt: sort === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Task.countDocuments(query);
    const responseData = { success: true, tasks, total, page: Number(page), limit: Number(limit) };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(responseData));

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
