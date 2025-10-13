import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'redis';

export const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 1,
  duration: 1,
});

export class RateLimiter {
  static async consume(key: string): Promise<void> {
    try {
      await rateLimiter.consume(key);
    } catch {
      throw new Error('Rate limit exceeded');
    }
  }
}