import { NextRequest, NextResponse } from "next/server";
import { parseICalFeed } from "@/lib/icalParser";
import { reservationStore } from "@/lib/reservations";

export async function GET(req: NextRequest) {
  try {
    // 1. Optional authorization for Vercel Cron or secure manual trigger
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const feedUrlParam = searchParams.get("feedUrl");
    const feedUrl = feedUrlParam || process.env.AIRBNB_ICAL_FEED_URL;

    if (!feedUrl) {
      return NextResponse.json({
        success: false,
        message: "No AIRBNB_ICAL_FEED_URL configured. Provide ?feedUrl= or set AIRBNB_ICAL_FEED_URL in env.",
        syncedCount: 0,
      });
    }

    // 2. Fetch external iCal feed (from Airbnb, Agoda, Booking.com)
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TagaytayStaycationBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: HTTP ${response.status} ${response.statusText}`);
    }

    const icalText = await response.text();
    const events = parseICalFeed(icalText, "airbnb");

    // 3. Block calendar dates in store (Supabase or Memory fallback)
    const newBlocksCount = await reservationStore.blockOtaDates(events);

    console.log(
      `[CRON SYNC OTA] Successfully fetched ${events.length} external reservation events. Inserted ${newBlocksCount} new blocks.`
    );

    return NextResponse.json({
      success: true,
      feedUrl,
      totalEventsFound: events.length,
      newBlocksInserted: newBlocksCount,
      events: events.map((e) => ({
        uid: e.uid,
        summary: e.summary,
        checkIn: e.checkIn,
        checkOut: e.checkOut,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw error;
    }
    console.error("[CRON SYNC OTA ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync OTA calendar" },
      { status: 500 }
    );
  }
}
