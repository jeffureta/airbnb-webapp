import { NextRequest, NextResponse } from "next/server";
import { reservationStore } from "@/lib/reservations";

export async function POST(req: NextRequest) {
  try {
    const { reservationId, paymentMethod, returnUrl } = await req.json();

    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

    const reservation = await reservationStore.getById(reservationId);
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Check if hold has expired
    if (new Date(reservation.lockedUntil) < new Date()) {
      return NextResponse.json(
        { error: "15-minute booking hold expired. Please select dates again." },
        { status: 410 }
      );
    }

    const paymongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
    const isProduction = process.env.NODE_ENV === "production";

    // Guard: Sandbox simulation is strictly forbidden in production
    if (!paymongoSecretKey) {
      if (isProduction) {
        return NextResponse.json(
          { error: "Payment processor not configured for live transactions" },
          { status: 503 }
        );
      }

      const mockPaymentIntentId = `pi_test_${Date.now()}`;
      reservation.paymongoPaymentIntentId = mockPaymentIntentId;

      return NextResponse.json({
        success: true,
        isSandbox: true,
        checkoutUrl: `/checkout/sandbox?id=${reservation.id}&method=${paymentMethod || "gcash"}`,
        paymentIntentId: mockPaymentIntentId,
        message: "Generated PayMongo sandbox checkout URL",
      });
    }

    // Real PayMongo API call (App Router server-side fetch)
    const amountInCentavos = reservation.totalAmount * 100;
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(paymongoSecretKey + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: [
              {
                name: `The Taal Viewpoint Staycation (${reservation.nights} nights)`,
                amount: amountInCentavos,
                currency: "PHP",
                quantity: 1,
              },
            ],
            payment_method_types: [
              paymentMethod === "paymaya" ? "paymaya" : paymentMethod === "card" ? "card" : "gcash",
            ],
            success_url:
              returnUrl ||
              `${process.env.NEXT_PUBLIC_APP_URL || "https://tagaytay-staycation.vercel.app"}/booking/confirmed?id=${reservation.id}`,
            description: `Direct Reservation for ${reservation.guestName} (${reservation.checkIn} to ${reservation.checkOut})`,
          },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `PayMongo API error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const checkoutUrl = data.data?.attributes?.checkout_url;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      paymentIntentId: data.data?.id,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment checkout error" },
      { status: 500 }
    );
  }
}
