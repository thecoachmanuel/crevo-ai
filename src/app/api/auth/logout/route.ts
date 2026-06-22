import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("polaris_session")?.value;

    if (token) {
      // Invalidate the token in the Convex database
      await convex.mutation(api.users.logout, { token });
      
      // Delete the cookie
      cookieStore.delete("polaris_session");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout Error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
