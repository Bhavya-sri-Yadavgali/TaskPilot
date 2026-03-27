const express = require("express")
const router = express.Router()

const Skill = require("../models/Skill")

router.post("/add", async (req, res) => {

  const skill = new Skill(req.body)

  await skill.save()

  res.json({ message: "Skill added" })

})

router.get("/", async (req, res) => {

  const skills = await Skill.find()

  res.json(skills)

})

router.put("/:id", async (req, res) => {
  try {
    const updated = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill deleted" });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router