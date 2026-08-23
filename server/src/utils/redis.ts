import Redis from "ioredis";

let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  console.log("Redis Cache connected.");
}

export const getCache = async (key: string) => {
  if (!redisClient) return null;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key: string, data: any, ttlSeconds: number = 3600) => {
  if (!redisClient) return;
  await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
};

export const deleteCache = async (key: string) => {
  if (!redisClient) return;
  await redisClient.del(key);
};

export default redisClient;
