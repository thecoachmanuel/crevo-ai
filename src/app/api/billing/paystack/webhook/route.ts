import { NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") as string;

  const secret = process.env.PAYSTACK_SECRET_KEY!;

  const expectedSignature = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new NextResponse("Invalid Signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const data = event.data;
    const customFields = data.metadata?.custom_fields || [];
    const getField = (name: string) => customFields.find((f: any) => f.variable_name === name)?.value;

    const userId = getField("userId");
    const planKey = getField("planKey");
    const discountApplied = getField("discountApplied") === "true";

    if (userId && planKey) {
      try {
        await convex.mutation(api.users.fulfillPurchase, {
          userId: userId as Id<"users">,
          planKey,
          discountApplied,
        });
      } catch (err) {
        console.error("Failed to fulfill Paystack purchase:", err);
        return new NextResponse("Internal Server Error", { status: 500 });
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
