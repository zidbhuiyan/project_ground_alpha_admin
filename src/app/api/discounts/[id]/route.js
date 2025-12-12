import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Discount from "@/lib/models/Discount";

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params; // params is async in Next 14+

    const found = await Discount.findById(id);

    if (!found) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    await Discount.findByIdAndDelete(id);

    return NextResponse.json({ message: "Discount deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE discount error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
