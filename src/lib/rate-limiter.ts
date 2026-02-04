import { RateLimiterRedis } from 'rate-limiter-flexible';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

async function connectRedis(retries = 5, delay = 2000): Promise<void> {
  while (retries > 0) {
    try {
      await redisClient.connect();
      console.log('✅ Redis connected:', redisUrl);
      return;
    } catch (err: any) {
      retries--;
      console.warn(
        `⚠ Falha ao conectar no Redis (${err.message}). Tentando novamente (${retries} restantes)...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error('❌ Não foi possível conectar no Redis após várias tentativas.');
}

connectRedis();

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 10,     // 10 requisições
  duration: 60,    // Por minuto (10 req/min)
  blockDuration: 60,
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
