const express = require("express")
const cors = require("cors")
require("dotenv").config()

const connectDB = require("./config/db")
const authRoutes = require("./routes/authRoutes")
const skillRoutes = require("./routes/skillRoutes")
const taskRoutes = require("./routes/taskRoutes")
const studyPlanRoutes = require("./routes/studyPlanRoutes")
const progressRoutes = require("./routes/progressRoutes")
const todoRoutes = require("./routes/todoRoutes")


const app = express()

connectDB()

app.use(cors())
app.use(express.json())
app.use("/api/auth", authRoutes)
app.use("/api/skills", skillRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/studyplan", studyPlanRoutes)
app.use("/api/progress", progressRoutes)
app.use("/api/todos", todoRoutes)

app.get("/", (req, res) => {
  res.send("Smart Study Platform API Running")
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})


const User = require("./models/User")
