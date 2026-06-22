import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, planKey, discountApplied } = session.metadata!;

    // Atomic update via Convex mutation (idempotent, prevents double-crediting)
    try {
      await convex.mutation(api.users.fulfillPurchase, {
        userId: userId as Id<"users">,
        planKey,
        discountApplied: discountApplied === "true",
      });
    } catch (err) {
      console.error("Failed to fulfill purchase:", err);
      // Still return 200 to acknowledge webhook receipt, or return 500 to retry
      // returning 500 allows stripe to retry.
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}
