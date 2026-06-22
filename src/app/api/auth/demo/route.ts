import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

export async function POST() {
  try {
    const demoEmail = "demo@crevo.ai";
    const demoName = "Demo User";
    const dummyPasswordHash = "dummy_hash_for_demo";

    let sessionToken: string;

    try {
      // 1. Try to register the demo user
      sessionToken = await convex.mutation(api.users.registerWithEmail, {
        email: demoEmail,
        passwordHash: dummyPasswordHash,
        name: demoName,
      });
    } catch (error: any) {
      // 2. If already exists, just create a new session
      const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY || "default_internal_key_123";

      const user = await convex.query(api.users.getUserByEmailForAuth, {
        email: demoEmail,
        secret: internalKey,
      });

      if (!user) {
        throw new Error("Failed to find demo user");
      }

      sessionToken = await convex.mutation(api.users.createSession, {
        userId: user._id,
      });
    }

    // 3. Set the cookie
    const cookieStore = await cookies();
    cookieStore.set("polaris_session", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demo Login Error:", error);
    return NextResponse.json(
      { error: "Failed to login as demo user" },
      { status: 500 }
    );
  }
}
