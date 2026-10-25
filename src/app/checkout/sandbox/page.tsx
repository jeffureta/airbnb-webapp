"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles } from "lucide-react";

function SandboxCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");
  const method = searchParams.get("method") || "gcash";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phone, setPhone] = useState("09171234567");

  const methodLabels: Record<string, { name: string; color: string; desc: string }> = {
    gcash: {
      name: "GCash Philippines",
      color: "bg-blue-600 hover:bg-blue-700",
      desc: "Simulate 1-click GCash mobile MPIN authorization",
    },
    paymaya: {
      name: "Maya (PayMaya)",
      color: "bg-emerald-600 hover:bg-emerald-700",
      desc: "Simulate Maya digital bank payment authorization",
    },
    qrph: {
      name: "QR Ph Standard",
      color: "bg-slate-900 hover:bg-black",
      desc: "Simulate scanning Bangko Sentral ng Pilipinas QR Ph",
    },
    card: {
      name: "Visa / Mastercard",
      color: "bg-indigo-600 hover:bg-indigo-700",
      desc: "Simulate 3D-Secure credit/debit card checkout",
    },
  };

  const currentMethod = methodLabels[method] || methodLabels.gcash;

  const handleSimulatePayment = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Trigger the webhook endpoint directly to simulate PayMongo callback
      const res = await fetch("/api/v1/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment.paid",
          reservationId: id,
          paymentReference: `PAY-SIM-${Date.now()}`,
        }),
      });

      if (!res.ok) throw new Error("Payment simulation failed");

      setSuccess(true);
      setTimeout(() => {
        router.push(`/booking/confirmed?id=${id}`);
      }, 1500);
    } catch (err) {
      alert("Error processing payment simulation");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white font-extrabold text-xl shadow-lg">
            T
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900">
          PayMongo Domestic Checkout Sandbox
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Simulating secure Philippine payment gateway rail: <strong>{currentMethod.name}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200/80 sm:px-10">
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-semibold">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Reservation Lock Active</span>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Reference: <strong className="font-mono">{id || "TAG-XXXXXX"}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {currentMethod.name} Mobile Number / Account
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 font-medium focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <p className="mt-1 text-[11px] text-slate-400">{currentMethod.desc}</p>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 p-3 bg-slate-50 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Direct Merchant:</span>
                <span className="font-bold text-slate-800">The Taal Viewpoint Staycation</span>
              </div>
              <div className="flex justify-between">
                <span>Security Level:</span>
                <span className="font-medium text-emerald-700">PCI-DSS Level 1 Compliant</span>
              </div>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={loading || success}
              id="confirm-sandbox-payment-btn"
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-4 text-sm font-bold text-white shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-emerald-300 ${currentMethod.color} disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Authorizing Payment...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Payment Authorized! Redirecting...
                </>
              ) : (
                `Authorize ₱ Pay with ${currentMethod.name}`
              )}
            </button>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Encrypted 256-bit SSL Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SandboxCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading checkout session...</div>}>
      <SandboxCheckoutContent />
    </Suspense>
  );
}
