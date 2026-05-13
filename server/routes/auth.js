const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('📥 REGISTER BODY:', req.body);
    const { username, email, password } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    // Cek existing user
    console.log('🔍 Checking existing user...');
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({
        success: false,
        message: 'Username atau email sudah terdaftar'
      });
    }

    // Buat user baru
    console.log('📝 Creating new user...');
    const user = new User({ username, email, password });
    
    console.log('💾 Saving user...');
    await user.save();
    console.log('✅ User saved:', user._id);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        highScore: user.highScore
      }
    });
  } catch (error) {
    console.error('❌ REGISTER ERROR:', error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('📥 LOGIN BODY:', req.body);
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi'
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        highScore: user.highScore
      }
    });
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

module.exports = router;