import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

export const redis = createClient({
  url: redisUrl,
});

redis.on("error", (err) => {
  console.error("Redis Client Error", err);
});

// call this before starting the server
export async function initRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("Connected to Redis");
  }
}
