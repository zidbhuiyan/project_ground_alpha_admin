import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Discount from "@/lib/models/Discount";

export async function GET() {
  try {
    await connectDB();
    const discounts = await Discount.find().sort({ createdAt: -1 });
    return NextResponse.json({ discounts }, { status: 200 });
  } catch (err) {
    console.error("Discounts GET error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const {
      percent,
      until,
      reason,
      days = [],
      slots = ["all"],
    } = await req.json();

    if (typeof percent !== "number" || !until) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // sanitize days -> normalize capitalized day names
    const normDays = Array.isArray(days)
      ? days.map((d) => (d ? String(d).trim() : "")).filter(Boolean)
      : [];

    const normSlots = Array.isArray(slots) && slots.length ? slots : ["all"];

    const doc = await Discount.create({
      percent,
      until: new Date(until),
      reason: reason || "",
      days: normDays,
      slots: normSlots,
    });

    return NextResponse.json(
      { message: "Discount created", discount: doc },
      { status: 201 }
    );
  } catch (err) {
    console.error("Discount POST error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
