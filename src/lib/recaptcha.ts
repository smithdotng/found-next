import "server-only";

type VerifyResult = { ok: boolean; skipped?: boolean; score?: number; reason?: string };

/**
 * Verify a reCAPTCHA v3 token server-side against Google's siteverify endpoint.
 *
 * Behaviour is deliberately safe for staged rollout:
 *  - If RECAPTCHA_SECRET_KEY is not set, this is a no-op that returns ok — so the
 *    site keeps working after deploy and before the keys are added on Vercel.
 *  - On a network/verifier error it fails OPEN (returns ok) so a Google outage
 *    never blocks genuine enquiries; only a definite failure or a score below the
 *    threshold is rejected.
 *
 * Set RECAPTCHA_MIN_SCORE to tune strictness (default 0.5; higher = stricter).
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  opts: { action?: string; minScore?: number } = {},
): Promise<VerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true }; // not configured yet
  if (!token) return { ok: false, reason: "missing-token" };

  const minScore = opts.minScore ?? Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      cache: "no-store",
    });
    const data = (await res.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
    };
    if (!data.success) return { ok: false, reason: "failed", score: data.score };
    if (opts.action && data.action && data.action !== opts.action) return { ok: false, reason: "action-mismatch", score: data.score };
    if (typeof data.score === "number" && data.score < minScore) return { ok: false, reason: "low-score", score: data.score };
    return { ok: true, score: data.score };
  } catch (e) {
    console.error("reCAPTCHA verify error:", e);
    return { ok: true, skipped: true, reason: "verify-error" }; // fail open on outage
  }
}
