import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";
import Discount from "@/lib/models/Discount";
import Event from "@/lib/models/Event";

/* ---------------- DATE HELPERS ---------------- */

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/* ---------------- AGGREGATION HELPERS ---------------- */

async function bookingStats(startISO, endISO) {
  const matchStage = {
    $match: {
      date: { $gte: startISO, $lte: endISO },
      canceledAt: null,
    },
  };

  /* ---------- MOST BOOKED SLOTS ---------- */
  const mostBookedSlots = await Booking.aggregate([
    matchStage,
    { $group: { _id: "$slotLabel", totalBookings: { $sum: 1 } } },
    { $sort: { totalBookings: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        slotLabel: "$_id",
        totalBookings: 1,
      },
    },
  ]);

  /* ---------- LEAST BOOKED SLOTS ---------- */
  const leastBookedSlots = await Booking.aggregate([
    matchStage,
    { $group: { _id: "$slotLabel", totalBookings: { $sum: 1 } } },
    { $sort: { totalBookings: 1 } },
    { $limit: 3 },
    {
      $project: {
        _id: 0,
        slotLabel: "$_id",
        totalBookings: 1,
      },
    },
  ]);

  /* ---------- BUSIEST DAYS (DAY NAME) ---------- */
  const busiestDaysRaw = await Booking.aggregate([
    matchStage,
    {
      $group: {
        _id: { $dayOfWeek: { $dateFromString: { dateString: "$date" } } },
        totalBookings: { $sum: 1 },
      },
    },
    { $sort: { totalBookings: -1 } },
    { $limit: 3 },
  ]);

  /* ---------- QUIET DAYS (DAY NAME) ---------- */
  const quietDaysRaw = await Booking.aggregate([
    matchStage,
    {
      $group: {
        _id: { $dayOfWeek: { $dateFromString: { dateString: "$date" } } },
        totalBookings: { $sum: 1 },
      },
    },
    { $sort: { totalBookings: 1 } },
    { $limit: 2 },
  ]);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const busiestDays = busiestDaysRaw.map((d) => ({
    day: days[d._id - 1],
    totalBookings: d.totalBookings,
  }));

  const quietDays = quietDaysRaw.map((d) => ({
    day: days[d._id - 1],
    totalBookings: d.totalBookings,
  }));

  return {
    mostBookedSlots,
    leastBookedSlots,
    busiestDays,
    quietDays,
  };
}

/* ---------------- API ---------------- */

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    const todayISO = toISO(today);
    const tomorrowISO = toISO(addDays(today, 1));

    const lastWeekISO = toISO(addDays(today, -7));
    const lastMonthISO = toISO(addDays(today, -30));
    const lastYearISO = toISO(addDays(today, -365));

    const [
      lastWeek,
      lastMonth,
      lastYear,
      todayBookings,
      tomorrowBookings,
      discounts,
      currentEvents,
      futureEvents,
    ] = await Promise.all([
      bookingStats(lastWeekISO, todayISO),
      bookingStats(lastMonthISO, todayISO),
      bookingStats(lastYearISO, todayISO),

      Booking.find({ date: todayISO, canceledAt: null })
        .sort({ slotLabel: 1 })
        .lean(),

      Booking.find({ date: tomorrowISO, canceledAt: null })
        .sort({ slotLabel: 1 })
        .lean(),

      Discount.find({
        until: { $gte: new Date(todayISO) },
      })
        .sort({ percent: -1 })
        .lean(),

      Event.find({ type: "current" }).sort({ createdAt: -1 }).lean(),
      Event.find({ type: "future" }).sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json(
      {
        stats: {
          lastWeek,
          lastMonth,
          lastYear,
        },
        todayBookings,
        tomorrowBookings,
        discounts,
        events: {
          current: currentEvents,
          future: futureEvents,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { message: "Dashboard fetch failed", error: err.message },
      { status: 500 }
    );
  }
}
