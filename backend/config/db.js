const mongoose = require("mongoose")

const connectDB = async () => {
  console.log("DEBUG: MongoDB attempting to connect...");
  try {
    mongoose.connection.on("connected", () => console.log("DEBUG: Mongoose connected to DB Cluster."));
    mongoose.connection.on("error", (err) => console.error("DEBUG: Mongoose connection error:", err));
    mongoose.connection.on("disconnected", () => console.log("DEBUG: Mongoose disconnected."));

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });
    console.log("DEBUG: MongoDB Connection Function Completed Successfully");
  } catch (error) {
    console.error("DEBUG: MongoDB connection FAILED:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB