import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      const { userId, planKey, discountApplied } = session.metadata!;
      
      // Atomic update via Convex mutation
      await convex.mutation(api.users.fulfillPurchase, {
        userId: userId as Id<"users">,
        planKey,
        discountApplied: discountApplied === "true",
      });
    }
  } catch (error) {
    console.error("Verification error:", error);
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
