export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guestsCount: number;
  nights: number;
  basePrice: number;
  cleaningFee: number;
  securityDeposit: number;
  totalAmount: number;
  paymentMethod: "gcash" | "paymaya" | "qrph" | "card";
  paymentStatus: "PENDING_PAYMENT" | "PAID" | "EXPIRED" | "CANCELLED";
  paymentReferenceId?: string;
  paymongoPaymentIntentId?: string;
  lockedUntil: string; // ISO string, 15 min lock
  createdAt: string;
}

// In-memory reservation store (simulating Supabase/PostgreSQL for instant dev execution)
class ReservationStore {
  private reservations: Map<string, Reservation> = new Map();

  constructor() {
    // Seed sample upcoming booked dates to simulate Google Calendar / active reservations
    const now = new Date();
    const seed1Date = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const seed1Out = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);

    const s1In = seed1Date.toISOString().split("T")[0];
    const s1Out = seed1Out.toISOString().split("T")[0];

    this.reservations.set("seed-res-1", {
      id: "seed-res-1",
      guestName: "Maria Santos",
      guestEmail: "maria.santos@example.com",
      guestPhone: "+639171234567",
      checkIn: s1In,
      checkOut: s1Out,
      guestsCount: 2,
      nights: 2,
      basePrice: 5600,
      cleaningFee: 500,
      securityDeposit: 1000,
      totalAmount: 7100,
      paymentMethod: "gcash",
      paymentStatus: "PAID",
      lockedUntil: new Date(Date.now() + 1000000000).toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  // Get all active blocked date ranges
  getBlockedDates(): { checkIn: string; checkOut: string; status: string }[] {
    const now = new Date();
    const blocks: { checkIn: string; checkOut: string; status: string }[] = [];

    for (const res of this.reservations.values()) {
      // If PAID, always blocked
      if (res.paymentStatus === "PAID") {
        blocks.push({ checkIn: res.checkIn, checkOut: res.checkOut, status: "BOOKED" });
      }
      // If PENDING_PAYMENT and lockedUntil is still valid, temporarily held
      else if (
        res.paymentStatus === "PENDING_PAYMENT" &&
        new Date(res.lockedUntil) > now
      ) {
        blocks.push({ checkIn: res.checkIn, checkOut: res.checkOut, status: "HELD_15MIN" });
      }
    }
    return blocks;
  }

  // Check if dates conflict with existing active reservations
  isAvailable(checkIn: string, checkOut: string): boolean {
    const targetStart = new Date(checkIn).getTime();
    const targetEnd = new Date(checkOut).getTime();
    const now = new Date();

    for (const res of this.reservations.values()) {
      const isLocked =
        res.paymentStatus === "PAID" ||
        (res.paymentStatus === "PENDING_PAYMENT" && new Date(res.lockedUntil) > now);

      if (isLocked) {
        const existingStart = new Date(res.checkIn).getTime();
        const existingEnd = new Date(res.checkOut).getTime();

        // Check date overlap
        if (targetStart < existingEnd && targetEnd > existingStart) {
          return false;
        }
      }
    }
    return true;
  }

  // Create temporary reservation hold (15-minute lock)
  createHold(data: Omit<Reservation, "id" | "lockedUntil" | "createdAt" | "paymentStatus">): Reservation {
    if (!this.isAvailable(data.checkIn, data.checkOut)) {
      throw new Error("Selected dates are no longer available. Please select alternative dates.");
    }

    const id = `TAG-${Date.now().toString().slice(-6)}`;
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock

    const reservation: Reservation = {
      ...data,
      id,
      paymentStatus: "PENDING_PAYMENT",
      lockedUntil,
      createdAt: new Date().toISOString(),
    };

    this.reservations.set(id, reservation);
    return reservation;
  }

  getById(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }

  confirmPayment(id: string, paymentRef: string): Reservation {
    const res = this.reservations.get(id);
    if (!res) throw new Error("Reservation not found");

    res.paymentStatus = "PAID";
    res.paymentReferenceId = paymentRef;
    this.reservations.set(id, res);
    return res;
  }

  getAll(): Reservation[] {
    return Array.from(this.reservations.values());
  }
}

// Global singleton for server runtime
declare global {
  var __reservationStore: ReservationStore | undefined;
}

export const reservationStore = global.__reservationStore || new ReservationStore();
if (process.env.NODE_ENV !== "production") {
  global.__reservationStore = reservationStore;
}
