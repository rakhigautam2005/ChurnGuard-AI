import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const recoveryQueue = new Queue("payment-recovery", { connection });

export interface RecoveryJobData {
  customerId: string;
  razorpayPaymentId: string;
  errorCode?: string;
  errorDescription?: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export async function enqueueRecovery(data: RecoveryJobData, delayMs = 0) {
  await recoveryQueue.add("recover", data, {
    delay: delayMs,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}
