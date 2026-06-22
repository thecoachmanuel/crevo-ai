import { QueryCtx, MutationCtx } from "./_generated/server";

export async function verifyAuth(ctx: QueryCtx | MutationCtx, token?: string) {
  if (!token) {
    throw new Error("Unauthorized: No session token provided");
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) {
    throw new Error("Unauthorized: Invalid session token");
  }

  return { subject: session.userId };
}
