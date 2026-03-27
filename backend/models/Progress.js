const mongoose = require("mongoose")

const progressSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill"
  },

  completed_hours: Number,

  completed_task_count: Number,

  weeklyBreakDown: [
    {
      week: String,
      hours: Number
    }
  ],

  lastStudiedDate: Date,

  overRunFactor: Number

})

module.exports = mongoose.model("Progress", progressSchema)