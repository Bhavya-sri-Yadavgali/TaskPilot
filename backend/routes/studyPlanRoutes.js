const express = require("express")
const router = express.Router()

const StudyPlan = require("../models/StudyPlan")

// Create Study Plan
router.post("/create", async (req, res) => {

  try {

    const studyPlan = new StudyPlan(req.body)

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
router.get("/", async (req, res) => {

  const plans = await StudyPlan
    .find()
    .populate("tasks")

  res.json(plans)

})

module.exports = router