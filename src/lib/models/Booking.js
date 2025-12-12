import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    // date as yyyy-mm-dd string to make queries easy (UTC local)
    date: { type: String, required: true, index: true },
    slotLabel: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    reason: { type: String, default: "" },
    price: { type: Number, required: true },

    // admin who created/updated booking (bookedBy) and timestamps
    bookedBy: { type: String, default: "admin" },
    bookedAt: { type: Date, default: null },

    canceledBy: { type: String, default: null },
    canceledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
