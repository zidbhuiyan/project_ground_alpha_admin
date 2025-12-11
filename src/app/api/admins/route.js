import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function GET(req) {
  try {
    await connectDB();

    const admins = await Admin.find().sort({ createdAt: -1 });

    const session = req.cookies.get("admin_session")?.value;
    const currentAdmin = session ? await Admin.findById(session) : null;

    return NextResponse.json({ admins, currentAdmin }, { status: 200 });
  } catch (error) {
    console.error("Admins API error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
