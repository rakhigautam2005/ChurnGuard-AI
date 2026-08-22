import { Worker } from "bullmq";
import { connection, RecoveryJobData } from "../lib/queue";
import { classifyFailure } from "../lib/classifier";
import { decideRecoveryAction } from "../lib/agent";
import { createRecoveryPaymentLink } from "../lib/razorpay";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const worker = new Worker<RecoveryJobData>(
  "payment-recovery",
  async (job) => {
    const data = job.data;

    const { category, reasoning: classificationReasoning } = classifyFailure({
      error_code: data.errorCode,
      error_description: data.errorDescription,
    });

    const decision = decideRecoveryAction(category);

    let paymentLinkUrl: string | undefined;
    if (decision.offerType !== "manual_review") {
      paymentLinkUrl = await createRecoveryPaymentLink({
        amount: data.amount,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        description: decision.customerMessage,
      });
    }

    const customer = await prisma.customer.upsert({
      where: { razorpayId: data.customerId },
      update: {},
      create: {
        razorpayId: data.customerId,
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        planName: "unknown",
        amount: data.amount,
      },
    });

    await prisma.failureEvent.create({
      data: {
        customerId: customer.id,
        razorpayPaymentId: data.razorpayPaymentId,
        failureReason: data.errorDescription || data.errorCode || "unknown",
        classifiedAs: category,
        agentDecision: decision.offerType,
        agentReasoning: `${classificationReasoning} ${decision.reasoning}`,
        offerType: decision.offerType,
        status: paymentLinkUrl ? "link_sent" : "manual_review",
        paymentLinkUrl,
      },
    });

    // TODO: trigger WhatsApp/SMS send here via WhatsApp Business API,
    // using decision.customerMessage + paymentLinkUrl

    return { category, offerType: decision.offerType, paymentLinkUrl };
  },
  { connection }
);

worker.on("completed", (job, result) => {
  console.log(`Recovered job ${job.id}:`, result);
});
worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed. Full error below:`);
  console.error(err);
});

console.log("ChurnGuard recovery worker running...");
