"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  Wifi,
  Tv,
  CheckCircle2,
  Calendar,
  Users,
  ArrowRight,
  ShieldCheck,
  Star,
  Thermometer,
  Coffee,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronRight,
  Share2,
} from "lucide-react";

export default function EscapeCampaignPage() {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const stories = [
    {
      id: "frame-1",
      tag: "THE ESCAPE",
      headline: "Tired of 33°C Manila Heat & Weekend Gridlock?",
      subtext:
        "Trade the traffic for a 23.9°C cool mountain breeze and a 180° unobstructed view of Taal Lake in just 90 minutes.",
      image: "/campaign/tagaytay_story_ad.jpg",
      badge: "LIVE: 23.9°C Cool Ridge Mist",
      cta: "Check Available Dates",
    },
    {
      id: "frame-2",
      tag: "WORK & UNWIND",
      headline: "100 Mbps Dedicated Fiber + Zero Hidden Fees",
      subtext:
        "Zoom-approved high-speed WiFi on the ridge balcony, complimentary Netflix 4K, and transparent ₱2,800/night all-in rates.",
      image: "/campaign/tagaytay_landing_hero.jpg",
      badge: "4.96 ★ Superhost Verified",
      cta: "View Suite Amenities",
    },
    {
      id: "frame-3",
      tag: "INSTANT CONFIRMATION",
      headline: "Smart Keyless Entry & Instant Gate Clearance",
      subtext:
        "No waiting around for condo security. Secure GCash & Maya direct booking with automated guest clearance passes straight to your phone.",
      image: "/campaign/tagaytay_story_ad.jpg",
      badge: "Limited Weekend Slots",
      cta: "Claim Weekend Promo (₱2,800)",
    },
  ];

  // Story autoplay loop with progress bar
  useEffect(() => {
    if (isPaused) return;

    const interval = 80; // updates every 80ms
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStoryIndex((curr) => (curr + 1) % stories.length);
          return 0;
        }
        return prev + 1.6;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, activeStoryIndex, stories.length]);

  const handleNextStory = () => {
    setProgress(0);
    setActiveStoryIndex((prev) => (prev + 1) % stories.length);
  };

  const handlePrevStory = () => {
    setProgress(0);
    setActiveStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const copyCampaignLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-24">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 px-4 py-2 text-center text-xs sm:text-sm font-medium tracking-wide flex items-center justify-center gap-2 border-b border-emerald-700/50">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          <strong>Live Ridge Update:</strong> 23.9°C Cool Overcast &amp; Breezy in Tagaytay. Direct bookings save 15% today!
        </span>
      </div>

      {/* Campaign Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-900/30">
            T
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition">
              The Taal Viewpoint Sanctuary
            </span>
            <span className="block text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
              Escape to the Ridge Campaign
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={copyCampaignLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copiedLink ? "Link Copied!" : "Share Promo"}
          </button>
          <Link
            href="/#booking-section"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20"
          >
            Book Direct ₱2,800
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & Hooks */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              SPECIAL METRO MANILA GETAWAY PACK
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Wake up above the clouds.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                180° Panoramic Taal View.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Escape the 33°C Manila heat in just 90 minutes. Relax in a bespoke corner suite featuring uninterrupted volcano sunrises, 100 Mbps fiber Wi-Fi, Netflix on 50” Smart TV, and zero hidden cleaning markups.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 py-2 max-w-xl">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">23.9°C</div>
                <div className="text-[11px] text-slate-400 font-medium">Ridge Climate</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-cyan-400">100 Mbps</div>
                <div className="text-[11px] text-slate-400 font-medium">Dedicated Fiber</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-amber-400">4.96 ★</div>
                <div className="text-[11px] text-slate-400 font-medium">128 Reviews</div>
              </div>
            </div>

            {/* Call to Actions & Trust Signals */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/#booking-section"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-7 py-4 rounded-2xl text-base shadow-xl shadow-emerald-500/25 transition transform active:scale-95"
              >
                <span>Reserve Weekend Stay — ₱2,800/night</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#story-section"
                className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                Preview Instagram Story
              </a>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> GCash &amp; Maya Accepted
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Keyless Self Check-In
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual with Real Photography Anchor */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">
              <div className="aspect-[16/10] sm:aspect-[4/3] relative w-full overflow-hidden">
                <Image
                  src="/campaign/tagaytay_landing_hero.jpg"
                  alt="Tagaytay balcony with morning coffee overlooking Taal Volcano at sunrise"
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              </div>

              {/* Float Weather & Tag Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-xs font-semibold text-slate-200 shadow-lg">
                <Thermometer className="w-3.5 h-3.5 text-emerald-400" />
                Tagaytay Ridge • 23.9°C Cool Breeze
              </div>

              {/* Bottom Card Caption */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">Tower 3 Corner Suite</div>
                  <div className="text-slate-400 text-xs">Direct 180° Taal Lake Balcony</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-extrabold text-sm">₱2,800/night</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">Direct Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Micro-Animated Instagram Story Section */}
      <section id="story-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
            SOCIAL AD MATERIALS PACK
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Interactive Instagram Story Campaign
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Engineered for high social click-throughs. Experience the animated 9:16 vertical story ad sequence below with auto-advancing slides and micro-interactions.
          </p>
        </div>

        {/* 9:16 Vertical Story Mockup Device Frame */}
        <div className="flex justify-center">
          <div className="w-full max-w-[360px] sm:max-w-[380px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
            {/* Story Device Container */}
            <div
              className="relative aspect-[9/16] w-full rounded-[32px] overflow-hidden bg-black select-none group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Story Background Visual */}
              <Image
                src={stories[activeStoryIndex].image}
                alt={stories[activeStoryIndex].headline}
                fill
                className="object-cover transition-transform duration-1000 ease-out"
                priority
              />

              {/* Ambient Cinematic Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

              {/* Progress Bars at Top */}
              <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
                {stories.map((story, idx) => (
                  <div
                    key={story.id}
                    onClick={() => {
                      setActiveStoryIndex(idx);
                      setProgress(0);
                    }}
                    className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                  >
                    <div
                      className="h-full bg-white transition-all duration-75"
                      style={{
                        width:
                          idx < activeStoryIndex
                            ? "100%"
                            : idx === activeStoryIndex
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Top Bar (Avatar & Pause Status) */}
              <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs text-slate-950">
                    T
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none">taalviewpoint.ph</span>
                    <span className="text-[9px] text-white/70">Sponsored • Tagaytay</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1 rounded-full bg-black/40 text-white/80 hover:text-white backdrop-blur-sm"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Interactive Left/Right Tap Zones for Story Navigation */}
              <div
                className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer"
                onClick={handlePrevStory}
                title="Tap to go back"
              />
              <div
                className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer"
                onClick={handleNextStory}
                title="Tap to advance"
              />

              {/* Story Middle Badge */}
              <div className="absolute top-20 left-4 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[11px] font-extrabold shadow-lg backdrop-blur-sm">
                  {stories[activeStoryIndex].badge}
                </span>
              </div>

              {/* Story Bottom Content & CTA */}
              <div className="absolute bottom-6 left-4 right-4 z-20 space-y-3">
                <div className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                  {stories[activeStoryIndex].tag}
                </div>
                <h3 className="text-xl font-extrabold text-white leading-snug drop-shadow-md">
                  {stories[activeStoryIndex].headline}
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed drop-shadow">
                  {stories[activeStoryIndex].subtext}
                </p>

                {/* Animated Up-Swipe CTA */}
                <div className="pt-2">
                  <Link
                    href="/#booking-section"
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs shadow-xl transition transform active:scale-95"
                  >
                    <span>{stories[activeStoryIndex].cta}</span>
                    <ChevronRight className="w-4 h-4 text-emerald-600" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Controls Info */}
            <div className="text-center pt-3 text-[11px] text-slate-400 flex items-center justify-center gap-3">
              <span>👈 Tap left / right to navigate</span>
              <span>•</span>
              <span>Hover to pause</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars: Comparison Matrix (Us vs. Generic Airbnb) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Why Manila Weekenders Choose Direct
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            No surprise add-ons, no slow connections, no stressful check-in lobbies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 flex items-center justify-center text-emerald-400 mb-4">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">100 Mbps Dedicated Fiber</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Never get stuck on laggy shared mobile data. Work remotely without interruption, stream 4K movies, or hop on Zoom calls right from the balcony.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-950 flex items-center justify-center text-teal-400 mb-4">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Unobstructed 180° Ridge View</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Prime high-floor corner positioning at Wind Residences Tower 3. Guaranteed front-row seat to Taal Volcano, surrounding ridgelines, and cool morning mist.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950 flex items-center justify-center text-cyan-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Pre-Cleared Gate Access</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Skip the long lines at administration desks. Your digital guest endorsement is pre-submitted to building security for seamless smart door entry.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Direct CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 sm:p-12 border border-emerald-500/30 text-center relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready for your Tagaytay reset?
            </h2>
            <p className="text-slate-200 text-sm sm:text-base">
              Direct dates start at only ₱2,800/night. Instant GCash &amp; Maya confirmation with pre-registered gate pass.
            </p>
            <div className="pt-2">
              <Link
                href="/#booking-section"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-950 font-extrabold px-8 py-4 rounded-2xl text-base shadow-xl transition transform active:scale-95"
              >
                Book The Taal Viewpoint Sanctuary
                <ArrowRight className="w-4 h-4 text-emerald-600" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
