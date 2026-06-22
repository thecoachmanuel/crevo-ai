import { cookies } from "next/headers";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export async function getAuthUser(req?: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("polaris_session")?.value;
  
  if (!token) return null;
  
  try {
    return await fetchQuery(api.users.current, { token });
  } catch (err) {
    console.error("Failed to fetch authenticated user:", err);
    return null;
  }
}
