import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../convex/_generated/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const secret = process.env.POLARIS_CONVEX_INTERNAL_KEY;
    if (!secret) {
      console.error("Missing POLARIS_CONVEX_INTERNAL_KEY");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // 1. Fetch the user securely from Convex using our internal query
    const user = await convex.query(api.users.getUserByEmailForAuth, {
      email,
      secret,
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 2. Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Create a session for the user
    const sessionToken = await convex.mutation(api.users.createSession, {
      userId: user._id,
    });

    // 4. Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set("polaris_session", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
