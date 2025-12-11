// src/app/api/pricing/save-all/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Pricing from "@/lib/models/Pricing";

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function normalizeDayName(d) {
  if (!d) return null;
  const lower = String(d).toLowerCase().trim();
  const map = {
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    wed: "Wednesday",
    thu: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",
  };
  return map[lower] || null;
}

function cleanDaysArray(arr = []) {
  return [
    ...new Set(
      (arr || [])
        .map(normalizeDayName)
        .filter((x) => x && VALID_DAYS.includes(x))
    ),
  ];
}

export async function POST(req) {
  try {
    await connectDB();

    const {
      weekdayDays = [],
      weekendDays = [],
      timeSlots = [],
    } = await req.json();

    // normalize days (capitalized, unique)
    const cleanWeekday = cleanDaysArray(weekdayDays);
    const cleanWeekend = cleanDaysArray(weekendDays);

    // format time slots
    const formattedSlots = (timeSlots || []).map((slot) => ({
      label: slot.label || "",
      weekdayPrice: Number(slot.weekdayPrice) || 0,
      weekendPrice: Number(slot.weekendPrice) || 0,
    }));

    // update (or create) the single config document
    const updated = await Pricing.findOneAndUpdate(
      {},
      {
        weekdayDays: cleanWeekday,
        weekendDays: cleanWeekend,
        timeSlots: formattedSlots,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      { message: "Saved", config: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("Save-all error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
