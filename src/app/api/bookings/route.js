import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";

// =========================
//   GET /api/bookings?date=YYYY-MM-DD
// =========================
export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { message: "Missing ?date=YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const bookings = await Booking.find({ date }).sort({ createdAt: 1 }).lean();

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

// =========================
//   POST /api/bookings
// =========================
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      date,
      slotLabel,
      customerName,
      customerPhone = "",
      reason = "",
      price,
      bookedBy,
      bookedAt,
    } = body || {};

    // --- Required fields check ---
    if (
      !date ||
      !slotLabel ||
      !customerName ||
      typeof price !== "number" ||
      !bookedBy ||
      !bookedAt
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- Prevent double booking for active (non-canceled) bookings ---
    const exists = await Booking.findOne({ date, slotLabel, canceledAt: null });
    if (exists) {
      return NextResponse.json(
        { message: "Slot already booked" },
        { status: 409 }
      );
    }

    // --- Create booking ---
    const booking = await Booking.create({
      date,
      slotLabel,
      customerName,
      customerPhone,
      reason,
      price,
      bookedBy,
      bookedAt,
      canceledBy: null,
      canceledAt: null,
    });

    return NextResponse.json({ message: "Booked", booking }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    return NextResponse.json(
      { message: "Server crashed", error: err.message },
      { status: 500 }
    );
  }
}
