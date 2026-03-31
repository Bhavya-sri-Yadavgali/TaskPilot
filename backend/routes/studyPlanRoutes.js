const express = require("express")
const router = express.Router()

const StudyPlan = require("../models/StudyPlan")
const auth = require("../middleware/auth")

// Create Study Plan
router.post("/create", auth, async (req, res) => {

  try {

    // 🔥 Strip user_id from body to prevent owner hijacking
    delete req.body.user_id;

    const studyPlan = new StudyPlan({
      ...req.body,
      user_id: req.user.userId
    })

    await studyPlan.save()

    res.json({
      message: "Study Plan created successfully",
      studyPlan
    })

  } catch (error) {

    res.status(500).json({ error: error.message })

  }

})


// Get all study plans
router.get("/", auth, async (req, res) => {

  try {
    const plans = await StudyPlan
      .find({ user_id: req.user.userId })
      .populate("tasks")

    res.json(plans)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }

})

module.exports = router