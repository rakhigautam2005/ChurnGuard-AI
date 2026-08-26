export const dynamic = "force-dynamic";

import { PrismaClient } from "@prisma/client";
import React from "react";

async function getData() {
  const prisma = new PrismaClient();
  const events = await prisma.failureEvent.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const total = events.length;
  const recovered = events.filter((e) => e.status === "link_sent").length;
  const revenueSaved = events
    .filter((e) => e.status === "link_sent")
    .reduce((sum, e) => sum + (e.customer?.amount || 0), 0);

  await prisma.$disconnect();

  return { events, total, recovered, revenueSaved };
}

function offerLabel(offerType) {
  const labels = {
    immediate_retry: "Immediate retry",
    delayed_retry_3d: "Delayed retry (3 days)",
    switch_payment_method: "Switch payment method",
    manual_review: "Manual review",
  };
  return labels[offerType] || offerType;
}

function statusStyle(status) {
  if (status === "link_sent") return { bg: "#dcfce7", color: "#166534", label: "Recovery link sent" };
  if (status === "manual_review") return { bg: "#fef3c7", color: "#92400e", label: "Manual review" };
  return { bg: "#f1f5f9", color: "#475569", label: status };
}

function StatCard(label, value) {
  return React.createElement(
    "div",
    { style: { border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 } },
    React.createElement("div", { style: { fontSize: 13, color: "#64748b" } }, label),
    React.createElement("div", { style: { fontSize: 24, fontWeight: 600, marginTop: 4 } }, value)
  );
}

function EventRow(event) {
  const style = statusStyle(event.status);
  const customerName = event.customer ? event.customer.name : "Unknown customer";
  const customerAmount = event.customer ? event.customer.amount : 0;

  const children = [
    React.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, key: "top" },
      React.createElement(
        "div",
        { key: "left" },
        React.createElement("span", { style: { fontWeight: 500 }, key: "name" }, customerName),
        React.createElement(
          "span",
          { style: { color: "#64748b", fontSize: 14 }, key: "amt" },
          " - Rs. " + customerAmount.toLocaleString("en-IN")
        )
      ),
      React.createElement(
        "span",
        {
          style: { fontSize: 12, padding: "2px 10px", borderRadius: 12, background: style.bg, color: style.color },
          key: "status",
        },
        style.label
      )
    ),
    React.createElement(
      "div",
      { style: { fontSize: 13, color: "#64748b", marginTop: 6 }, key: "reason" },
      event.failureReason
    ),
    React.createElement(
      "div",
      { style: { fontSize: 13, color: "#2563eb", marginTop: 4 }, key: "decision" },
      "Agent decision: " + offerLabel(event.agentDecision)
    ),
    React.createElement(
      "div",
      { style: { fontSize: 12, color: "#94a3b8", marginTop: 4, fontStyle: "italic" }, key: "reasoning" },
      event.agentReasoning
    ),
  ];

  if (event.paymentLinkUrl) {
    children.push(
      React.createElement(
        "div",
        { style: { marginTop: 6, fontSize: 13 }, key: "link" },
        "Recovery link: ",
        React.createElement(
          "a",
          {
            href: event.paymentLinkUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            style: { color: "#2563eb", textDecoration: "underline" },
          },
          event.paymentLinkUrl
        )
      )
    );
  }

  return React.createElement(
    "div",
    { key: event.id, style: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" } },
    ...children
  );
}

export default async function DashboardPage() {
  const data = await getData();
  const rate = data.total > 0 ? Math.round((data.recovered / data.total) * 100) : 0;

  const statCards = React.createElement(
    "div",
    { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 } },
    StatCard("Failed payments", String(data.total)),
    StatCard("Recovered", String(data.recovered)),
    StatCard("Recovery rate", rate + "%"),
    StatCard("Revenue saved", "Rs. " + data.revenueSaved.toLocaleString("en-IN"))
  );

  const eventsList =
    data.events.length === 0
      ? React.createElement(
          "div",
          { style: { padding: 24, background: "#f8fafc", borderRadius: 8, color: "#64748b" } },
          "No events yet. Trigger a test webhook to see data here."
        )
      : React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          ...data.events.map(EventRow)
        );

  return React.createElement(
    "div",
    { style: { fontFamily: "system-ui, sans-serif", maxWidth: 1000, margin: "0 auto", padding: "32px 24px" } },
    React.createElement(
      "div",
      { style: { marginBottom: 32 } },
      React.createElement("h1", { style: { fontSize: 24, fontWeight: 600, margin: 0 } }, "ChurnGuard AI"),
      React.createElement(
        "p",
        { style: { color: "#64748b", marginTop: 4 } },
        "Subscription recovery dashboard"
      )
    ),
    statCards,
    React.createElement(
      "h2",
      { style: { fontSize: 16, fontWeight: 600, marginBottom: 12 } },
      "Recent events"
    ),
    eventsList
  );
}
