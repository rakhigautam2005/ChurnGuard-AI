import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRecoveryPaymentLink(params: {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
}) {
  const link = await razorpay.paymentLink.create({
    amount: params.amount * 100, // paise
    currency: "INR",
    description: params.description,
    customer: {
      name: params.customerName,
      email: params.customerEmail,
      contact: params.customerPhone,
    },
    notify: { sms: true, email: true },
    reminder_enable: true,
  });

  return link.short_url;
}
