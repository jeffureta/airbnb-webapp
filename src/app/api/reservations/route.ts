import { NextRequest, NextResponse } from "next/server";
import { reservationStore } from "@/lib/reservations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    const blockedDates = await reservationStore.getBlockedDates();

    if (checkIn && checkOut) {
      const available = await reservationStore.isAvailable(checkIn, checkOut);
      return NextResponse.json({ available, blockedDates });
    }

    return NextResponse.json({ blockedDates });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error checking availability" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      guestsCount,
      nights,
      basePrice,
      cleaningFee,
      securityDeposit,
      totalAmount,
      paymentMethod,
    } = body;

    if (!guestName || !guestEmail || !checkIn || !checkOut || !paymentMethod) {
      return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
    }

    // Calculate pricing defaults if not supplied
    const calculatedNights =
      nights ||
      Math.max(
        1,
        Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
    const calculatedBasePrice = basePrice || calculatedNights * 2800;
    const calculatedCleaningFee = cleaningFee !== undefined ? cleaningFee : 500;
    const calculatedSecurityDeposit = securityDeposit !== undefined ? securityDeposit : 1000;
    const calculatedTotalAmount =
      totalAmount || calculatedBasePrice + calculatedCleaningFee + calculatedSecurityDeposit;

    // Attempt to create a 15-minute hold on dates
    const reservation = await reservationStore.createHold({
      guestName,
      guestEmail,
      guestPhone: guestPhone || "N/A",
      checkIn,
      checkOut,
      guestsCount: guestsCount || 2,
      nights: calculatedNights,
      basePrice: calculatedBasePrice,
      cleaningFee: calculatedCleaningFee,
      securityDeposit: calculatedSecurityDeposit,
      totalAmount: calculatedTotalAmount,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      reservation,
      message: "Dates temporarily locked for 15 minutes. Complete payment to confirm.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create booking hold" },
      { status: 409 }
    );
  }
}
