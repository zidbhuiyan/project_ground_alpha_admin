import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    return Response.json({ message: "MongoDB Connected 🟢" });
  } catch (err) {
    return Response.json(
      { message: "Connection Failed 🔴", error: err.message },
      { status: 500 }
    );
  }
}
