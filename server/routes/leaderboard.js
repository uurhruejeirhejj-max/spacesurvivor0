const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Score = require('../models/Score');
const authMiddleware = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const users = await User.find({ highScore: { $gt: 0 } })
      .sort({ highScore: -1 })
      .limit(limit)
      .select('username highScore bestSurvivalTime totalGames createdAt');

    const total = await User.countDocuments({ highScore: { $gt: 0 } });

    const data = users.map((user, index) => ({
      username: user.username,
      score: user.highScore,
      survivalTime: user.bestSurvivalTime || 0, // ← FIX: Ambil dari user
      powerUpsCollected: 0,
      createdAt: user.createdAt,
      rank: index + 1
    }));

    res.json({
      success: true,
      data: data,
      pagination: {
        page: 1,
        limit: limit,
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil leaderboard'
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score, survivalTime, powerUpsCollected } = req.body;
    const userId = req.userId;

    if (score === undefined || survivalTime === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Score dan survivalTime harus diisi'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const newScore = new Score({
      user: userId,
      username: user.username,
      score,
      survivalTime,
      powerUpsCollected: powerUpsCollected || 0
    });
    await newScore.save();

    let isNewHighScore = false;
    if (score > user.highScore) {
      user.highScore = score;
      user.bestSurvivalTime = survivalTime; // ← FIX: Simpan survival time
      isNewHighScore = true;
    }
    user.totalGames += 1;
    await user.save();

    const rank = await User.countDocuments({ highScore: { $gt: score } }) + 1;

    res.status(201).json({
      success: true,
      message: isNewHighScore ? 'New High Score!' : 'Score berhasil disimpan',
      data: {
        score: newScore.score,
        highScore: user.highScore,
        bestSurvivalTime: user.bestSurvivalTime,
        isNewHighScore: isNewHighScore,
        rank: rank
      }
    });
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan score'
    });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const scores = await Score.find({ user: req.userId })
      .sort({ score: -1 })
      .limit(10)
      .select('score survivalTime powerUpsCollected createdAt');

    const user = await User.findById(req.userId).select('highScore bestSurvivalTime totalGames username');

    res.json({
      success: true,
      data: {
        username: user.username,
        personalBest: user.highScore,
        bestSurvivalTime: user.bestSurvivalTime,
        totalGames: user.totalGames,
        recentScores: scores
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data personal'
    });
  }
});

module.exports = router;