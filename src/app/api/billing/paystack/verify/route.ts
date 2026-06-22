import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  try {
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status && verifyData.data.status === "success") {
      // Find metadata from custom_fields
      const customFields = verifyData.data.metadata?.custom_fields || [];
      const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;

      const userId = getField("userId");
      const planKey = getField("planKey");
      const discountApplied = getField("discountApplied") === "true";

      if (userId && planKey) {
        // Atomic update via Convex mutation
        await convex.mutation(api.users.fulfillPurchase, {
          userId: userId as Id<"users">,
          planKey,
          discountApplied,
        });
      }
    }
  } catch (error) {
    console.error("Paystack Verification error:", error);
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
