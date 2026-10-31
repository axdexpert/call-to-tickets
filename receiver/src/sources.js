import { createHmac, timingSafeEqual } from "node:crypto";

export function signatureMatches(rawBody, secret, signature) {
  if (!secret || !signature) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const given = Buffer.from(signature.replace(/^sha256=/, ""));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const sources = {
  fireflies: {
    secretEnv: "FIREFLIES_WEBHOOK_SECRET",
    signatureHeader: "x-hub-signature",
    toCall(payload) {
      if (payload.eventType && payload.eventType !== "Transcription completed") return null;
      if (!payload.meetingId) return null;
      return {
        source: "fireflies",
        id: payload.meetingId,
        url: `https://app.fireflies.ai/view/${payload.meetingId}`,
      };
    },
  },

  // Any other tool, or your own script: sign the JSON body with GENERIC_WEBHOOK_SECRET.
  generic: {
    secretEnv: "GENERIC_WEBHOOK_SECRET",
    signatureHeader: "x-signature",
    toCall(payload) {
      if (!payload.source || !(payload.id || payload.transcript)) return null;
      const { source, id, url, title, transcript } = payload;
      return { source, id, url, title, transcript };
    },
  },
};
