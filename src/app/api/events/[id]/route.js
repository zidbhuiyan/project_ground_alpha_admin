import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const found = await Event.findById(id);

    if (!found) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await Event.findByIdAndDelete(id);

    return NextResponse.json({ message: "Event deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE event error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
