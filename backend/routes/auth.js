import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// In-memory fallback users store
export const mockUsers = new Map();

// ─── POST /api/auth/register (or signup) ──────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, organization, password } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Full name and email are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ email: normalizedEmail });
      if (user) {
        // Update user info
        user.fullName = fullName;
        if (organization) user.organization = organization;
        user.lastActive = new Date();
        await user.save();
      } else {
        user = await User.create({
          fullName,
          email: normalizedEmail,
          organization: organization || 'Independent Investigator',
          password: password || undefined,
          lastActive: new Date(),
        });
      }
      return res.status(200).json({
        success: true,
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          organization: user.organization,
          role: user.role,
        },
      });
    }

    // In-memory fallback
    const mockUser = {
      id: `user_${Date.now()}`,
      fullName,
      email: normalizedEmail,
      organization: organization || 'Independent Investigator',
      role: 'analyst',
      lastActive: new Date(),
    };
    mockUsers.set(normalizedEmail, mockUser);

    res.status(200).json({
      success: true,
      data: mockUser,
    });
  } catch (err) {
    console.error('Auth register error:', err);
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Auto-create user profile if signing in
        const nameFromEmail = normalizedEmail.split('@')[0];
        const cleanName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        user = await User.create({
          fullName: cleanName,
          email: normalizedEmail,
          organization: 'Verified Analyst',
          lastActive: new Date(),
        });
      } else {
        user.lastActive = new Date();
        await user.save();
      }

      return res.json({
        success: true,
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          organization: user.organization,
          role: user.role,
        },
      });
    }

    // In-memory fallback
    let mockUser = mockUsers.get(normalizedEmail);
    if (!mockUser) {
      const nameFromEmail = normalizedEmail.split('@')[0];
      const cleanName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      mockUser = {
        id: `user_${Date.now()}`,
        fullName: cleanName,
        email: normalizedEmail,
        organization: 'Verified Analyst',
        role: 'analyst',
        lastActive: new Date(),
      };
      mockUsers.set(normalizedEmail, mockUser);
    }

    res.json({
      success: true,
      data: mockUser,
    });
  } catch (err) {
    console.error('Auth login error:', err);
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// ─── POST /api/auth/sync ──────────────────────────────────────────────────────
router.post('/sync', async (req, res) => {
  try {
    const { fullName, email, organization } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required for profile sync' });

    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        user = await User.create({
          fullName: fullName || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          organization: organization || 'Independent Investigator',
          lastActive: new Date(),
        });
      } else {
        if (fullName) user.fullName = fullName;
        if (organization) user.organization = organization;
        user.lastActive = new Date();
        await user.save();
      }
      return res.json({ success: true, data: user });
    }

    const mockUser = {
      fullName: fullName || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      organization: organization || 'Independent Investigator',
      lastActive: new Date(),
    };
    mockUsers.set(normalizedEmail, mockUser);
    res.json({ success: true, data: mockUser });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed', message: err.message });
  }
});

export default router;
