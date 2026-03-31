const mongoose = require("mongoose");
const Progress = require("./backend/models/Progress");
const Skill = require("./backend/models/Skill");
const User = require("./backend/models/User");
require("dotenv").config({ path: "./backend/.env" });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const progress = await Progress.find({}).populate("skill_id");
  console.log("Total Progress Records:", progress.length);
  progress.forEach((p, i) => {
    console.log(`Record ${i}: skill_id is ${p.skill_id ? "PRESENT" : "NULL"}, name: ${p.skill_id?.skill_name}`);
  });
  process.exit();
}
check();
