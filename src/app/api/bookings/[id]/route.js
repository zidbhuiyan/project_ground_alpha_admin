import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/lib/models/Booking";

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    // Next 14+ passes params as a Promise sometimes — unwrap if needed
    const maybeParams = params || {};
    const p =
      typeof maybeParams.then === "function" ? await maybeParams : maybeParams;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    const body = await req.json();

    const {
      customerName,
      customerPhone,
      reason,
      price,
      bookedBy,
      bookedAt,
      canceledBy,
      canceledAt,
    } = body || {};

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // Update only provided fields
    if (customerName !== undefined) booking.customerName = customerName;
    if (customerPhone !== undefined) booking.customerPhone = customerPhone;
    if (reason !== undefined) booking.reason = reason;
    if (price !== undefined) booking.price = price;
    if (bookedBy !== undefined) booking.bookedBy = bookedBy;
    if (bookedAt !== undefined) booking.bookedAt = bookedAt;
    if (canceledBy !== undefined) booking.canceledBy = canceledBy;
    if (canceledAt !== undefined) booking.canceledAt = canceledAt;

    await booking.save();

    return NextResponse.json({ message: "Updated", booking }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/bookings/:id error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    // Next 14+ passes params as a Promise sometimes — unwrap if needed
    const maybeParams = params || {};
    const p =
      typeof maybeParams.then === "function" ? await maybeParams : maybeParams;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    const found = await Booking.findById(id);
    if (!found) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await Booking.findByIdAndDelete(id);
    return NextResponse.json({ message: "Cancelled" }, { status: 200 });
  } catch (err) {
    console.error("Bookings DELETE error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
