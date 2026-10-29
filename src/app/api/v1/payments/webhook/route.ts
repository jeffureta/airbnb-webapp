import { NextRequest, NextResponse } from "next/server";
import { reservationStore } from "@/lib/reservations";
import { googleEcosystemService } from "@/lib/googleEcosystem";
import { verifyPayMongoSignature } from "@/lib/paymongoWebhook";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    // 1. Signature Verification Check
    if (webhookSecret) {
      const verification = verifyPayMongoSignature(rawBody, signatureHeader, webhookSecret);
      if (!verification.isValid) {
        console.error(`[PAYMONGO WEBHOOK] Verification failed: ${verification.error}`);
        return NextResponse.json(
          { error: `Unauthorized webhook signature: ${verification.error}` },
          { status: 401 }
        );
      }
    } else {
      // In production, reject if secret is missing or unverified
      if (isProduction) {
        console.error("[PAYMONGO WEBHOOK] PAYMONGO_WEBHOOK_SECRET is not configured in production");
        return NextResponse.json(
          { error: "Webhook signature verification required in production" },
          { status: 500 }
        );
      }
      console.warn("[PAYMONGO WEBHOOK] PAYMONGO_WEBHOOK_SECRET not set; running in local dev mock mode.");
    }

    // 2. Parse payload safely
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // PayMongo webhook structure: data.attributes.type === "payment.paid" or custom mock
    const eventType = payload.data?.attributes?.type || payload.type;
    const reservationId =
      payload.data?.attributes?.data?.attributes?.metadata?.reservation_id ||
      payload.reservationId;
    const paymentRef =
      payload.data?.attributes?.data?.id ||
      payload.paymentReference ||
      `pay_${Date.now()}`;

    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is missing in webhook" }, { status: 400 });
    }

    // Verify and update reservation status
    const confirmedRes = await reservationStore.confirmPayment(reservationId, paymentRef);

    // 1. Google Calendar Two-Way Sync
    const calendarSync = await googleEcosystemService.syncReservationToGoogleCalendar(confirmedRes);

    // 2. Gmail Transactional Messaging & PDF Receipt Dispatch
    const receiptDispatch = await googleEcosystemService.sendTransactionalReceipt(confirmedRes);

    console.log(
      `[PAYMENT WEBHOOK] Successfully verified payment for Reservation ${reservationId} (Type: ${eventType})`
    );
    console.log(`[GOOGLE CALENDAR SYNC] Event created: ${calendarSync.eventId}`);
    console.log(`[GMAIL RECEIPT] Dispatched branded PDF receipt to ${confirmedRes.guestEmail}`);

    return NextResponse.json({
      success: true,
      status: "CONFIRMED",
      reservation: confirmedRes,
      googleCalendarSync: calendarSync,
      gmailReceipt: receiptDispatch,
      message: "Webhook processed, Google Calendar event created, and Gmail receipt dispatched.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failure" },
      { status: 500 }
    );
  }
}
