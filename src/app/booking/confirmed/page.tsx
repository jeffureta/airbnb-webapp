"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Mail, MapPin, Download } from "lucide-react";
import { TAGAYTAY_UNIT } from "@/data/unit";

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Success Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-200">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-8 text-center text-white sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-4 ring-white/30">
              <CheckCircle2 className="h-10 w-10 text-emerald-200" />
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold">
              Staycation Reservation Confirmed!
            </h1>
            <p className="mt-1 text-sm text-emerald-100">
              Maraming salamat! Your direct booking has been locked and confirmed.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-950/40 backdrop-blur-sm px-4 py-1.5 text-xs font-mono font-semibold text-emerald-200">
              Reservation Code: {id || "TAG-CONFIRMED"}
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            {/* Automated Sync Status Callout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-200/80">
                <Calendar className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Google Calendar Synced</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Dates are locked on the owner&apos;s schedule to prevent double bookings.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-200/80">
                <Mail className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Gmail PDF Receipt Sent</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Official receipt & condo building registration forms delivered to inbox.
                  </p>
                </div>
              </div>
            </div>

            {/* Check-In Guidelines */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-700" /> Arrival & Building Guidelines
              </h3>
              <div className="text-xs text-slate-600 space-y-1.5">
                <p>
                  <strong>Location:</strong> {TAGAYTAY_UNIT.location}
                </p>
                <p>
                  <strong>Standard Check-In:</strong> {TAGAYTAY_UNIT.condoRules.checkIn}
                </p>
                <p>
                  <strong>Standard Check-Out:</strong> {TAGAYTAY_UNIT.condoRules.checkOut}
                </p>
                <p>
                  <strong>Swimming Pool passes:</strong> {TAGAYTAY_UNIT.condoRules.poolFeeRegular} (at Clubhouse)
                </p>
                <p>
                  <strong>Overnight Parking:</strong> {TAGAYTAY_UNIT.condoRules.parkingFee} (Admin cashier)
                </p>
              </div>
            </div>

            {/* Google Business Post-Stay Review CTA Callout */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <span>⭐</span>
                <span>Help Support Our Direct Tagaytay Staycation!</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                We take pride in offering premium 5-star hospitality without corporate platform commissions. Please take a moment to review us on our official Google Business Profile:
              </p>
              <div>
                <a
                  href="https://search.google.com/local/writereview?placeid=ChIJtagaytaySanctuaryTaalView"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-amber-300 px-4 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-amber-100/50 transition"
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
                  <span>Leave a Review on Google Maps</span>
                </a>
              </div>
            </div>

            {/* Next Steps CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/"
                className="w-full flex-1 rounded-2xl border border-slate-300 py-3 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Back to Property Page
              </Link>
              <button
                onClick={() => alert("Downloading formatted staycation guest pass & receipt PDF...")}
                className="w-full flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3 text-center text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition"
              >
                <Download className="h-4 w-4" /> Download Guest Pass PDF
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading reservation confirmation...</div>}>
      <BookingConfirmedContent />
    </Suspense>
  );
}
