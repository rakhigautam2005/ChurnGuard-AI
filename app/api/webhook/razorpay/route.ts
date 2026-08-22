import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { classifyFailure } from "@/lib/classifier";
import { decideRecoveryAction } from "@/lib/agent";
import { enqueueRecovery } from "@/lib/queue";

function verifySignature(body: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.event !== "payment.failed") {
    return NextResponse.json({ status: "ignored" });
  }

  const payment = payload.payload.payment.entity;

  const { category, reasoning: classificationReasoning } = classifyFailure({
    error_code: payment.error_code,
    error_description: payment.error_description,
  });

  const decision = decideRecoveryAction(category);

  const delayMs = decision.offerType === "delayed_retry_3d" ? 3 * 24 * 60 * 60 * 1000 : 0;

  await enqueueRecovery(
    {
      customerId: payment.customer_id,
      razorpayPaymentId: payment.id,
      errorCode: payment.error_code,
      errorDescription: payment.error_description,
      amount: payment.amount / 100,
      customerName: payment.notes?.customer_name || "Customer",
      customerEmail: payment.email,
      customerPhone: payment.contact,
    },
    delayMs
  );

  // classificationReasoning + decision.reasoning get persisted to FailureEvent
  // by the worker once it picks up the job - see workers/recovery-worker.ts

  return NextResponse.json({
    status: "queued",
    category,
    offerType: decision.offerType,
    classificationReasoning,
    agentReasoning: decision.reasoning,
  });
}
