// Classifies a Razorpay payment failure into a known category.
// Rule-based first because it's fast, free, and explainable.
// Falls back to an LLM call only when the error code doesn't match a known pattern.

export type FailureCategory =
  | "insufficient_funds"
  | "bank_timeout"
  | "card_declined"
  | "gateway_error"
  | "unknown";

const ERROR_CODE_MAP: Record<string, FailureCategory> = {
  BAD_REQUEST_ERROR: "card_declined",
  GATEWAY_ERROR: "gateway_error",
  SERVER_ERROR: "bank_timeout",
};

const DESCRIPTION_PATTERNS: [RegExp, FailureCategory][] = [
  [/insufficient/i, "insufficient_funds"],
  [/timeout|timed out/i, "bank_timeout"],
  [/declined|decline/i, "card_declined"],
  [/gateway|processing error/i, "gateway_error"],
];

export function classifyFailure(payload: {
  error_code?: string;
  error_description?: string;
}): { category: FailureCategory; reasoning: string } {
  const { error_code, error_description } = payload;

  if (error_code && ERROR_CODE_MAP[error_code]) {
    return {
      category: ERROR_CODE_MAP[error_code],
      reasoning: `Matched Razorpay error code ${error_code} to known category.`,
    };
  }

  if (error_description) {
    for (const [pattern, category] of DESCRIPTION_PATTERNS) {
      if (pattern.test(error_description)) {
        return {
          category,
          reasoning: `Matched failure description pattern "${pattern}" to ${category}.`,
        };
      }
    }
  }

  return {
    category: "unknown",
    reasoning: "No rule matched. Defaulting to unknown, flagged for manual review.",
  };
}
