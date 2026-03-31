const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema({

  title: String,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: false
  },

  planned_duration: Number,
  actual_duration: Number,

  date: {
    type: Date,
    default: Date.now
  },
  
  start_time: {
    type: String,
    default: "09:00"
  },
  
  end_time: {
    type: String,
    default: "10:00"
  },

  status: {
  type: String,
  enum: ["pending", "in-progress", "completed"],
  default: "pending"
},

  difficulty: {
  type: String,
  enum: ["easy", "medium", "hard"],
  default: "easy"
},

  completed_at: Date

})

module.exports = mongoose.model("Task", taskSchema)