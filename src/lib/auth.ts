import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getAuthUser(req?: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("polaris_session")?.value;
  
  if (!token) return null;
  
  try {
    return await convex.query(api.users.current, { token });
  } catch (err) {
    console.error("Failed to fetch authenticated user:", err);
    return null;
  }
}
