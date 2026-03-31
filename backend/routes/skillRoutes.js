const express = require("express")
const router = express.Router()

const Skill = require("../models/Skill")
const Progress = require("../models/Progress")
const auth = require("../middleware/auth")

router.post("/add", auth, async (req, res) => {
  try {
    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;

    const skill = new Skill({
      ...req.body,
      user_id: req.user.userId
    })
    await skill.save()

    // 🔥 Initialize empty Progress record for this skill
    const initialProgress = new Progress({
      user_id: req.user.userId,
      skill_id: skill._id,
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
    await initialProgress.save();

    res.json({ message: "Skill added", skill, progress: initialProgress })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get("/", auth, async (req, res) => {
  try {
    const skills = await Skill.find({ user_id: req.user.userId })
    res.json(skills)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put("/:id", auth, async (req, res) => {
  try {
    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;

    const updated = await Skill.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Skill not found or unauthorized" });
    res.json(updated);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const skillId = req.params.id;
    const userId = req.user.userId;

    // 1. Delete the Skill document
    const deletedSkill = await Skill.findOneAndDelete({ _id: skillId, user_id: userId });
    if (!deletedSkill) return res.status(404).json({ message: "Skill not found or unauthorized" });

    // 2. Delete the associated Progress document
    await Progress.findOneAndDelete({ skill_id: skillId, user_id: userId });

    // 3. Nullify skill_id in any Tasks associated with this skill (don't delete tasks)
    const Task = require("../models/Task");
    await Task.updateMany({ skill_id: skillId, user_id: userId }, { $set: { skill_id: null } });

    res.json({ message: "Skill and associated progress deleted" });
  } catch(err) {
    console.error("Skill deletion sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router