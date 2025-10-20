const mongoose = require("mongoose");

let isConnected = false; // 🔒 Reuse existing connection

const connectDB = async () => {
  if (isConnected) {
    console.log("⚡ MongoDB already connected");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // ⚠️ Vercel-д зориулж хуучин option-уудыг хассан
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};

module.exports = connectDB;
