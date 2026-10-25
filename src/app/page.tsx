import React from "react";
import Image from "next/image";
import { TAGAYTAY_UNIT } from "@/data/unit";
import { BookingCard } from "@/components/BookingCard";
import { AiConciergeDrawer } from "@/components/AiConciergeDrawer";
import { VerifiedReviewsSection } from "@/components/VerifiedReviewsSection";
import {
  MapPin,
  Star,
  Users,
  Bed,
  Bath,
  CheckCircle,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Waves,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  MessageCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner */}
      <div className="bg-emerald-900 px-4 py-2.5 text-center text-xs font-medium text-emerald-100">
        ✨ Book directly with the owner — Save 15% on Airbnb fees & enjoy instant GCash/Maya confirmation!
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white font-black shadow-sm">
              T
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base leading-none block">
                The Taal Viewpoint
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block mt-0.5">
                Tagaytay Ridge Staycation
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-emerald-700 transition">Overview</a>
            <a href="#amenities" className="hover:text-emerald-700 transition">Amenities</a>
            <a href="#rules" className="hover:text-emerald-700 transition">House Rules & Pool</a>
            <a href="#location" className="hover:text-emerald-700 transition">Location</a>
            <a href="#reviews" className="hover:text-emerald-700 transition">Verified Reviews</a>
          </nav>


          <div className="flex items-center gap-3">
            <a
              href="#booking-section"
              className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
            >
              Check Availability
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="overview">
        {/* Title Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
                {TAGAYTAY_UNIT.title}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>{TAGAYTAY_UNIT.location}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-emerald-700 font-semibold">{TAGAYTAY_UNIT.view}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-2xl bg-amber-50 px-3 py-1.5 border border-amber-200">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                <span className="font-extrabold text-slate-900 text-sm">{TAGAYTAY_UNIT.rating}</span>
                <span className="text-xs text-slate-500">({TAGAYTAY_UNIT.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden shadow-xl max-h-[500px]">
          {/* Main Hero Image */}
          <div className="relative md:col-span-2 md:row-span-2 group overflow-hidden min-h-[300px]">
            <img
              src={TAGAYTAY_UNIT.images[0].url}
              alt={TAGAYTAY_UNIT.images[0].alt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="inline-block rounded-full bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider mb-1">
                Direct Ridge View
              </span>
              <p className="text-sm font-semibold">{TAGAYTAY_UNIT.images[0].caption}</p>
            </div>
          </div>

          {/* Sub Images */}
          {TAGAYTAY_UNIT.images.slice(1, 5).map((img, idx) => (
            <div key={idx} className="relative group overflow-hidden h-[240px] md:h-auto">
              <img
                src={img.url}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
              <div className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-medium bg-black/40 backdrop-blur-sm p-1 rounded">
                {img.caption}
              </div>
            </div>
          ))}
        </div>

        {/* Property Highlights Badges */}
        <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <Users className="h-5 w-5 text-emerald-700" />
            <div>
              <span className="block text-xs text-slate-500 font-medium">Capacity</span>
              <span className="block text-sm font-bold text-slate-900">Up to {TAGAYTAY_UNIT.maxGuests} Guests</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <Bed className="h-5 w-5 text-emerald-700" />
            <div>
              <span className="block text-xs text-slate-500 font-medium">Beds</span>
              <span className="block text-sm font-bold text-slate-900">1 Queen + 1 Sofa Bed</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <Bath className="h-5 w-5 text-emerald-700" />
            <div>
              <span className="block text-xs text-slate-500 font-medium">Bathroom</span>
              <span className="block text-sm font-bold text-slate-900">1 Hot/Cold Rainfall</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <Wind className="h-5 w-5 text-emerald-700" />
            <div>
              <span className="block text-xs text-slate-500 font-medium">Climate</span>
              <span className="block text-sm font-bold text-slate-900">Cool Ridge Breeze</span>
            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Details, Amenities, Rules */}
          <div className="lg:col-span-2 space-y-10">
            {/* About Section */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">About this Sanctuary</h2>
              <p className="text-base text-slate-600 leading-relaxed">{TAGAYTAY_UNIT.description}</p>
            </section>

            {/* Direct Booking Guarantee Card */}
            <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-700 p-3 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-950">
                    Direct Booking Host Guarantee
                  </h3>
                  <p className="mt-1 text-sm text-emerald-800 leading-relaxed">
                    By booking directly through this platform, you deal directly with the unit owner. No surprise booking service commissions, instant reservation hold, and direct customer assistance with our AI Concierge Ate Grace.
                  </p>
                </div>
              </div>
            </section>

            {/* Amenities Section */}
            <section id="amenities">
              <h2 className="text-xl font-bold text-slate-900 mb-5">What this place offers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TAGAYTAY_UNIT.amenities.flatMap((cat) => cat.items).map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Building Policies & Condo Guidelines */}
            <section id="rules" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Condo Rules, Access & House Guidelines</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Check-In & Digital Access</h3>
                  <p className="text-slate-600"><strong>Check-In:</strong> {TAGAYTAY_UNIT.condoRules.checkIn}</p>
                  <p className="text-slate-600 mt-1"><strong>Check-Out:</strong> {TAGAYTAY_UNIT.condoRules.checkOut}</p>
                  <p className="text-slate-600 mt-1"><strong>Door Lock:</strong> {TAGAYTAY_UNIT.condoRules.smartDoorLock}</p>
                  <p className="text-slate-600 mt-1"><strong>Quiet Hours:</strong> {TAGAYTAY_UNIT.condoRules.quietHours}</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Swimming Pool (Wind Residences)</h3>
                  <p className="text-slate-600"><strong>Regular Days:</strong> {TAGAYTAY_UNIT.condoRules.poolFeeRegular}</p>
                  <p className="text-slate-600 mt-1"><strong>Holidays:</strong> {TAGAYTAY_UNIT.condoRules.poolFeeHoliday}</p>
                  <p className="text-slate-600 mt-1"><strong>Hours:</strong> {TAGAYTAY_UNIT.condoRules.poolHours}</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Parking & Tower Info</h3>
                  <p className="text-slate-600"><strong>Tower & Floor:</strong> {TAGAYTAY_UNIT.condoRules.towerAndFloor}</p>
                  <p className="text-slate-600 mt-1"><strong>Overnight Parking:</strong> {TAGAYTAY_UNIT.condoRules.parkingFee}</p>
                  <p className="text-slate-600 mt-1"><strong>Trash:</strong> {TAGAYTAY_UNIT.condoRules.garbageDisposal}</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">House Rules & Policies</h3>
                  <p className="text-slate-600"><strong>Cooking:</strong> {TAGAYTAY_UNIT.condoRules.cookingPolicy}</p>
                  <p className="text-slate-600 mt-1"><strong>Smoking:</strong> {TAGAYTAY_UNIT.condoRules.smokingPolicy}</p>
                  <p className="text-slate-600 mt-1"><strong>Pets:</strong> {TAGAYTAY_UNIT.condoRules.petPolicy}</p>
                  <p className="text-slate-600 mt-1"><strong>Ridge Breeze:</strong> {TAGAYTAY_UNIT.condoRules.balconyQuirk}</p>
                </div>
              </div>
            </section>

            {/* Local Attractions Section */}
            <section id="location">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Explore Tagaytay Nearby</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TAGAYTAY_UNIT.nearbyAttractions.map((spot, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-sm">{spot.name}</h3>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {spot.distance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{spot.highlight}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Verified Reviews & Google Business Funnel */}
            <VerifiedReviewsSection />
          </div>


          {/* Right Column: Sticky Booking Widget */}
          <div className="lg:col-span-1" id="booking-section">
            <BookingCard />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          <p>© 2026 The Taal Viewpoint Sanctuary. Direct Owner Staycation Operations Engine.</p>
          <p className="mt-1">Wind Residences, Tagaytay City, Cavite, Philippines.</p>
        </div>
      </footer>

      {/* 24/7 AI Concierge Drawer */}
      <AiConciergeDrawer />
    </div>
  );
}
