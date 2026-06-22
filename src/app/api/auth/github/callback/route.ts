import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../../../convex/_generated/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing GitHub OAuth credentials" }, { status: 500 });
  }

  try {
    // 1. Exchange the code for an access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("Failed to get access token from GitHub");
    }

    // 2. Fetch the user's profile from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const githubUser = await userResponse.json();

    // 3. Fetch user emails (GitHub primary email)
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const emails = await emailResponse.json();
    const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;

    if (!primaryEmail) {
      throw new Error("No email found on GitHub account");
    }

    // 4. Create or update user in Convex and generate a custom session token
    const sessionToken = await convex.mutation(api.users.loginWithGithub, {
      email: primaryEmail,
      name: githubUser.name || githubUser.login,
      image: githubUser.avatar_url,
      githubAccessToken: accessToken,
    });

    // 5. Store the session token in a cookie accessible to the frontend
    const cookieStore = await cookies();
    cookieStore.set("polaris_session", sessionToken, {
      httpOnly: false, // Must be false so React can read it for Convex WebSockets
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // 6. Redirect to the homepage
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    return NextResponse.redirect(`${protocol}://${host}/`);

  } catch (error: any) {
    console.error("OAuth Callback Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
