import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Missing MONGODB_URI in .env.local");
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log("✔ MongoDB already connected");
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: "ground_alpha",
    });

    isConnected = db.connections[0].readyState === 1;

    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    throw error;
  }
}
