// const redis = require("redis");

// const client = redis.createClient({
//   password: "SMHexJdQlZqwfDNKfgUe3bXUMrrF933Z",
//   legacyMode: false,
//   socket: {
//     host: "redis-17852.c17.us-east-1-4.ec2.redns.redis-cloud.com",
//     port: 17852,

//     connectTimeout: 20000, // Set connection timeout to 20 seconds
//   },
// });

// client.connect();

// client.on("connect", () => {
//   console.log("Connected to Redis Cloud");
// });

// client.on("error", (err) => {
//   console.log("Redis Error: ", err);
// });

const Redis = require("ioredis");

const redis = new Redis({
  host: "redis-17852.c17.us-east-1-4.ec2.redns.redis-cloud.com",
  port: 17852,
  password: "SMHexJdQlZqwfDNKfgUe3bXUMrrF933Z",
  tls: process.env.REDIS_TLS === "true" ? {} : undefined, // Enable TLS if needed
  connectTimeout: 20000, // Extend the connection timeout
});

redis.on("connect", () => {
  console.log("Connected to Redis!");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = redis;
