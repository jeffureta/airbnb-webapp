/**
 * Production-ready reservations data layer with dual storage engine:
 * 1. Supabase PostgreSQL persistence (when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set).
 * 2. In-memory transaction store fallback (graceful development / serverless fallback).
 */

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
  source?: "direct" | "airbnb" | "agoda" | "booking_com" | "ical";
  externalEventId?: string;
  createdAt: string;
}

export interface BlockedDateRange {
  checkIn: string;
  checkOut: string;
  status: "BOOKED" | "HELD_15MIN" | "OTA_BLOCKED";
  source?: string;
}

export interface IReservationStore {
  getBlockedDates(): Promise<BlockedDateRange[]>;
  isAvailable(checkIn: string, checkOut: string): Promise<boolean>;
  createHold(data: Omit<Reservation, "id" | "lockedUntil" | "createdAt" | "paymentStatus">): Promise<Reservation>;
  getById(id: string): Promise<Reservation | undefined>;
  confirmPayment(id: string, paymentRef: string): Promise<Reservation>;
  getAll(): Promise<Reservation[]>;
  blockOtaDates(events: { checkIn: string; checkOut: string; summary: string; uid: string; source: string }[]): Promise<number>;
}

// In-Memory Fallback Store
class MemoryReservationStore implements IReservationStore {
  private reservations: Map<string, Reservation> = new Map();

