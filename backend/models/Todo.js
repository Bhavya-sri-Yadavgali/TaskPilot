const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notes: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Done", "Archived"],
    default: "To Do"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

module.exports = mongoose.model("Todo", todoSchema);
