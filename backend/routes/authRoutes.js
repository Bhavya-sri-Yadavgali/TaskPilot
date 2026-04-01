const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const router = express.Router()
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");


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



    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user (system fields handled automatically)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      dailyAvailableHours,
      timeZone,
      verificationToken,
      verificationExpires,
      isVerified: true
    });

    console.log("DEBUG: Saving new user to database...");
    await user.save();
    console.log("DEBUG: User saved successfully.");


    const verificationUrl = `${process.env.APP_URL}/verify/${verificationToken}`;
    const message = `
      <h1>Account Verification</h1>
      <p>Thank you for registering. Please click the link below to verify your email:</p>
      <a href="${verificationUrl}" target="_blank">${verificationUrl}</a>
      <p>This link will expire in 10 minutes.</p>
    `;

    try {
      console.log("DEBUG: Attempting to send verification email to:", user.email);
      await sendEmail({
        email: user.email,
        subject: "LearnMate - Verify Your Email",
        message,
      });
      console.log("DEBUG: Email sent successfully.");
      res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });
    } catch (err) {
      console.error("DEBUG: Email failed to send:", err);
      // If email fails, we still created the user, but they'll need a "resend" button later
      res.status(201).json({ message: "User registered, but verification email failed to send." });
    }
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

//     if (!user.isVerified) {
//   return res.status(403).json({ message: "Please verify your email before logging in." });
// }

    if (!user || !user.password) {
      return res.status(400).json({ message: "User not found or missing password" });
    }


    if (!user.isVerified) {
  return res.status(403).json({ message: "Please verify your email before logging in." });
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



router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("DEBUG: Verification Error:", err);
    res.status(500).json({ message: "Server error", err: err.message });
  }
});

// ✅ GET USER PROFILE
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -verificationToken -verificationExpires");
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