const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/user_analytics";

  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error("[DB] Connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
