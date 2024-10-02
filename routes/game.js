const express = require("express");
const redisClient = require("../config/redisClient");
const { authMiddleware } = require("./auth");

const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Start a New Game
router.post("/start", async (req, res) => {
  const { userId } = req.body;

  try {
    const ongoingGames = await redisClient.keys(`game:${userId}:*`);

    if (ongoingGames.length > 0) {
      const ongoingGame = await redisClient.hgetall(ongoingGames[0]);
      if (ongoingGame.status === "active") {
        return res.status(200).json({
          message: "Ongoing game found",
          gameId: ongoingGames[0].split(":")[1],
        });
      }
    }

    const Gid = uuidv4();
    const gameId = `game:${Gid}`;
    const newGame = {
      player: userId,
      gameId,
      score: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await redisClient.hset(gameId, newGame);
    res.status(201).json({ message: "New game started", gameId: Gid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// End Game and Update Score
router.post("/updatescore/end", async (req, res) => {
  const { action, gameId, userId } = req.body;

  try {
    const gameKey = `game:${gameId}`;
    const game = await redisClient.hgetall(gameKey);

    if (!game || game.status !== "active") {
      return res.status(404).json({ message: "Game not found" });
    }

    const newScore = action === "win" ? parseInt(game.score) + 10 : game.score;
    await redisClient.hset(gameKey, {
      score: newScore,
      status: "ended",
    });

    const userGameHistory = JSON.parse(
      await redisClient.hget(`user:${userId}`, "gameHistory")
    );
    userGameHistory.push(gameKey);
    await redisClient.hset(
      `user:${userId}`,
      "gameHistory",
      JSON.stringify(userGameHistory)
    );

    res
      .status(200)
      .json({ message: "Game ended and history updated", score: newScore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const userKeys = await redisClient.keys("user:*");
    const leaderboard = [];

    for (const userKey of userKeys) {
      const user = await redisClient.hgetall(userKey);
      const gameHistory =
        JSON.parse(await redisClient.hget(userKey, "gameHistory")) || [];
      let totalScore = 0;

      for (const gameId of gameHistory) {
        const game = await redisClient.hgetall(gameId);
        if (game && game.score) {
          totalScore += parseInt(game.score);
        }
      }

      leaderboard.push({
        username: user.username,
        totalScore: totalScore,
      });
    }

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    res.status(200).json({ leaderboard: leaderboard.slice(0, 20) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
