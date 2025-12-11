import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";

export async function DELETE(req, context) {
  try {
    await connectDB();

    // MUST unwrap params from context
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Admin ID missing" },
        { status: 400 }
      );
    }

    // Prevent self-delete
    const sessionAdminId = req.cookies.get("admin_session")?.value;
    if (sessionAdminId === id) {
      return NextResponse.json(
        { message: "You cannot delete your own account" },
        { status: 403 }
      );
    }

    const deleted = await Admin.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Admin deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE Admin Error:", err);
    return NextResponse.json(
      { message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