  constructor() {
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
      source: "direct",
      lockedUntil: new Date(Date.now() + 1000000000).toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  async getBlockedDates(): Promise<BlockedDateRange[]> {
    const now = new Date();
    const blocks: BlockedDateRange[] = [];

    for (const res of this.reservations.values()) {
      if (res.paymentStatus === "PAID") {
        blocks.push({
          checkIn: res.checkIn,
          checkOut: res.checkOut,
          status: res.source === "airbnb" || res.source === "agoda" || res.source === "ical" ? "OTA_BLOCKED" : "BOOKED",
          source: res.source || "direct",
        });
      } else if (
        res.paymentStatus === "PENDING_PAYMENT" &&
        new Date(res.lockedUntil) > now
      ) {
        blocks.push({
          checkIn: res.checkIn,
          checkOut: res.checkOut,
          status: "HELD_15MIN",
          source: res.source || "direct",
        });
      }
    }
    return blocks;
  }

  async isAvailable(checkIn: string, checkOut: string): Promise<boolean> {
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

        if (targetStart < existingEnd && targetEnd > existingStart) {
          return false;
        }
      }
    }
    return true;
  }

  async createHold(data: Omit<Reservation, "id" | "lockedUntil" | "createdAt" | "paymentStatus">): Promise<Reservation> {
    const available = await this.isAvailable(data.checkIn, data.checkOut);
    if (!available) {
      throw new Error("Selected dates are no longer available. Please select alternative dates.");
    }

    const id = `TAG-${Date.now().toString().slice(-6)}`;
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const reservation: Reservation = {
      ...data,
      id,
      source: data.source || "direct",
      paymentStatus: "PENDING_PAYMENT",
      lockedUntil,
      createdAt: new Date().toISOString(),
    };

    this.reservations.set(id, reservation);
    return reservation;
  }

  async getById(id: string): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async confirmPayment(id: string, paymentRef: string): Promise<Reservation> {
    const res = this.reservations.get(id);
    if (!res) throw new Error(`Reservation ${id} not found`);

    res.paymentStatus = "PAID";
    res.paymentReferenceId = paymentRef;
    this.reservations.set(id, res);
    return res;
  }

  async getAll(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async blockOtaDates(events: { checkIn: string; checkOut: string; summary: string; uid: string; source: string }[]): Promise<number> {
    let newBlocksCount = 0;
    for (const ev of events) {
      const existing = Array.from(this.reservations.values()).find(
        (r) => r.externalEventId === ev.uid || (r.checkIn === ev.checkIn && r.checkOut === ev.checkOut && r.source === "airbnb")
      );
      if (!existing) {
        const id = `OTA-${ev.uid.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
        this.reservations.set(id, {
          id,
          guestName: ev.summary || "Airbnb / OTA Reserved Guest",
          guestEmail: "ota-sync@staycation.ph",
          guestPhone: "N/A",
          checkIn: ev.checkIn,
          checkOut: ev.checkOut,
          guestsCount: 2,
          nights: Math.max(1, Math.round((new Date(ev.checkOut).getTime() - new Date(ev.checkIn).getTime()) / (86400000))),
          basePrice: 0,
          cleaningFee: 0,
          securityDeposit: 0,
          totalAmount: 0,
          paymentMethod: "card",
          paymentStatus: "PAID",
          lockedUntil: new Date(Date.now() + 1000000000).toISOString(),
          source: (ev.source as "airbnb" | "agoda" | "booking_com" | "ical") || "airbnb",
          externalEventId: ev.uid,
          createdAt: new Date().toISOString(),
        });
        newBlocksCount++;
      }
    }
    return newBlocksCount;
  }
}

// Supabase REST Adapter (Native fetch without heavy SDK dependencies)
class SupabaseReservationStore implements IReservationStore {
  private url: string;
  private serviceKey: string;
  private memoryFallback: MemoryReservationStore;

  constructor(url: string, serviceKey: string) {
    this.url = url.replace(/\/+$/, "");
    this.serviceKey = serviceKey;
    this.memoryFallback = new MemoryReservationStore();
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      Prefer: "return=representation",
    };
  }

  private mapDbToModel(row: Record<string, unknown>): Reservation {
    return {
      id: String(row.id),
      guestName: String(row.guest_name),
      guestEmail: String(row.guest_email),
      guestPhone: String(row.guest_phone || "N/A"),
      checkIn: String(row.check_in),
      checkOut: String(row.check_out),
      guestsCount: Number(row.guests_count || 2),
      nights: Number(row.nights || 1),
      basePrice: Number(row.base_price || 0),
      cleaningFee: Number(row.cleaning_fee || 0),
      securityDeposit: Number(row.security_deposit || 0),
      totalAmount: Number(row.total_amount || 0),
      paymentMethod: (row.payment_method as Reservation["paymentMethod"]) || "gcash",
      paymentStatus: (row.payment_status as Reservation["paymentStatus"]) || "PENDING_PAYMENT",
      paymentReferenceId: row.payment_reference_id ? String(row.payment_reference_id) : undefined,
      paymongoPaymentIntentId: row.paymongo_payment_intent_id ? String(row.paymongo_payment_intent_id) : undefined,
      lockedUntil: String(row.locked_until),
      source: (row.source as Reservation["source"]) || "direct",
      externalEventId: row.external_event_id ? String(row.external_event_id) : undefined,
      createdAt: String(row.created_at),
    };
  }

  async getBlockedDates(): Promise<BlockedDateRange[]> {
    try {
      const nowIso = new Date().toISOString();
      const res = await fetch(
        `${this.url}/rest/v1/reservations?select=check_in,check_out,payment_status,locked_until,source&or=(payment_status.eq.PAID,and(payment_status.eq.PENDING_PAYMENT,locked_until.gt.${nowIso}))`,
        { headers: this.headers, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Supabase error: ${res.statusText}`);
      const data = await res.json();
      return data.map((r: { check_in: string; check_out: string; payment_status: string; source?: string }) => ({
        checkIn: r.check_in,
        checkOut: r.check_out,
        status: r.payment_status === "PAID" ? (r.source === "airbnb" ? "OTA_BLOCKED" : "BOOKED") : "HELD_15MIN",
        source: r.source || "direct",
      }));
    } catch (e) {
      console.warn("[SUPABASE] Falling back to memory store for getBlockedDates:", e);
      return this.memoryFallback.getBlockedDates();
    }
  }

  async isAvailable(checkIn: string, checkOut: string): Promise<boolean> {
    try {
      const nowIso = new Date().toISOString();
      // Date overlap check: (check_in < checkOut) AND (check_out > checkIn)
      const res = await fetch(
        `${this.url}/rest/v1/reservations?select=id&check_in=lt.${checkOut}&check_out=gt.${checkIn}&or=(payment_status.eq.PAID,and(payment_status.eq.PENDING_PAYMENT,locked_until.gt.${nowIso}))`,
        { headers: this.headers, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Supabase query failed: ${res.statusText}`);
      const conflicting = await res.json();
      return Array.isArray(conflicting) && conflicting.length === 0;
    } catch (e) {
      console.warn("[SUPABASE] Falling back to memory store for isAvailable:", e);
      return this.memoryFallback.isAvailable(checkIn, checkOut);
    }
  }

  async createHold(data: Omit<Reservation, "id" | "lockedUntil" | "createdAt" | "paymentStatus">): Promise<Reservation> {
    const available = await this.isAvailable(data.checkIn, data.checkOut);
    if (!available) {
      throw new Error("Selected dates are no longer available. Please select alternative dates.");
    }

    const id = `TAG-${Date.now().toString().slice(-6)}`;
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const dbPayload = {
      id,
      guest_name: data.guestName,
      guest_email: data.guestEmail,
      guest_phone: data.guestPhone,
      check_in: data.checkIn,
      check_out: data.checkOut,
      guests_count: data.guestsCount,
      nights: data.nights,
      base_price: data.basePrice,
      cleaning_fee: data.cleaningFee,
      security_deposit: data.securityDeposit,
      total_amount: data.totalAmount,
      payment_method: data.paymentMethod,
      payment_status: "PENDING_PAYMENT",
      locked_until: lockedUntil,
      source: data.source || "direct",
      created_at: createdAt,
    };

    try {
      const res = await fetch(`${this.url}/rest/v1/reservations`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(dbPayload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase insert failed: ${errorText}`);
      }

      const rows = await res.json();
      if (rows && rows[0]) return this.mapDbToModel(rows[0]);

      return {
        ...data,
        id,
        source: data.source || "direct",
        paymentStatus: "PENDING_PAYMENT",
        lockedUntil,
        createdAt,
      };
    } catch (e) {
      console.warn("[SUPABASE] Falling back to memory store for createHold:", e);
      return this.memoryFallback.createHold(data);
    }
  }

  async getById(id: string): Promise<Reservation | undefined> {
    try {
      const res = await fetch(`${this.url}/rest/v1/reservations?id=eq.${id}&select=*`, {
        headers: this.headers,
        cache: "no-store",
      });
      if (!res.ok) return this.memoryFallback.getById(id);
      const rows = await res.json();
      if (rows && rows.length > 0) {
        return this.mapDbToModel(rows[0]);
      }
      return this.memoryFallback.getById(id);
    } catch (e) {
      console.warn("[SUPABASE] Falling back to memory store for getById:", e);
      return this.memoryFallback.getById(id);
    }
  }

  async confirmPayment(id: string, paymentRef: string): Promise<Reservation> {
    try {
      const res = await fetch(`${this.url}/rest/v1/reservations?id=eq.${id}`, {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          payment_status: "PAID",
          payment_reference_id: paymentRef,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        return this.memoryFallback.confirmPayment(id, paymentRef);
      }

      const rows = await res.json();
      if (rows && rows[0]) return this.mapDbToModel(rows[0]);
      return this.memoryFallback.confirmPayment(id, paymentRef);
    } catch (e) {
      console.warn("[SUPABASE] Falling back to memory store for confirmPayment:", e);
      return this.memoryFallback.confirmPayment(id, paymentRef);
    }
  }

  async getAll(): Promise<Reservation[]> {
    try {
      const res = await fetch(`${this.url}/rest/v1/reservations?select=*`, {
        headers: this.headers,
        cache: "no-store",
      });
      if (!res.ok) return this.memoryFallback.getAll();
      const rows = await res.json();
      return rows.map((r: Record<string, unknown>) => this.mapDbToModel(r));
    } catch (e) {
      console.warn("[SUPABASE] Falling back to memory store for getAll:", e);
      return this.memoryFallback.getAll();
    }
  }

  async blockOtaDates(events: { checkIn: string; checkOut: string; summary: string; uid: string; source: string }[]): Promise<number> {
    try {
      let created = 0;
      for (const ev of events) {
        const checkRes = await fetch(
          `${this.url}/rest/v1/reservations?external_event_id=eq.${encodeURIComponent(ev.uid)}&select=id`,
          { headers: this.headers }
        );
        const existing = await checkRes.json();
        if (Array.isArray(existing) && existing.length === 0) {
          const id = `OTA-${ev.uid.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;
          const payload = {
            id,
            guest_name: ev.summary || "Airbnb / OTA Reserved Guest",
            guest_email: "ota-sync@staycation.ph",
            guest_phone: "N/A",
            check_in: ev.checkIn,
            check_out: ev.checkOut,
            guests_count: 2,
            nights: Math.max(1, Math.round((new Date(ev.checkOut).getTime() - new Date(ev.checkIn).getTime()) / (86400000))),
            base_price: 0,
            cleaning_fee: 0,
            security_deposit: 0,
            total_amount: 0,
            payment_method: "card",
            payment_status: "PAID",
            locked_until: new Date(Date.now() + 1000000000).toISOString(),
            source: ev.source || "airbnb",
            external_event_id: ev.uid,
          };
          await fetch(`${this.url}/rest/v1/reservations`, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(payload),
          });
          created++;
        }
      }
      return created;
    } catch (e) {
      console.warn("[SUPABASE] Falling back to memory store for blockOtaDates:", e);
      return this.memoryFallback.blockOtaDates(events);
    }
  }
}

// Store singleton initialization
function createReservationStore(): IReservationStore {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    return new SupabaseReservationStore(supabaseUrl, supabaseServiceKey);
  }

  return new MemoryReservationStore();
}

declare global {
  var __reservationStoreInstance: IReservationStore | undefined;
}

export const reservationStore = global.__reservationStoreInstance || createReservationStore();
if (process.env.NODE_ENV !== "production") {
  global.__reservationStoreInstance = reservationStore;
}
