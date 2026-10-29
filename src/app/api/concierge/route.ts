import { NextRequest, NextResponse } from "next/server";
import { TAGAYTAY_UNIT } from "@/data/unit";
import { checkRateLimit } from "@/lib/rateLimit";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are "Ate Grace", the warm, hospitable, and expert local co-host and AI Guest Relations Concierge for "${TAGAYTAY_UNIT.title}" located at ${TAGAYTAY_UNIT.location}.

Your mission is to welcome potential travelers, answer their questions with 100% accuracy, and make them feel comfortable booking directly.

PROPERTY FACTS & RULES (STRICT ACCURACY REQUIRED):
- Unit View: ${TAGAYTAY_UNIT.view}
- Location & Unit: ${TAGAYTAY_UNIT.condoRules.towerAndFloor}
- Check-in: ${TAGAYTAY_UNIT.condoRules.checkIn}
- Check-out: ${TAGAYTAY_UNIT.condoRules.checkOut}
- Door Lock: ${TAGAYTAY_UNIT.condoRules.smartDoorLock}
- Max Guests: ${TAGAYTAY_UNIT.maxGuests} persons (1 Queen Bed + 1 Premium Sofa Bed)
- Swimming Pool Fees:
  * Regular Days: ${TAGAYTAY_UNIT.condoRules.poolFeeRegular}
  * Holidays/Peak: ${TAGAYTAY_UNIT.condoRules.poolFeeHoliday}
  * Pool Hours: ${TAGAYTAY_UNIT.condoRules.poolHours} (Closed on Mondays for cleaning!)
- Parking Fee: ${TAGAYTAY_UNIT.condoRules.parkingFee}
- WiFi: ${TAGAYTAY_UNIT.condoRules.wifiDetails}
- Cooking Policy: ${TAGAYTAY_UNIT.condoRules.cookingPolicy}
- Smoking Policy: ${TAGAYTAY_UNIT.condoRules.smokingPolicy}
- Garbage Disposal: ${TAGAYTAY_UNIT.condoRules.garbageDisposal}
- Balcony Quirk: ${TAGAYTAY_UNIT.condoRules.balconyQuirk}
- Pet Policy: ${TAGAYTAY_UNIT.condoRules.petPolicy}
- Quiet Hours: ${TAGAYTAY_UNIT.condoRules.quietHours}
- Climate Advice: Tagaytay is cool and breezy (around 20-22°C), especially in mornings and evenings. Remind guests to pack a light jacket or sweater!
- Food & Attractions Nearby:
  * Bulalo: Mahogany Market (5 mins away)
  * Bag of Beans Athena (4 mins away)
  * Sky Ranch (3 mins away)
  * Picnic Grove (12 mins away)
- Direct Booking Benefit: Mention that booking directly here has ZERO platform service markups (saving 15% vs Airbnb) and supports GCash, Maya, and QR Ph!

