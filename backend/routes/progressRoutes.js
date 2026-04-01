// routes/progressRoutes.js
const express = require("express");
const router = express.Router();

const Progress = require("../models/Progress");
const Task = require("../models/Task");
const auth = require("../middleware/auth");


// ✅ CREATE PROGRESS (POST)
router.post("/",auth, async (req, res) => {
  try {
    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;

    const progress = new Progress({
      ...req.body,
      user_id: req.user.userId // 🔥 link to user
    });

    await progress.save();

    res.json({
      message: "Progress saved",
      progress
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ GET ANALYTICS
router.get("/", auth,async (req, res) => {
  try {
    const userId = req.user.userId;
    const completedTasks = await Task.find({ user_id: userId, status: "completed" });

    // 🔹 Real-time Focus Factor (overRunFactor)
    let overRunFactor = 1.0;
    if (completedTasks.length > 0) {
      let totalPlanned = 0;
      let totalActual = 0;

      completedTasks.forEach(t => {
        totalPlanned += (t.planned_duration || 0);
        totalActual += (t.actual_duration || t.planned_duration || 0);
      });

      if (totalActual > 0) {
        overRunFactor = totalPlanned / totalActual;
      }
    }

    let progressData = await Progress.find({ user_id: userId })
      .populate("skill_id");

    // 🔥 Aggressive Filter: Filter out records where the skill was deleted or is missing details
    progressData = progressData.filter(p => p.skill_id && p.skill_id.skill_name);

    if (!progressData.length) {
      return res.json({
        totalStudyTime: 0,
        totalTasks: 0,
        mostPracticed: "None",
        dailyAverage: 0,
        overRunFactor, // 🔥 Added Focus Factor even if no skills
        weeklyData: [],
        skills: []
      });
    }

    // 🔹 Total Study Time
    const totalStudyTime = progressData.reduce(
      (sum, p) => sum + (p.completed_hours || 0),
      0
    );

    // 🔹 Total Tasks
    const totalTasks = progressData.reduce(
      (sum, p) => sum + (p.completed_task_count || 0),
      0
    );

    // 🔹 Weekly Data Merge
    const weeklyMap = {};

    progressData.forEach(p => {
      p.weeklyBreakDown.forEach(w => {
        if (!weeklyMap[w.week]) {
          weeklyMap[w.week] = 0;
        }
        weeklyMap[w.week] += w.hours;
      });
    });

    const weekOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const weeklyData = Object.keys(weeklyMap)
      .map(week => ({
        week,
        hours: weeklyMap[week]
      }))
      .sort((a, b) => weekOrder.indexOf(a.week) - weekOrder.indexOf(b.week));

    // 🔹 Skills Data (ENHANCED)
    const skills = progressData.map(p => {
      const weeklyHours = p.weeklyBreakDown.reduce((sum, w) => sum + (w.hours || 0), 0);
      const totalMastery = p.skill_id?.totalMasteryHours || 100;
      const weeklyTarget = p.skill_id?.weeklyTargetedHours || 5;

      return {
        id: p.skill_id?._id,
        name: p.skill_id?.skill_name || "Unknown",
        category: p.skill_id?.category || "Other",
        colorTheme: p.skill_id?.colorTheme || "blue",
        priority: p.skill_id?.priority || "medium",
        createdAt: p.skill_id?.createdAt,
        hoursSpent: p.completed_hours,
        weeklyHours: weeklyHours,
        totalMasteryHours: totalMastery,
        weeklyTargetedHours: weeklyTarget,
        // Existing "progress" for backward compatibility (mapped to mastery now)
        progress: Math.min(Math.round((p.completed_hours / totalMastery) * 100), 100),
        masteryProgress: Math.min(Math.round((p.completed_hours / totalMastery) * 100), 100),
        weeklyProgress: Math.min(Math.round((weeklyHours / weeklyTarget) * 100), 100)
      };
    });

    // 🔹 Most Practiced
    const mostPracticedObj = progressData.reduce((max, curr) =>
      (curr.completed_hours > (max?.completed_hours || 0) ? curr : max),
      null
    );

    const mostPracticed =
      mostPracticedObj?.skill_id?.skill_name || "None";

    // 🔹 Daily Average
    const dailyAverage = (totalStudyTime / 7).toFixed(1);

    res.json({
      totalStudyTime,
      totalTasks,
      mostPracticed,
      dailyAverage,
      overRunFactor, 
      weeklyData,
      skills
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ RAW DATA (for Skill Manager)
router.get("/raw", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    let progress = await Progress.find({ user_id: userId }).populate("skill_id");
    
    // 🔥 Filter orphans
    progress = progress.filter(p => p.skill_id && p.skill_id.skill_name);

    res.json(progress);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;