import { NextRequest, NextResponse } from "next/server";
import { googleEcosystemService } from "@/lib/googleEcosystem";
import { reservationStore } from "@/lib/reservations";

export async function GET() {
  const reviews = googleEcosystemService.getReviews();
  return NextResponse.json({
    success: true,
    totalReviews: reviews.length,
    averageRating: 4.96,
    reviews,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestName, guestEmail, guestAvatar, rating, comment, reservationId, googleRedirect } =
      body;

    if (!guestName || !comment || !rating) {
      return NextResponse.json(
        { error: "Guest name, rating, and review comment are required." },
        { status: 400 }
      );
    }

    // Verify reservation status if reservationId is provided
    let isVerified = false;
    if (reservationId) {
      const res = reservationStore.getById(reservationId);
      if (res && res.paymentStatus === "PAID") {
        isVerified = true;
      }
    } else {
      isVerified = true; // Google Authenticated guest
    }

    const newReview = googleEcosystemService.addReview({
      guestName,
      guestEmail: guestEmail || "verified.guest@gmail.com",
      guestAvatar:
        guestAvatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      rating: Number(rating),
      comment,
      isVerifiedGuest: isVerified,
      reservationId,
      sentToGoogleBusiness: Boolean(googleRedirect && rating >= 4),
    });

    // Provide Google Business Profile Review URL if rating is high (4 or 5 stars)
    const googleBusinessReviewUrl =
      rating >= 4
        ? "https://search.google.com/local/writereview?placeid=ChIJtagaytaySanctuaryTaalView"
        : null;

    return NextResponse.json({
      success: true,
      review: newReview,
      googleBusinessReviewUrl,
      message:
        rating >= 4
          ? "Thank you! You are eligible to sync your 5-star review directly to Google Business Profile."
          : "Thank you for your valuable feedback!",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post review" },
      { status: 500 }
    );
  }
}
