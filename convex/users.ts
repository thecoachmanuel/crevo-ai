import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { PLANS } from "../src/lib/plans";

export const fulfillPurchase = mutation({
  args: {
    userId: v.id("users"),
    planKey: v.string(),
    discountApplied: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch user
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // 2. Prevent double crediting using a 'purchases' log or checking idempotency keys 
    // In a production system, we'd add a 'purchases' table and record the sessionId to guarantee idempotency.
    // For this prototype, we will rely on Stripe's webhook guarantees and atomic Convex updates.

    // 3. Update credits and plan atomically via patch
    const plan = PLANS[args.planKey as keyof typeof PLANS];
    if (!plan) throw new Error("Invalid plan key");

    const newCredits = user.credits + plan.credits;
    
    let updatedDiscountPlans = user.usedDiscountPlans || [];
    if (args.discountApplied && !updatedDiscountPlans.includes(args.planKey)) {
      updatedDiscountPlans = [...updatedDiscountPlans, args.planKey];
    }

    await ctx.db.patch(user._id, {
      plan: args.planKey,
      credits: newCredits,
      usedDiscountPlans: updatedDiscountPlans,
    });
  },
});


export const current = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) return null;

    const user = await ctx.db.get(session.userId);
    return user;
  },
});

export const loginWithGithub = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    githubAccessToken: v.string(),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (user) {
      // Update existing user with new access token and profile info
      await ctx.db.patch(user._id, {
        name: args.name ?? user.name,
        image: args.image ?? user.image,
        githubAccessToken: args.githubAccessToken,
      });
    } else {
      // Create new user
      const newUserId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        image: args.image,
        githubAccessToken: args.githubAccessToken,
        plan: "free",
        credits: 10,
        usedDiscountPlans: [],
      });
      user = (await ctx.db.get(newUserId))!;
    }

    // Generate session token (using crypto.randomUUID via JS if available, but Convex supports `crypto.randomUUID()`)
    const token = crypto.randomUUID();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
    });

    return token;
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const getUserByEmailForAuth = query({
  args: { email: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    // Only our Next.js backend can call this query securely
    if (args.secret !== process.env.POLARIS_CONVEX_INTERNAL_KEY) {
      throw new Error("Unauthorized access to user credentials");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    return user;
  },
});

export const createSession = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", {
      userId: args.userId,
      token,
    });
    return token;
  },
});

export const registerWithEmail = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("Email already in use");
    }

    const newUserId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: args.passwordHash,
      plan: "free",
      credits: 10,
      usedDiscountPlans: [],
    });

    const token = crypto.randomUUID();
    await ctx.db.insert("sessions", {
      userId: newUserId,
      token,
    });

    return token;
  },
});
