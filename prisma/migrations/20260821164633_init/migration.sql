-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "razorpayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "planName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailureEvent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT NOT NULL,
    "failureReason" TEXT NOT NULL,
    "classifiedAs" TEXT NOT NULL,
    "agentDecision" TEXT NOT NULL,
    "agentReasoning" TEXT NOT NULL,
    "offerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentLinkUrl" TEXT,
    "recoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailureEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_razorpayId_key" ON "Customer"("razorpayId");

-- AddForeignKey
ALTER TABLE "FailureEvent" ADD CONSTRAINT "FailureEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
