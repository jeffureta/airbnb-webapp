import { NextRequest, NextResponse } from "next/server";
import { TAGAYTAY_UNIT } from "@/data/unit";

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback deterministic local response engine when API key is not yet set up
      const latestUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let reply = "Mabuhay! I'm Ate Grace, your Tagaytay staycation co-host. How can I help you plan your getaway today?";

      if (latestUserMsg.includes("pool") || latestUserMsg.includes("swimming")) {
        reply = `🏊 **Swimming Pool Details (Wind Residences):**\n- **Regular Days:** ${TAGAYTAY_UNIT.condoRules.poolFeeRegular}\n- **Holidays/Peak:** ${TAGAYTAY_UNIT.condoRules.poolFeeHoliday}\n- **Hours:** ${TAGAYTAY_UNIT.condoRules.poolHours}\n\n*Pool passes are issued at the clubhouse lobby! Proper swimwear is required po.*`;
      } else if (latestUserMsg.includes("parking") || latestUserMsg.includes("car")) {
        reply = `🚗 **Parking Information:**\n- **Fee:** ${TAGAYTAY_UNIT.condoRules.parkingFee}\n- Paid directly to the building admin cashier at the parking building. Slots are safe and secure with 24/7 roving guards!`;
      } else if (latestUserMsg.includes("check in") || latestUserMsg.includes("check out") || latestUserMsg.includes("door") || latestUserMsg.includes("pin") || latestUserMsg.includes("lock")) {
        reply = `🔑 **Check-In & Access Details:**\n- **Check-in:** ${TAGAYTAY_UNIT.condoRules.checkIn}\n- **Check-out:** ${TAGAYTAY_UNIT.condoRules.checkOut}\n- **Door Lock:** Digital keyless keypad! Your personal 4-digit PIN will be sent 2 hours before check-in.`;
      } else if (latestUserMsg.includes("cook") || latestUserMsg.includes("cooking") || latestUserMsg.includes("smoke") || latestUserMsg.includes("smoking")) {
        reply = `🍳 **Cooking & Smoking Policies:**\n- **Cooking:** ${TAGAYTAY_UNIT.condoRules.cookingPolicy}\n- **Smoking:** ${TAGAYTAY_UNIT.condoRules.smokingPolicy}`;
      } else if (latestUserMsg.includes("wifi") || latestUserMsg.includes("internet")) {
        reply = `📶 **WiFi & Connectivity:**\n- **Speed:** 100 Mbps High-Speed Fiber\n- **Network:** ${TAGAYTAY_UNIT.condoRules.wifiDetails}`;
      } else if (latestUserMsg.includes("weather") || latestUserMsg.includes("climate") || latestUserMsg.includes("pack")) {
        reply = `🌬️ **Tagaytay Weather Tip:**\nTagaytay is refreshingly cool (around 21-22°C), especially during evenings and early mornings with the mountain breeze over the Taal ridge! Make sure to bring a light jacket or cozy cardigan po.`;
      } else if (latestUserMsg.includes("bulalo") || latestUserMsg.includes("food") || latestUserMsg.includes("restaurant") || latestUserMsg.includes("attractions")) {
        reply = `🍲 **Recommended Spots Nearby:**\n- **Mahogany Market:** Authentic piping-hot bulalo & fresh sweet pineapples (5 mins away)\n- **Bag of Beans Athena:** Rustic cafe & warm pastries (4 mins away)\n- **Sky Ranch:** Ferris wheel & amusement park (3 mins away)\n\nAll are very accessible from our building!`;
      } else if (latestUserMsg.includes("gcash") || latestUserMsg.includes("pay") || latestUserMsg.includes("booking") || latestUserMsg.includes("discount")) {
        reply = `💳 **Direct Booking Perks:**\nWhen you book directly on this site, you save ~15% on Airbnb service fees! We support **GCash, Maya, QR Ph, and credit/debit cards** with instant confirmation.`;
      }

      return NextResponse.json({
        message: {
          role: "assistant",
          content: reply,
        },
      });
    }

    // Call Gemini 2.5 Flash endpoint (supported stable version)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: messages.map((m: Message) => ({
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
      }
    } catch (llmErr) {
      console.error("[GEMINI API FETCH ERROR]", llmErr);
    }

    // Graceful fallback to deterministic local response if LLM API call encounters an issue
    const latestUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let fallbackReply = "Mabuhay! I'm Ate Grace, your Tagaytay staycation co-host. How can I help you plan your getaway today?";

    if (latestUserMsg.includes("cook") || latestUserMsg.includes("cooking") || latestUserMsg.includes("fish") || latestUserMsg.includes("smoke")) {
      fallbackReply = `🍳 **Cooking & Smoke Policy:**\n- **Cooking:** ${TAGAYTAY_UNIT.condoRules.cookingPolicy}\n- **Smoking:** ${TAGAYTAY_UNIT.condoRules.smokingPolicy}`;
    } else if (latestUserMsg.includes("tower") || latestUserMsg.includes("floor") || latestUserMsg.includes("unit")) {
      fallbackReply = `🏢 **Unit Location:**\nWe are located at ${TAGAYTAY_UNIT.condoRules.towerAndFloor}. Keyless 4-digit PIN is sent 2 hours before check-in po!`;
    } else if (latestUserMsg.includes("pool") || latestUserMsg.includes("swimming")) {
      fallbackReply = `🏊 **Swimming Pool Details (Wind Residences):**\n- **Regular Days:** ${TAGAYTAY_UNIT.condoRules.poolFeeRegular}\n- **Holidays/Peak:** ${TAGAYTAY_UNIT.condoRules.poolFeeHoliday}\n- **Hours:** ${TAGAYTAY_UNIT.condoRules.poolHours}\n\n*Pool passes are issued at the clubhouse lobby! Proper swimwear is required po.*`;
    } else if (latestUserMsg.includes("parking") || latestUserMsg.includes("car")) {
      fallbackReply = `🚗 **Parking Information:**\n- **Fee:** ${TAGAYTAY_UNIT.condoRules.parkingFee}\n- Paid directly to the building admin cashier at the parking building. Safe with 24/7 roving security!`;
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: fallbackReply,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
