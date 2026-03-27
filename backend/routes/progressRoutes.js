// const express = require("express")
// const router = express.Router()

// const Progress = require("../models/Progress")

// // Create progress entry
// router.post("/add", async (req, res) => {

//   try {

//     const progress = new Progress(req.body)

//     await progress.save()

//     res.json({
//       message: "Progress saved",
//       progress
//     })

//   } catch (error) {

//     res.status(500).json({ error: error.message })

//   }

// })


// // Get progress
// router.get("/", async (req, res) => {

//   const progress = await Progress
//     .find()
//     .populate("user_id")
//     .populate("skill_id")

//   res.json(progress)

// })

// module.exports = router







// routes/progressRoutes.js

const express = require("express");
const router = express.Router();

const Progress = require("../models/Progress");
const auth = require("../middleware/auth");


// ✅ CREATE PROGRESS (POST)
router.post("/",auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = new Progress({
      ...req.body,
      user_id: userId // 🔥 link to user
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
    const userId = req.user.id;

    const progressData = await Progress.find({ user_id: userId })
      .populate("skill_id");

    if (!progressData.length) {
      return res.json({
        totalStudyTime: 0,
        totalTasks: 0,
        mostPracticed: "None",
        dailyAverage: 0,
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

    // 🔹 Skills Data (FIXED)
    const skills = progressData.map(p => ({
      name: p.skill_id?.skill_name || "Unknown",
      category: p.skill_id?.category || "Other",
      colorTheme: p.skill_id?.colorTheme || "blue",
      hoursSpent: p.completed_hours,
      progress: Math.min(
        Math.round(
          (p.completed_hours / (p.skill_id?.weeklyTargetedHours || 1)) * 100
        ),
        100
      )
    }));

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
    const userId = req.user.id;

    const progress = await Progress.find({ user_id: userId });

    res.json(progress);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;