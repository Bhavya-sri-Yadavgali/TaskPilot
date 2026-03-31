const mongoose = require("mongoose")

const studyPlanSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  date: Date,
  tasks: {
  type: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    }
  ],
  validate: {
    validator: function (value) {
      return value.length > 0;
    },
    message: "At least one task is required"
  }
},
  totalPlannedTime: Number,

  generatedAt: {
    type: Date,
    default: Date.now
  }

})

module.exports = mongoose.model("StudyPlan", studyPlanSchema)