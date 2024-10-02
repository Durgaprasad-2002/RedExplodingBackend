const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../config/redisClient");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Register User
router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    const existingUser = await redis.hgetall(`user:${email}`);
    if (existingUser.email) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user:${email}`;

    // Store user data in Redis
    await redis.hset(userId, {
      name,
      username,
      email,
      password: hashedPassword,
      gameHistory: JSON.stringify([]), // Initialize game history as an empty array
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await redis.hgetall(`user:${email}`);

    console.log(user);

    if (!user.email) {
      return res.status(400).json({ message: "Email Not Found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password not matched" });
    }

    const token = jwt.sign(
      { userId: user.username, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        name: user.name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(403).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = { router, authMiddleware };
