import Team from "../model/teamSchema.js";
import User from "../model/userSchema.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Create a new team (creator is first member)
export const createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Team name is required" });

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const team = await Team.create({
      name,
      creator: userId,
      members: [{
        user: userId,
        addedBy: userId,
        addedAt: new Date()
      }]
    });
    console.log(`[DEBUG] Team created: ${team._id} by user: ${userId}`);
    res.status(201).json({ success: true, team });
  } catch (err) {
    console.error("[DEBUG] Create team error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add a member (only creator)
export const addTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });

    const currentUserId = new mongoose.Types.ObjectId(req.user._id);
    if (!team.creator.equals(currentUserId)) {
      return res.status(403).json({ success: false, message: "Only creator can add members" });
    }

    const targetUserId = new mongoose.Types.ObjectId(userId);
    if (team.members.some(m => m.user.toString() === targetUserId.toString())) {
      return res.status(400).json({ success: false, message: "User already a member" });
    }

    team.members.push({
      user: targetUserId,
      addedBy: currentUserId,
      addedAt: new Date()
    });
    await team.save();
    console.log(`[DEBUG] Added member ${targetUserId} to team ${teamId}`);
    res.json({ success: true, team });
  } catch (err) {
    console.error("[DEBUG] Add member error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Remove a member (only creator)
export const removeTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });

    const currentUserId = new mongoose.Types.ObjectId(req.user._id);
    if (!team.creator.equals(currentUserId)) {
      return res.status(403).json({ success: false, message: "Only creator can remove members" });
    }

    const targetUserId = new mongoose.Types.ObjectId(userId);
    team.members = team.members.filter(m => m.user.toString() !== targetUserId.toString());
    await team.save();
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// View all team members (only team members)
export const viewTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const team = await Team.findById(teamId).populate("members.user", "_id name email");
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });

    const isMember = team.members.some(m => m.user._id.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Only team members can view" });
    }
    res.json({ success: true, members: team.members });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get teams for the logged-in user
export const getMyTeams = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const rawId = req.user._id;
    const userId = new mongoose.Types.ObjectId(rawId);

    const teams = await Team.find({
      $or: [
        { creator: userId },
        { creator: rawId },
        { "members.user": userId },
        { "members.user": rawId }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Invite a member (find or create user, then add to team)
export const inviteMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, email } = req.body;

    if (!name || !email) return res.status(400).json({ success: false, message: "Name and email are required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });

    const currentUserIdStr = req.user._id.toString();
    const creatorIdStr = team.creator.toString();

    console.log(`[DEBUG] Attempting invite to team: ${teamId}`);
    console.log(`[DEBUG] Logged-in User ID: ${currentUserIdStr}`);
    console.log(`[DEBUG] Team Creator ID: ${creatorIdStr}`);

    if (creatorIdStr !== currentUserIdStr) {
      console.error(`[DEBUG] Invitation Denied: User ${currentUserIdStr} is not the creator ${creatorIdStr}`);
      return res.status(403).json({ success: false, message: "Only creator can invite members" });
    }

    // 1. Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      user = await User.create({ name, email, password: hashedPassword });
      console.log(`[DEBUG] New user created via invitation: ${user._id} (${email})`);
    } else {
      console.log(`[DEBUG] Existing user found for invitation: ${user._id} (${email})`);
    }

    // 2. Check if already a member
    const isAlreadyMember = team.members.some(m => m.user.toString() === user._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({ success: false, message: "User already a member of this team" });
    }

    // 3. Add to team
    team.members.push({
      user: user._id,
      addedBy: req.user._id,
      addedAt: new Date()
    });
    await team.save();

    console.log(`[DEBUG] Member ${user._id} successfully added to team ${teamId}`);
    res.json({ success: true, message: "Member added successfully", user, team });
  } catch (err) {
    console.error("[DEBUG] Invite member error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
