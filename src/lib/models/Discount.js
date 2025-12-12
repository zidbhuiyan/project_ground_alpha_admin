import mongoose from "mongoose";

/**
 * Discount rule (dynamic)
 * - percent: integer 0-100
 * - until: ISO date string (end date inclusive)
 * - reason: text
 * - days: array of "Monday".."Sunday" or empty = all days
 * - slots: array of slot labels or ["all"] meaning all slots
 */
const DiscountSchema = new mongoose.Schema(
  {
    percent: { type: Number, required: true },
    until: { type: Date, required: true },
    reason: { type: String, default: "" },
    days: { type: [String], default: [] },
    slots: { type: [String], default: ["all"] },
  },
  { timestamps: true }
);

export default mongoose.models.Discount ||
  mongoose.model("Discount", DiscountSchema);
