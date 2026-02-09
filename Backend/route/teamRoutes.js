import express from "express";
import { createTeam, addTeamMember, removeTeamMember, viewTeamMembers, getMyTeams, inviteMember } from "../controller/TeamController.js";
import { authenticateToken } from "../middleware/Auth.js";

const router = express.Router();
console.log("[DEBUG] teamRoutes.js loaded");

router.use(authenticateToken); // Protect all team routes

router.post("/create", createTeam);
router.get("/", getMyTeams);
router.post("/:teamId/add-member", addTeamMember);
router.post("/:teamId/remove-member", removeTeamMember);
router.get("/:teamId/members", viewTeamMembers);
router.post("/:teamId/invite", inviteMember);

export default router;
