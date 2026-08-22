import { FailureCategory } from "./classifier";

// Every decision here is bounded to one of a fixed set of offers.
// No open-ended negotiation. This is deliberate: money-moving decisions
// need to be explainable and auditable, not generated freely by an LLM.

export type OfferType =
  | "immediate_retry"
  | "delayed_retry_3d"
  | "switch_payment_method"
  | "manual_review";

export interface AgentDecision {
  offerType: OfferType;
  customerMessage: string;
  reasoning: string;
}

const DECISION_TABLE: Record<FailureCategory, AgentDecision> = {
  insufficient_funds: {
    offerType: "delayed_retry_3d",
    customerMessage:
      "Your last payment didn't go through. We'll retry in 3 days, or you can pay now using the link below.",
    reasoning:
      "Insufficient funds usually resolves within a few days of salary/credit cycles. Immediate retry would likely fail again and annoy the customer.",
  },
  bank_timeout: {
    offerType: "immediate_retry",
    customerMessage:
      "We had a temporary issue processing your payment. Retrying automatically now.",
    reasoning:
      "Bank timeouts are transient infrastructure issues, not customer-side problems. Safe to retry immediately with no customer action.",
  },
  card_declined: {
    offerType: "switch_payment_method",
    customerMessage:
      "Your card was declined. Use this link to renew with a different payment method.",
    reasoning:
      "A decline usually means the card itself is the problem (expired, blocked). Retrying the same method will fail again, so we ask for a different one.",
  },
  gateway_error: {
    offerType: "immediate_retry",
    customerMessage:
      "A processing error occurred on our end. Retrying your payment now, no action needed.",
    reasoning:
      "Gateway errors are our infrastructure's fault, not the customer's. Retry immediately and don't bother the customer with messaging blame.",
  },
  unknown: {
    offerType: "manual_review",
    customerMessage:
      "We're looking into an issue with your last payment and will follow up shortly.",
    reasoning:
      "Unclassified failure. Routing to manual review rather than guessing a money-moving action.",
  },
};

export function decideRecoveryAction(category: FailureCategory): AgentDecision {
  return DECISION_TABLE[category];
}
