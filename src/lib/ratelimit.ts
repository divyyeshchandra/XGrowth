import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const limit = parseInt(process.env.FREE_TIER_DAILY_LIMIT || "10", 10);

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, "1 d"),
    prefix: "xglowup:free",
  });

  return ratelimit;
}

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limiter = getRatelimit();

  if (!limiter) {
    // No Upstash configured — allow but warn in dev
    return { allowed: true, remaining: 999, limit: 999 };
  }

  const { success, remaining, limit } = await limiter.limit(ip);
  return { allowed: success, remaining, limit };
}
