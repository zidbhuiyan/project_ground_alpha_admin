import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageDataUrl: { type: String, required: true }, // store base64/data URL for demo
    type: { type: String, enum: ["current", "future"], default: "current" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
