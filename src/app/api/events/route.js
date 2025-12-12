import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Event from "@/lib/models/Event";

export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });
    return NextResponse.json({ events }, { status: 200 });
  } catch (err) {
    console.error("Events GET error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { title, imageDataUrl, type } = await req.json();

    if (!title || !imageDataUrl || !type) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const ev = await Event.create({ title, imageDataUrl, type });
    return NextResponse.json(
      { message: "Created", event: ev },
      { status: 201 }
    );
  } catch (err) {
    console.error("Events POST error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
