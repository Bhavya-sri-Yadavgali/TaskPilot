const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const router = express.Router()
const User = require("../models/User")
const auth = require("../middleware/auth");

// Register user
router.post("/register", async (req, res) => {
  console.log("DEBUG: Handling /register request for email:", req.body.email);
  try {
    const {
      name,
      email,
      password,
      dailyAvailableHours,
      timeZone
    } = req.body;

    // 🔥 Validate all required fields
    if (
      !name ||
      !email ||
      !password ||
      dailyAvailableHours === undefined ||
      !timeZone
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // 🔍 Check existing user
    console.log("DEBUG: Checking if user exists...");
    const existingUser = await User.findOne({ email });
    console.log("DEBUG: User check complete. Found:", !!existingUser);

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }



    // ✅ Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      dailyAvailableHours,
      timeZone,
      isVerified: true
    });

    console.log("DEBUG: Saving new user to database...");
    await user.save();
    console.log("DEBUG: User saved successfully.");

    res.status(201).json({ message: "Registration successful. You can now log in." });
  } catch (err) {
    console.error("DEBUG: Registration Error:", err);
    res.status(500).json({ message: "Server error", err: err.message });
  }
});




router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }



    // ✅ IMPORTANT: include password explicitly
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res.status(400).json({ message: "User not found or missing password" });
    }

    // 🔐 Compare passwords safely
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 🔑 Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", err: error.message, stack: error.stack });
  }
});



// ✅ GET USER PROFILE
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("DEBUG: Profile Fetch Error:", err);
    res.status(500).json({ message: "Server error", err: err.message });
  }
});


module.exports = router