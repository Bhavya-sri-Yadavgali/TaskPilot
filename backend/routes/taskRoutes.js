const express = require("express")
const router = express.Router()

const Task = require("../models/Task")
const auth = require("../middleware/auth")

// Create Task
router.post("/add", auth, async (req, res) => {
  try {
    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;
    
    const task = new Task({
      ...req.body,
      user_id: req.user.userId
    })
    await task.save()
    res.json({
      message: "Task created successfully",
      task
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all tasks
router.get("/", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user_id: req.user.userId })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, user_id: req.user.userId });
    if (!deleted) return res.status(404).json({ message: "Task not found or unauthorized" });
    res.json({ msg: "Deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

// UPDATE STATUS
router.put("/:id", auth, async (req, res) => {
  try {
    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;

    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      req.body,
      { new: true }
    )
    if (!updated) return res.status(404).json({ message: "Task not found or unauthorized" });
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})






module.exports = router