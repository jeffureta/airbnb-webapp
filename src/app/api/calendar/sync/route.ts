import { NextRequest, NextResponse } from "next/server";
import { googleEcosystemService } from "@/lib/googleEcosystem";
import { reservationStore } from "@/lib/reservations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    const allReservations = await reservationStore.getAll();

    // Standard RFC 5545 iCal stream for Airbnb, Agoda, and Google Calendar subscriptions
    if (format === "ical" || format === "ics") {
      const icalContent = googleEcosystemService.generateICalFeed(allReservations);
      return new Response(icalContent, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'attachment; filename="taal_staycation_bookings.ics"',
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Default JSON status of synchronized events
    const confirmed = allReservations.filter((r) => r.paymentStatus === "PAID");
    return NextResponse.json({
      success: true,
      service: "Google Calendar Two-Way Sync Engine",
      syncedEventsCount: confirmed.length,
      icalUrl: "/api/calendar/sync?format=ical",
      events: confirmed.map((r) => ({
        reservationId: r.id,
        guestName: r.guestName,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: "BUSY",
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Calendar sync failed" },
      { status: 500 }
    );
  }
}
