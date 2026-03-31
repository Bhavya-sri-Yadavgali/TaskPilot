const mongoose = require("mongoose")
const LEVELS = ["beginner", "intermediate", "advanced"];
const PRIORITY = ["low", "medium", "high"];


const skillSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  skill_name: String,
  target_level: {
  type: String,
  enum: LEVELS,
  default: "beginner"
},
  priority: {
  type: String,
  enum: PRIORITY,
  default: "medium"
},
  category: {
    type: String,
    default: "Programming"
  },
  weeklyTargetedHours: {
    type: Number,
    default: 5
  },
  totalMasteryHours: {
    type: Number,
    default: 100
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

})

module.exports = mongoose.model("Skill", skillSchema)