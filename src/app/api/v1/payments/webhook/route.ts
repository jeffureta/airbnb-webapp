import { NextRequest, NextResponse } from "next/server";
import { reservationStore } from "@/lib/reservations";
import { googleEcosystemService } from "@/lib/googleEcosystem";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

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
    const confirmedRes = reservationStore.confirmPayment(reservationId, paymentRef);

    // 1. Google Calendar Two-Way Sync
    const calendarSync = await googleEcosystemService.syncReservationToGoogleCalendar(confirmedRes);

    // 2. Gmail Transactional Messaging & PDF Receipt Dispatch
    const receiptDispatch = await googleEcosystemService.sendTransactionalReceipt(confirmedRes);

    console.log(`[PAYMENT WEBHOOK] Successfully verified payment for Reservation ${reservationId}!`);
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