STYLE & TONE GUIDELINES:
- Friendly, warm Filipino hospitality ("Mabuhay!", "Kumusta!", "Yes po!").
- Fully bilingual in English and Taglish (natural Filipino-English blend).
- Concise, clear, helpful answers with bullet points when sharing fees or hours.
- Never hallucinate condo building rules or promise unapproved discounts. If someone asks for special long-term stay rates or early check-in, explain that standard check-in is 2:00 PM but they can request early check-in subject to room availability on the day.`;

function getDeterministicReply(latestUserMsg: string): string {
  const query = (latestUserMsg || "").toLowerCase();

  if (query.includes("pool") || query.includes("swimming")) {
    return `🏊 **Swimming Pool Details (Wind Residences):**\n- **Regular Days:** ${TAGAYTAY_UNIT.condoRules.poolFeeRegular}\n- **Holidays/Peak:** ${TAGAYTAY_UNIT.condoRules.poolFeeHoliday}\n- **Hours:** ${TAGAYTAY_UNIT.condoRules.poolHours}\n\n*Pool passes are issued at the clubhouse lobby! Proper swimwear is required po.*`;
  }
  if (query.includes("parking") || query.includes("car")) {
    return `🚗 **Parking Information:**\n- **Fee:** ${TAGAYTAY_UNIT.condoRules.parkingFee}\n- Paid directly to the building admin cashier at the parking building. Slots are safe and secure with 24/7 roving guards!`;
  }
  if (query.includes("check in") || query.includes("check out") || query.includes("door") || query.includes("pin") || query.includes("lock")) {
    return `🔑 **Check-In & Access Details:**\n- **Check-in:** ${TAGAYTAY_UNIT.condoRules.checkIn}\n- **Check-out:** ${TAGAYTAY_UNIT.condoRules.checkOut}\n- **Door Lock:** Digital keyless keypad! Your personal 4-digit PIN will be sent 2 hours before check-in.`;
  }
  if (query.includes("cook") || query.includes("cooking") || query.includes("smoke") || query.includes("smoking")) {
    return `🍳 **Cooking & Smoking Policies:**\n- **Cooking:** ${TAGAYTAY_UNIT.condoRules.cookingPolicy}\n- **Smoking:** ${TAGAYTAY_UNIT.condoRules.smokingPolicy}`;
  }
  if (query.includes("wifi") || query.includes("internet")) {
    return `📶 **WiFi & Connectivity:**\n- **Speed:** 100 Mbps High-Speed Fiber\n- **Network:** ${TAGAYTAY_UNIT.condoRules.wifiDetails}`;
  }
  if (query.includes("weather") || query.includes("climate") || query.includes("pack")) {
    return `🌬️ **Tagaytay Weather Tip:**\nTagaytay is refreshingly cool (around 21-22°C), especially during evenings and early mornings with the mountain breeze over the Taal ridge! Make sure to bring a light jacket or cozy cardigan po.`;
  }
  if (query.includes("bulalo") || query.includes("food") || query.includes("restaurant") || query.includes("attractions")) {
    return `🍲 **Recommended Spots Nearby:**\n- **Mahogany Market:** Authentic piping-hot bulalo & fresh sweet pineapples (5 mins away)\n- **Bag of Beans Athena:** Rustic cafe & warm pastries (4 mins away)\n- **Sky Ranch:** Ferris wheel & amusement park (3 mins away)\n\nAll are very accessible from our building!`;
  }
  if (query.includes("gcash") || query.includes("pay") || query.includes("booking") || query.includes("discount")) {
    return `💳 **Direct Booking Perks:**\nWhen you book directly on this site, you save ~15% on Airbnb service fees! We support **GCash, Maya, QR Ph, and credit/debit cards** with instant confirmation.`;
  }
  if (query.includes("pet") || query.includes("dog") || query.includes("cat")) {
    return `🐾 **Pet Policy:**\n${TAGAYTAY_UNIT.condoRules.petPolicy}. To ensure comfort and building compliance for all guests, pets are strictly not permitted in the tower.`;
  }
  if (query.includes("balcony") || query.includes("view")) {
    return `🌅 **Balcony & View:**\nEnjoy direct 180° panoramic views of Taal Lake & Volcano! Please note: ${TAGAYTAY_UNIT.condoRules.balconyQuirk}`;
  }
  if (query.includes("quiet") || query.includes("noise") || query.includes("party")) {
    return `🤫 **Quiet Hours:**\nQuiet hours are observed from **${TAGAYTAY_UNIT.condoRules.quietHours}**. Loud music and parties are not allowed to maintain a peaceful retreat.`;
  }

  return "Mabuhay! I'm Ate Grace, your Tagaytay staycation co-host. How can I help you plan your getaway today?";
}

export async function POST(req: NextRequest) {
  try {
    // 1. IP extraction and Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateLimit = checkRateLimit(`concierge_${ip}`, 10, 60000); // 10 requests / min per IP

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request" }, { status: 400 });
    }

    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // 2. Payload sanitization and truncation (prevent denial-of-wallet / prompt injection token bloat)
    const sanitizedMessages: Message[] = messages
      .slice(-6) // keep only last 6 messages
      .filter((m) => m && typeof m.content === "string")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, 500).trim(), // max 500 characters per message
      }));

    const latestUserMsg = sanitizedMessages[sanitizedMessages.length - 1]?.content || "";

    // If rate limit exceeded, return deterministic rule-based reply with 429 warning header
    if (!rateLimit.success) {
      const fallbackReply = getDeterministicReply(latestUserMsg);
      return NextResponse.json(
        {
          message: {
            role: "assistant",
            content: `${fallbackReply}\n\n*(Notice: Chat rate limit reached. Serving instant local co-host answers.)*`,
          },
          rateLimited: true,
        },
        {
          headers: {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.reset),
          },
        }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback if API key is not configured
    if (!apiKey) {
      return NextResponse.json({
        message: {
          role: "assistant",
          content: getDeterministicReply(latestUserMsg),
        },
      });
    }

    // 3. Call Gemini 3.8 Flash endpoint with fallback
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: sanitizedMessages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const assistantContent =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Sorry po, could you repeat that? I'm here to help with any staycation questions!";

        return NextResponse.json({
          message: {
            role: "assistant",
            content: assistantContent,
          },
        });
      } else {
        const errBody = await response.text();
        console.error(`[GEMINI API ERROR] Status ${response.status}:`, errBody);
      }
    } catch (llmErr) {
      console.error("[GEMINI API FETCH ERROR]", llmErr);
    }

    // Graceful fallback to deterministic local response if LLM API call fails
    return NextResponse.json({
      message: {
        role: "assistant",
        content: getDeterministicReply(latestUserMsg),
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
