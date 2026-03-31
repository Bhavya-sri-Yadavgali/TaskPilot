// const mongoose = require("mongoose")

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },

//   password: {
//     type: String,
//     required: true
//   },

//   dailyAvailableHours: {
//     type: Number,
//     default: 2
//   },

//  timeZone: {
//   type: String,
//   enum: ["UTC", "IST", "EST", "PST"],
//   default: "IST"
// },

//   streakCount: {
//     type: Number,
//     default: 0
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now
//   }

// })

// module.exports = mongoose.model("User", userSchema)





const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  dailyAvailableHours: {
    type: Number,
    required: true,
    min: 1
  },

  timeZone: {
    type: String,
    enum: ["UTC", "IST", "EST", "PST"],
    required: true
  },

  // system controlled
  streakCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date

}, { timestamps: true }) // handles createdAt automatically

module.exports = mongoose.model("User", userSchema)