import express from "express";
import { registerUser, LoginUser, searchUserByEmail, createMember } from "../controller/UserController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", LoginUser);
router.get("/search", searchUserByEmail);
router.post("/create-member", createMember);

export default router;
