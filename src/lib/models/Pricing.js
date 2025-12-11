// src/lib/models/Pricing.js
import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema({
  label: { type: String, required: true },
  weekdayPrice: { type: Number, required: true },
  weekendPrice: { type: Number, required: true },
});

const PricingSchema = new mongoose.Schema(
  {
    weekdayDays: { type: [String], default: [] },
    weekendDays: { type: [String], default: [] },
    timeSlots: { type: [TimeSlotSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Pricing ||
  mongoose.model("Pricing", PricingSchema);
