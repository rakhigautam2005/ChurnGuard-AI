# ChurnGuard AI

Agentic subscription recovery for Razorpay merchants. Detects failed recurring payments, classifies why they failed, and takes one of a fixed set of bounded recovery actions, each one logged with its reasoning.

## Why this exists

Involuntary churn (a payment silently failing) costs SaaS and D2C brands recurring revenue that customers never actively chose to leave. Most of it goes unrecovered because nobody's watching in real time.

## Architecture

```
Razorpay (test mode)
   |  payment.failed webhook
   v
Next.js API route (/api/webhook/razorpay)
   |  verifies signature
   |  classifies failure (rule-based, lib/classifier.ts)
   |  decides recovery action (lib/agent.ts)
   v
BullMQ queue (Redis) -- handles retry timing and backoff
   v
Worker (workers/recovery-worker.ts)
   |  generates Razorpay Payment Link
   |  persists FailureEvent with full reasoning trail (Prisma/Postgres)
   |  (TODO) sends WhatsApp/SMS via WhatsApp Business API
```

## Why it's bounded, not open-ended

The agent picks from four possible actions: immediate retry, delayed retry, switch payment method, or manual review. It never generates a novel financial action from scratch. Every decision comes with a `reasoning` string that's persisted alongside it. This is the "explainable, bounded, gated" bar for money-moving agents.

## Setup

```bash
npm install
cp .env.example .env   # fill in Razorpay test keys, Postgres, Redis
npm run prisma:migrate
npm run dev             # Next.js app
npm run worker          # BullMQ worker, separate process
```

Point a Razorpay test-mode webhook at `/api/webhook/razorpay` for the `payment.failed` event. Use Razorpay's test card numbers to simulate failures.

## What's next

- WhatsApp Business API integration for the actual customer-facing message send
- Dashboard UI showing recovery rate, revenue saved, and the full decision audit trail
- LLM fallback classifier for failure descriptions the rule table doesn't cover
