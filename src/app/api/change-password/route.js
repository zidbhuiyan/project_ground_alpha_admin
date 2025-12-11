import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();

  const { password } = await req.json();
  const cookies = req.cookies;

  const adminId = cookies.get("admin_session")?.value;

  const hashed = await bcrypt.hash(password, 12);

  await Admin.findByIdAndUpdate(adminId, { password: hashed });

  return NextResponse.json({ message: "Password updated" });
}
