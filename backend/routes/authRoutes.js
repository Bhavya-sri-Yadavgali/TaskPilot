const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const router = express.Router()

const User = require("../models/User")

// Register user
router.post("/register", async (req, res) => {
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
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user (system fields handled automatically)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      dailyAvailableHours,
      timeZone
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error", err: err.message, stack: err.stack
    });
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




module.exports = router