import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Proper deletion (compatible with all browsers)
  cookieStore.set("admin_session", "", {
    expires: new Date(0),
    path: "/", // Important!
  });

  return Response.json({ message: "Logged out successfully" }, { status: 200 });
}
