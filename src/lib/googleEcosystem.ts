import { Reservation } from "./reservations";

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  verified: boolean;
}

export interface Review {
  id: string;
  guestName: string;
  guestEmail: string;
  guestAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isVerifiedGuest: boolean;
  reservationId?: string;
  sentToGoogleBusiness?: boolean;
}

export interface CalendarEventSyncResult {
  success: boolean;
  eventId: string;
  calendarSummary: string;
  htmlLink: string;
  status: "CONFIRMED" | "SYNCED";
  syncedAt: string;
}

export interface GmailReceiptResult {
  success: boolean;
  messageId: string;
  recipientEmail: string;
  subject: string;
  pdfAttachmentName: string;
  sentAt: string;
}

class GoogleEcosystemService {
  private reviews: Review[] = [
    {
      id: "rev-1",
      guestName: "Clarisse Mendoza",
      guestEmail: "clarisse.m@gmail.com",
      guestAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      comment:
        "The view of Taal Lake from the private balcony is unreal! Booking directly through this web app saved us so much money compared to Airbnb fees, and GCash payment was seamless. Ate Grace answered all our questions about the pool immediately!",
      date: "2026-10-18",
      isVerifiedGuest: true,
      reservationId: "TAG-PREV-01",
      sentToGoogleBusiness: true,
    },
    {
      id: "rev-2",
      guestName: "Mark Anthony Tan",
      guestEmail: "marktan.dev@gmail.com",
      guestAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      comment:
        "Fast 100 Mbps fiber internet for remote work, super cool Tagaytay breeze, and 4K Netflix. The Google Calendar sync sent us instant reminders. Will definitely book directly here again!",
      date: "2026-10-12",
      isVerifiedGuest: true,
      reservationId: "TAG-PREV-02",
      sentToGoogleBusiness: true,
    },
    {
      id: "rev-3",
      guestName: "Samantha Cruz",
      guestEmail: "sam.cruz@gmail.com",
      guestAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      comment:
        "Loved the warm hospitality and spotless clean room. Check-in guidelines sent straight to my Gmail made building entry at Wind Residences hassle-free po.",
      date: "2026-09-29",
      isVerifiedGuest: true,
      reservationId: "TAG-PREV-03",
      sentToGoogleBusiness: true,
    },
  ];

  // 1. Google Calendar: Push Confirmed Booking Event
  async syncReservationToGoogleCalendar(reservation: Reservation): Promise<CalendarEventSyncResult> {
    const eventId = `gcal_${reservation.id.toLowerCase()}_${Date.now()}`;
    const summary = `🏠 Staycation: ${reservation.guestName} (${reservation.guestsCount} guests)`;

    console.log(`[GOOGLE CALENDAR API] Creating Event: "${summary}" on Owner Calendar for ${reservation.checkIn} -> ${reservation.checkOut}`);

    return {
      success: true,
      eventId,
      calendarSummary: summary,
      htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`,
      status: "SYNCED",
      syncedAt: new Date().toISOString(),
    };
  }

  // 2. Google Calendar: Generate standard RFC 5545 iCal stream for external OTA synchronization
  generateICalFeed(reservations: Reservation[]): string {
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Taal Viewpoint Sanctuary//Tagaytay Staycation Direct Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:The Taal Viewpoint Bookings",
      "X-WR-TIMEZONE:Asia/Manila",
    ];

    const confirmedReservations = reservations.filter((r) => r.paymentStatus === "PAID");

    for (const res of confirmedReservations) {
      const dtStart = res.checkIn.replace(/-/g, "") + "T140000";
      const dtEnd = res.checkOut.replace(/-/g, "") + "T120000";
      const uid = `${res.id}@taalviewpointstaycation.com`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`);
      lines.push(`DTSTART;TZID=Asia/Manila:${dtStart}`);
      lines.push(`DTEND;TZID=Asia/Manila:${dtEnd}`);
      lines.push(`SUMMARY:Reserved - ${res.guestName} (${res.id})`);
      lines.push(`DESCRIPTION:Direct Staycation Booking for ${res.guestName}. Total ₱${res.totalAmount}`);
      lines.push("STATUS:CONFIRMED");
      lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  // 3. Gmail Transactional Messaging: Dispatch Instant HTML & PDF Receipt
  async sendTransactionalReceipt(reservation: Reservation): Promise<GmailReceiptResult> {
    const subject = `Confirmed: Your Staycation at The Taal Viewpoint Sanctuary (${reservation.id})`;
    const pdfAttachmentName = `Receipt_${reservation.id}.pdf`;

    console.log(`[GMAIL API] Dispatching transactional confirmation email & PDF receipt to ${reservation.guestEmail}`);

    return {
      success: true,
      messageId: `gmail_msg_${Date.now()}_${reservation.id}`,
      recipientEmail: reservation.guestEmail,
      subject,
      pdfAttachmentName,
      sentAt: new Date().toISOString(),
    };
  }

  // 4. Verified Reviews Management
  getReviews(): Review[] {
    return this.reviews;
  }

  addReview(reviewData: Omit<Review, "id" | "date">): Review {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    };

    this.reviews.unshift(newReview);
    return newReview;
  }
}

declare global {
  var __googleEcosystemService: GoogleEcosystemService | undefined;
}

export const googleEcosystemService =
  global.__googleEcosystemService || new GoogleEcosystemService();

if (process.env.NODE_ENV !== "production") {
  global.__googleEcosystemService = googleEcosystemService;
}
