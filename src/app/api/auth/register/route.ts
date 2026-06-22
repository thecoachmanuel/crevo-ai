import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../../convex/_generated/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Hash the password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 2. Call Convex to create the user and generate a session token
    const sessionToken = await convex.mutation(api.users.registerWithEmail, {
      email,
      passwordHash,
      name,
    });

    // 3. Set the session cookie (httpOnly: false so client Convex can read it)
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
    console.error("Registration Error:", error);
    if (error.message.includes("Email already in use")) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
