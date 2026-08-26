import twilio from "twilio";

export async function sendWhatsAppRecoveryMessage(params: {
  message: string;
  failureReason?: string;
  paymentLinkUrl?: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  const to = process.env.TWILIO_WHATSAPP_TO;
  const contentSid = process.env.TWILIO_CONTENT_SID;

  if (!accountSid || !authToken) {
    console.log("Twilio credentials not set, skipping WhatsApp send.");
    return null;
  }

  if (!to) {
    console.log("TWILIO_WHATSAPP_TO not set, skipping WhatsApp send.");
    return null;
  }

  const client = twilio(accountSid, authToken);

  try {
    let result;

    if (contentSid) {
      // Use the approved Content Template (required for business-initiated messages)
      result = await client.messages.create({
        from,
        to,
        contentSid,
        contentVariables: JSON.stringify({
          "1": params.failureReason || "payment issue",
          "2": params.paymentLinkUrl || "",
        }),
      });
    } else {
      // Fallback: freeform message (only works if customer messaged us first, e.g. sandbox join)
      result = await client.messages.create({
        from,
        to,
        body: params.message,
      });
    }

    console.log("WhatsApp message sent:", result.sid);
    return result.sid;
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return null;
  }
}
