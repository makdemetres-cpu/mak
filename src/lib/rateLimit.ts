import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  url && token
    ? new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        prefix: "hydrocore:bookings",
      })
    : null;

let warnedMissingConfig = false;

/**
 * Rate-limits the booking endpoint by IP, 5 submissions per 10 minutes.
 * Without Upstash credentials configured, this no-ops (logs once) rather
 * than failing closed — local/dev environments shouldn't need a Redis
 * instance just to exercise the booking flow, but production must set
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN before launch.
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  if (!ratelimit) {
    if (!warnedMissingConfig) {
      console.warn(
        "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — booking endpoint is NOT rate-limited. Set these before production launch.",
      );
      warnedMissingConfig = true;
    }
    return { success: true };
  }

  const { success } = await ratelimit.limit(identifier);
  return { success };
}
