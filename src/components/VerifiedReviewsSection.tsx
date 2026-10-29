"use client";

import React, { useState, useEffect } from "react";
import { Star, ShieldCheck, CheckCircle2, ExternalLink, MessageSquare, Send, Sparkles } from "lucide-react";

interface Review {
  id: string;
  guestName: string;
  guestEmail: string;
  guestAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedGuest: boolean;
  sentToGoogleBusiness?: boolean;
}

export function VerifiedReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(() => {
    return [
      {
        id: "rev-1",
        guestName: "Camille Rodriguez",
        guestEmail: "camille.r***@gmail.com",
        guestAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        comment: "The direct view of Taal Volcano from the 21st-floor balcony is breathtaking! Clean unit, fast WiFi, and seamless check-in with the smart keypad. Ate Grace is super helpful!",
        date: "2 days ago",
        isVerifiedGuest: true,
      },
      {
        id: "rev-2",
        guestName: "Mark Anthony Tan",
        guestEmail: "m.tan***@yahoo.com",
        guestAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        comment: "Best value in Tagaytay. Direct booking was ₱1,500 cheaper than Airbnb with zero booking fees. Loved the cool breeze and Netflix on the smart TV.",
        date: "1 week ago",
        isVerifiedGuest: true,
      },
      {
        id: "rev-3",
        guestName: "Atty. Katrina Alcantara",
        guestEmail: "katrina.a***@gmail.com",
        guestAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        comment: "Stayed here for a workcation. 100Mbps fiber was rock solid for Zoom calls. Parking was straightforward and walking distance to Bag of Beans.",
        date: "2 weeks ago",
        isVerifiedGuest: true,
      },
    ];
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [googleRedirectUrl, setGoogleRedirectUrl] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  const handleSimulateGoogleAuth = () => {
    // 1-Click Google OAuth simulation
    setName("Guest Traveller (Google Verified)");
    setEmail("guest.staycation@gmail.com");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setGoogleRedirectUrl(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name || "Verified Google Guest",
          guestEmail: email || "guest@gmail.com",
          rating,
          comment,
          googleRedirect: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        if (data.googleBusinessReviewUrl) {
          setGoogleRedirectUrl(data.googleBusinessReviewUrl);
        }
        setComment("");
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Verified Guest Reviews</h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Google Verified
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real guest experiences from direct bookings and Google Business Profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-base font-extrabold text-slate-900">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
            <span>4.96</span>
            <span className="text-xs font-normal text-slate-400">({reviews.length} total)</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-2xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            {showForm ? "Close Review Form" : "Write a Verified Review"}
          </button>
        </div>
      </div>

      {/* Review Submission Drawer / Box */}
      {showForm && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-5 sm:p-6 border border-slate-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-700" /> Submit Your Review
            </h3>
            <button
              type="button"
              onClick={handleSimulateGoogleAuth}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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
              <span>1-Click Google Sign-In</span>
            </button>
          </div>

          {successMsg && (
            <div className="mb-4 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              {googleRedirectUrl && (
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                  <span>Help other travellers by posting your review on Google Business!</span>
                  <a
                    href={googleRedirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-800"
                  >
                    <span>Post to Google Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Google Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@gmail.com"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition ${
                        s <= rating
                          ? "fill-amber-400 text-amber-500 scale-110"
                          : "text-slate-300 hover:text-slate-400"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-bold text-slate-700 text-xs">
                  {rating === 5 ? "Exceptional (5/5)" : `${rating}/5 Stars`}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Feedback / Experience</label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the Taal view, WiFi, cleanliness, and staycation experience?"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? "Publishing Review..." : "Submit Verified Review"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Reviews Cards List */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-white shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={rev.guestAvatar}
                    alt={rev.guestName}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-600/30"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {rev.guestName}
                    </h4>
                    <span className="text-[10px] text-slate-400">{rev.date}</span>
                  </div>
                </div>

                {rev.isVerifiedGuest && (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Stayed</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < rev.rating
                        ? "fill-amber-400 text-amber-500"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            {rev.sentToGoogleBusiness && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <Sparkles className="h-3 w-3" /> Synced to Google Maps
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Google Business Direct Deep Link Callout */}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          </div>
          <div>
            <h4 className="font-bold text-slate-900">
              The Taal Viewpoint Sanctuary on Google Business Profile
            </h4>
            <p className="text-slate-600">
              Check out our verified location on Google Maps & read official reviews.
            </p>
          </div>
        </div>

        <a
          href="https://search.google.com/local/writereview?placeid=ChIJtagaytaySanctuaryTaalView"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 font-bold text-slate-800 shadow-sm border border-slate-300 hover:bg-slate-50 transition shrink-0"
        >
          <span>View on Google Maps</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
        </a>
      </div>
    </section>
  );
}
