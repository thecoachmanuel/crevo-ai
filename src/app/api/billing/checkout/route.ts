import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PLANS } from "@/lib/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });

export async function POST(req: Request) {
  try {
    const { planKey, userId, provider = "paystack", email } = await req.json();
    const plan = PLANS[planKey as keyof typeof PLANS];
    
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan key" }, { status: 400 });
    }

    const effectivePrice = plan.price; // Discount logic here

    // 1. Paystack Checkout (Primary)
    if (provider === "paystack") {
      if (!email) {
        return NextResponse.json({ error: "Email is required for Paystack" }, { status: 400 });
      }

      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          // Paystack uses the smallest currency unit (e.g. kobo or cents). 
          // Defaulting to USD assuming Paystack account allows it.
          amount: Math.round(effectivePrice * 100), 
          currency: "USD", // Change to NGN if needed
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/paystack/verify`,
          metadata: {
            custom_fields: [
              { display_name: "User ID", variable_name: "userId", value: userId },
              { display_name: "Plan Key", variable_name: "planKey", value: planKey },
              { display_name: "Discount Applied", variable_name: "discountApplied", value: "false" }
            ]
          }
        }),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackData.status) {
        throw new Error(paystackData.message);
      }

      return NextResponse.json({ url: paystackData.data.authorization_url });
    }

    // 2. Stripe Checkout (Optional)
    if (provider === "stripe") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: `${plan.name} Package (${plan.credits} credits)` },
              unit_amount: Math.round(effectivePrice * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          planKey,
          discountApplied: "false",
          discountOneTimePerUser: plan.discountOneTimePerUser.toString(),
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/verify?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });

  } catch (error) {
    console.error("Checkout initialization error:", error);
    return NextResponse.json({ error: "Checkout error" }, { status: 500 });
  }
}
