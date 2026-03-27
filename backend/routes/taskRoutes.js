const express = require("express")
const router = express.Router()

const Task = require("../models/Task")

// Create Task
router.post("/add", async (req, res) => {

  try {

    const task = new Task(req.body)

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
router.get("/", async (req, res) => {

  const tasks = await Task.find()

  res.json(tasks)

})



router.delete("/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id)
  res.json({ msg: "Deleted" })
})

// UPDATE STATUS
router.put("/:id", async (req, res) => {
  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
  res.json(updated)
})






module.exports = router