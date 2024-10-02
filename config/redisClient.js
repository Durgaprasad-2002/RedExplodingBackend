const Redis = require("ioredis");

const redis = new Redis({
  host: "redis-17852.c17.us-east-1-4.ec2.redns.redis-cloud.com",
  port: 17852,
  password: "SMHexJdQlZqwfDNKfgUe3bXUMrrF933Z",
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  connectTimeout: 20000,
});

redis.on("connect", () => {
  console.log("Connected to Redis!");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = redis;
