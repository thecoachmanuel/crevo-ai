import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.AUTH_GITHUB_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: "Missing AUTH_GITHUB_ID" }, { status: 500 });
  }

  // GitHub OAuth authorization URL
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  
  // We need the user email and the ability to read/write to repos for the app's features
  githubAuthUrl.searchParams.set("scope", "read:user user:email repo");
  
  // Create a clean redirect URL back to our app
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  githubAuthUrl.searchParams.set("redirect_uri", `${protocol}://${host}/api/auth/github/callback`);

  return NextResponse.redirect(githubAuthUrl.toString());
}
