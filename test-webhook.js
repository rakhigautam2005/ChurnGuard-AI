const crypto = require("crypto");
const http = require("http");

const WEBHOOK_SECRET = "ChurnGuard2026secret";

const payload = {
  event: "payment.failed",
  payload: {
    payment: {
      entity: {
        id: "pay_test_" + Math.random().toString(36).slice(2, 10),
        amount: 149900,
        customer_id: "cust_test_001",
        email: "test.customer@example.com",
        contact: "+919760570712",
        error_code: "BAD_REQUEST_ERROR",
        error_description: "Payment failed due to insufficient funds",
        notes: {
          customer_name: "Test Customer",
        },
      },
    },
  },
};

const body = JSON.stringify(payload);

const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(body)
  .digest("hex");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/webhook/razorpay",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-razorpay-signature": signature,
    "Content-Length": Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", data);
  });
});

req.on("error", (err) => {
  console.error("Request failed:", err.message);
});

req.write(body);
req.end();