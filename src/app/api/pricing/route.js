// src/app/api/pricing/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Pricing from "@/lib/models/Pricing";

const DEFAULT_TIME_SLOTS = [
  ["6:00 am - 7:30 am", 2800, 3300],
  ["7:40 am - 9:10 am", 2800, 3300],
  ["9:20 am - 10:50 am", 2800, 3300],
  ["11:00 am - 12:30 pm", 2800, 3300],
  ["12:40 pm - 2:10 pm", 2800, 3300],
  ["2:20 pm - 3:50 pm", 2800, 3300],
  ["4:00 pm - 5:30 pm", 4000, 4500],
  ["5:40 pm - 7:10 pm", 4000, 4500],
  ["7:20 pm - 8:50 pm", 4000, 4500],
  ["9:00 pm - 10:30 pm", 4000, 4500],
  ["10:40 pm - 12:10 am", 4000, 4500],
  ["12:20 am - 1:50 am", 3500, 4000],
  ["2:00 am - 3:30 am", 3500, 4000],
  ["3:40 am - 5:10 am", 3500, 4000],
];

const DEFAULT_WEEKDAY = ["Monday", "Tuesday", "Wednesday", "Thursday"];
const DEFAULT_WEEKEND = ["Friday", "Saturday", "Sunday"];

// helper to clean duplicates and normalize
function normalizeDays(arr) {
  if (!arr) return [];
  return [...new Set(arr.map((d) => d.trim()))];
}

export async function GET() {
  try {
    await connectDB();

    let config = await Pricing.findOne();

    // If no document → create default
    if (!config) {
      const timeSlots = DEFAULT_TIME_SLOTS.map(([label, wp, ep]) => ({
        label,
        weekdayPrice: wp,
        weekendPrice: ep,
      }));

      config = await Pricing.create({
        weekdayDays: DEFAULT_WEEKDAY,
        weekendDays: DEFAULT_WEEKEND,
        timeSlots,
      });

      return NextResponse.json({ config }, { status: 200 });
    }

    // 🚀 Repair existing DB document automatically

    let shouldSave = false;

    // 1. Normalize and dedupe day arrays
    const cleanedWeekday = normalizeDays(config.weekdayDays);
    const cleanedWeekend = normalizeDays(config.weekendDays);

    if (
      cleanedWeekday.length !== config.weekdayDays.length ||
      cleanedWeekend.length !== config.weekendDays.length
    ) {
      config.weekdayDays = cleanedWeekday;
      config.weekendDays = cleanedWeekend;
      shouldSave = true;
    }

    // 2. Restore timeSlots if missing, null, or empty array
    if (!config.timeSlots || config.timeSlots.length === 0) {
      config.timeSlots = DEFAULT_TIME_SLOTS.map(([label, wp, ep]) => ({
        label,
        weekdayPrice: wp,
        weekendPrice: ep,
      }));
      shouldSave = true;
    }

    // Save repaired config
    if (shouldSave) await config.save();

    return NextResponse.json({ config }, { status: 200 });
  } catch (err) {
    console.error("Pricing GET error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
