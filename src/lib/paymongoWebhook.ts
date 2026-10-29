import crypto from "crypto";

/**
 * PayMongo Webhook Signature Verification Utility
 *
 * PayMongo delivers the `paymongo-signature` header in format:
 *   t=<timestamp>,te=<test_signature>,li=<live_signature>
 *
 * Signature calculation:
 *   HMAC-SHA256(key = webhookSecret, data = `${timestamp}.${rawBody}`)
 */
export function verifyPayMongoSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): { isValid: boolean; timestamp?: number; error?: string } {
  if (!signatureHeader) {
    return { isValid: false, error: "Missing paymongo-signature header" };
  }

  if (!webhookSecret) {
    return { isValid: false, error: "Server missing PAYMONGO_WEBHOOK_SECRET configuration" };
  }

  // Parse header parts
  const parts = signatureHeader.split(",").reduce((acc, part) => {
    const [key, val] = part.split("=");
    if (key && val) {
      acc[key.trim()] = val.trim();
    }
    return acc;
  }, {} as Record<string, string>);

  const timestampStr = parts["t"];
  const signature = parts["li"] || parts["te"];

  if (!timestampStr || !signature) {
    return { isValid: false, error: "Malformed paymongo-signature header format" };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { isValid: false, error: "Invalid timestamp in paymongo-signature header" };
  }

  // Tolerance check (reject replay attacks older than 10 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 600) {
    return { isValid: false, timestamp, error: "Webhook timestamp outside 10-minute validity window" };
  }

  try {
    const payloadToSign = `${timestampStr}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadToSign)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");

    if (sigBuf.length !== expBuf.length) {
      return { isValid: false, timestamp, error: "Signature length mismatch" };
    }

    const isValid = crypto.timingSafeEqual(sigBuf, expBuf);
    return { isValid, timestamp, error: isValid ? undefined : "HMAC signature comparison failed" };
  } catch (err: unknown) {
    return {
      isValid: false,
      timestamp,
      error: err instanceof Error ? err.message : "Cryptographic verification exception",
    };
  }
}
