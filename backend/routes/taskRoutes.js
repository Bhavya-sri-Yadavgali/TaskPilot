const express = require("express")
const router = express.Router()

const Task = require("../models/Task")
const Progress = require("../models/Progress")
const auth = require("../middleware/auth")

// Helper: Map Date to Day Name ("Mon", "Tue", etc.)
const getDayName = (dateInput) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(dateInput);
  return days[d.getUTCDay()];
};

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
    const tasks = await Task.find({ user_id: req.user.userId }).populate("skill_id")
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user_id: req.user.userId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // 🔥 If removing a completed task that had a skill, deduct progress
    if (task.status === "completed" && task.skill_id) {
      const hours = (task.actual_duration || task.planned_duration || 0) / 60;
      const dayName = getDayName(task.date);

      // We don't need to create it if it's missing for a delete, 
      // but findOneAndUpdate with arrayFilters will just do nothing if not found.
      await Progress.findOneAndUpdate(
        { user_id: req.user.userId, skill_id: task.skill_id },
        { 
          $inc: { 
            completed_hours: -hours, 
            completed_task_count: -1,
            "weeklyBreakDown.$[elem].hours": -hours
          } 
        },
        { 
          arrayFilters: [{ "elem.week": dayName }],
          new: true 
        }
      );
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" })
  } catch (err) {
    console.error("Delete task sync error:", err);
    res.status(500).json({ error: err.message });
  }
})

// UPDATE STATUS
router.put("/:id", auth, async (req, res) => {
  try {
    delete req.body.user_id;

    // 1. Get the current task state
    const oldTask = await Task.findOne({ _id: req.params.id, user_id: req.user.userId });
    if (!oldTask) return res.status(404).json({ message: "Task not found" });

    const isNewCompletion = oldTask.status !== "completed" && req.body.status === "completed";

    // 2. Perform the update
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      req.body,
      { new: true }
    );

    // 3. 🔥 Sync with Progress if it's a NEW completion
    if (isNewCompletion && updated.skill_id) {
      const hours = (updated.actual_duration || updated.planned_duration || 0) / 60;
      const dayName = getDayName(updated.date);

      // Ensure a progress record exists (for skills created before sync was added)
      let progress = await Progress.findOne({ user_id: req.user.userId, skill_id: updated.skill_id });
      
      if (!progress) {
        progress = new Progress({
          user_id: req.user.userId,
          skill_id: updated.skill_id,
          completed_hours: 0,
          completed_task_count: 0,
          weeklyBreakDown: [
            { week: "Mon", hours: 0 },
            { week: "Tue", hours: 0 },
            { week: "Wed", hours: 0 },
            { week: "Thu", hours: 0 },
            { week: "Fri", hours: 0 },
            { week: "Sat", hours: 0 },
            { week: "Sun", hours: 0 }
          ]
        });
        await progress.save();
      }

      // We use $inc to update the summary and the specific day in weeklyBreakDown
      await Progress.findOneAndUpdate(
        { user_id: req.user.userId, skill_id: updated.skill_id },
        { 
          $inc: { 
            completed_hours: hours, 
            completed_task_count: 1,
            "weeklyBreakDown.$[elem].hours": hours
          },
          $set: { lastStudiedDate: new Date() }
        },
        { 
          arrayFilters: [{ "elem.week": dayName }],
          new: true 
        }
      );
    }

    res.json(updated)
  } catch (err) {
    console.error("Task update sync error:", err);
    res.status(500).json({ error: err.message });
  }
})

module.exports = router