const express = require("express");
const router = express.Router();
const Todo = require("../models/Todo");
const auth = require("../middleware/auth");

// Add Task
router.post("/add", auth, async (req, res) => {
  try {
    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;

    const todo = new Todo({
      ...req.body,
      user_id: req.user.userId
    });
    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Tasks
router.get("/", auth, async (req, res) => {
  try {
    const todos = await Todo.find({ user_id: req.user.userId }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Task
router.put("/:id", auth, async (req, res) => {
  try {
    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;

    const updated = await Todo.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Todo not found or unauthorized" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Task
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Todo.findOneAndDelete({ _id: req.params.id, user_id: req.user.userId });
    if (!deleted) return res.status(404).json({ message: "Todo not found or unauthorized" });
    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
