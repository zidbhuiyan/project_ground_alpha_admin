import { connectDB } from "@/lib/mongodb";
import Admin from "@/lib/models/Admin";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      userId,
      phone,
      password,
      confirmPassword,
    } = body;

    if (password !== confirmPassword) {
      return Response.json(
        { message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to MongoDB
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      userId,
      phone,
      password: hashedPassword, // store the hashed password
    });

    return Response.json(
      {
        message: "Admin created successfully!",
        admin: newAdmin,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error saving admin:", error);

    if (error.code === 11000) {
      // Detect duplicate email
      if (error.keyPattern?.email) {
        return Response.json(
          { message: "This email is already registered." },
          { status: 409 }
        );
      }

      // Detect duplicate userId
      if (error.keyPattern?.userId) {
        return Response.json(
          { message: "This User ID is already taken." },
          { status: 409 }
        );
      }

      return Response.json(
        { message: "Duplicate field error." },
        { status: 409 }
      );
    }

    return Response.json(
      { message: "Failed to create admin", error: error.message },
      { status: 500 }
    );
  }
}
