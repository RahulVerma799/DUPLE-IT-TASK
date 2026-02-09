import User from "../model/userSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ✅ REGISTER
export const registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // check user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.log("Error in registering user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ✅ LOGIN
export const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // ✅ generate token
    const token = jwt.sign(
      { _id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ send token in header as X-USER-TOKEN
    res.setHeader("X-USER-TOKEN", token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token, // body me bhi bhej diya (easy for frontend)
      user: {
        _id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
      },
    });
  } catch (error) {
    console.log("Error in logging in user", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ✅ SEARCH USER BY EMAIL
export const searchUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    const user = await User.findOne({ email }).select("_id name email");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ✅ CREATE MEMBER (Quick Register)
export const createMember = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: "Name and Email are required" });

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        user: { _id: user._id, name: user.name, email: user.email }
      });
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash("123456", 10);

    user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    console.log(`[DEBUG] Member (User) created: ${user._id} (${user.email})`);
    res.status(201).json({
      success: true,
      message: "Member created successfully",
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("[DEBUG] Create member error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
