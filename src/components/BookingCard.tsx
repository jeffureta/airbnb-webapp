"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Users,
  ShieldCheck,
  CreditCard,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { TAGAYTAY_UNIT } from "@/data/unit";

export function BookingCard() {
  const router = useRouter();

  const [checkIn, setCheckIn] = useState<string>("2026-11-14");
  const [checkOut, setCheckOut] = useState<string>("2026-11-16");
  const [guests, setGuests] = useState<number>(2);
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "paymaya" | "qrph" | "card">("gcash");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 2;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diff > 0 ? Math.round(diff) : 1;
  };

  const nights = calculateNights();
  const roomTotal = TAGAYTAY_UNIT.basePrice * nights;
  const cleaningFee = TAGAYTAY_UNIT.cleaningFee;
  const securityDeposit = TAGAYTAY_UNIT.securityDeposit;
  const totalDueNow = roomTotal + cleaningFee + securityDeposit;
  const estimatedAirbnbSavings = Math.round(roomTotal * 0.155);

  const handleStartBooking = () => {
    setErrorMessage(null);
    setShowCheckoutModal(true);
  };

  const handleCompleteHoldAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Step 1: Request 15-minute hold on selected dates
      const holdRes = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestEmail,
          guestPhone,
          checkIn,
          checkOut,
          guestsCount: guests,
          nights,
          basePrice: roomTotal,
          cleaningFee,
          securityDeposit,
          totalAmount: totalDueNow,
          paymentMethod,
        }),
      });

      const holdData = await holdRes.json();
      if (!holdRes.ok) {
        throw new Error(holdData.error || "Selected dates conflict with an existing reservation.");
      }

      const reservationId = holdData.reservation.id;

      // Step 2: Request PayMongo Checkout URL
      const payRes = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          paymentMethod,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error || "Failed to initialize payment gateway.");
      }

      // Redirect to PayMongo / Sandbox checkout URL
      if (payData.checkoutUrl) {
        router.push(payData.checkoutUrl);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="sticky top-24 rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl backdrop-blur-md">
        {/* Pricing Header */}
        <div className="flex items-baseline justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                ₱{TAGAYTAY_UNIT.basePrice.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-slate-500">/ night</span>
            </div>
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Direct Booking Rate • Zero Host Markups
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
            <span className="text-amber-500">★</span>
            <span>{TAGAYTAY_UNIT.rating}</span>
            <span className="text-slate-400 font-normal">({TAGAYTAY_UNIT.reviewCount})</span>
          </div>
        </div>

        {/* Date & Guest Selectors */}
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-2 rounded-2xl border border-slate-200 overflow-hidden divide-x divide-slate-200 focus-within:ring-2 focus-within:ring-emerald-600">
            <div className="p-3 bg-slate-50/50">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                CHECK-IN
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none"
              />
            </div>
            <div className="p-3 bg-slate-50/50">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                CHECK-OUT
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50/50">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              GUESTS
            </label>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-semibold text-slate-900">
                {guests} {guests === 1 ? "Guest" : "Guests"} (Max {TAGAYTAY_UNIT.maxGuests})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(TAGAYTAY_UNIT.maxGuests, g + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          id="direct-checkout-cta"
          onClick={handleStartBooking}
          className="mt-5 w-full rounded-2xl bg-emerald-700 py-3.5 text-center font-bold text-white shadow-lg shadow-emerald-900/25 transition-all hover:bg-emerald-800 hover:shadow-xl focus:ring-4 focus:ring-emerald-300"
        >
          Reserve Direct & Pay via GCash / Maya
        </button>

        <p className="mt-2 text-center text-xs text-slate-500">
          Locks dates instantly for 15 minutes during payment.
        </p>

        {/* Savings Highlight Badge */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200/80">
          <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Direct Booking Benefit:</strong> You save approx. <strong>₱{estimatedAirbnbSavings.toLocaleString()}</strong> in platform fees.
          </span>
        </div>

        {/* Transparent Price Breakdown */}
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>
              ₱{TAGAYTAY_UNIT.basePrice.toLocaleString()} × {nights} nights
            </span>
            <span className="font-semibold text-slate-800">₱{roomTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Cleaning fee (turnover & fresh linens)</span>
            <span className="font-semibold text-slate-800">₱{cleaningFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              Refundable Security Deposit
              <span className="group relative cursor-pointer text-slate-400">
                ⓘ
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden w-44 rounded bg-slate-800 p-1.5 text-[10px] text-white group-hover:block">
                  Refunded via GCash within 24h after check-out inspection.
                </span>
              </span>
            </span>
            <span className="font-semibold text-slate-800">₱{securityDeposit.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
            <span>Total (PHP)</span>
            <span className="text-emerald-700">₱{totalDueNow.toLocaleString()}</span>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Verified Host & Unit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>GCash / Maya / QR Ph</span>
          </div>
        </div>
      </div>

      {/* JIT Checkout Modal (Progressive Disclosure) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Complete Direct Reservation</h3>
                <p className="text-xs text-slate-500">15-minute date lock activated upon submission</p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCompleteHoldAndCheckout} className="mt-5 space-y-4">
              {/* Google 1-Click JIT Sign-In Autofill */}
              <button
                type="button"
                onClick={() => {
                  setGuestName("Juan Dela Cruz");
                  setGuestEmail("juandelacruz@gmail.com");
                  setGuestPhone("09171234567");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Autofill with Google (1-Click JIT)</span>
              </button>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name (As shown on ID)
                </label>

                <input
                  type="text"
                  required
                  placeholder="Juan Dela Cruz"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email (For Gmail Receipt)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="juan@gmail.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mobile / GCash Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0917 123 4567"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              {/* Payment Rail Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Philippine Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "gcash", name: "GCash", badge: "Instant" },
                    { id: "paymaya", name: "Maya", badge: "Instant" },
                    { id: "qrph", name: "QR Ph", badge: "Any Bank" },
                    { id: "card", name: "Credit/Debit", badge: "Visa/MC" },
                  ].map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                        paymentMethod === method.id
                          ? "border-emerald-700 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span>{method.name}</span>
                      <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {method.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Amount Due:</span>
                  <span className="text-emerald-700">₱{totalDueNow.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {nights} nights ({checkIn} to {checkOut}) • {guests} guests
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                id="submit-reservation-btn"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-800 focus:ring-4 focus:ring-emerald-300 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Locking Dates & Connecting...
                  </>
                ) : (
                  `Lock Dates & Proceed to ${paymentMethod.toUpperCase()}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
