import express from 'express';
import mongoose from 'mongoose';
import FactCheck from '../models/FactCheck.js';
import { mockDatabase } from './factcheck.js';

const router = express.Router();

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: getMockStats() });
    }

    const [total, verdictCounts, categoryCounts, recentChecks] = await Promise.all([
      FactCheck.countDocuments(),
      FactCheck.aggregate([{ $group: { _id: '$verdict', count: { $sum: 1 } } }]),
      FactCheck.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      FactCheck.find().sort({ createdAt: -1 }).limit(5).select('title verdict truthScore category createdAt'),
    ]);

    const verdictMap = {};
    verdictCounts.forEach(v => { verdictMap[v._id] = v.count; });

    const categoryMap = {};
    categoryCounts.forEach(c => { categoryMap[c._id] = c.count; });

    const avgTruthScore = await FactCheck.aggregate([
      { $group: { _id: null, avg: { $avg: '$truthScore' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalChecks: total,
        avgTruthScore: Math.round(avgTruthScore[0]?.avg || 0),
        verdictDistribution: verdictMap,
        categoryDistribution: categoryMap,
        recentChecks,
        flaggedHighPriority: verdictCounts.find(v => v._id === 'FALSE')?.count || 0,
        accuracyRate: Math.round(((verdictMap['TRUE'] || 0) + (verdictMap['MOSTLY_TRUE'] || 0)) / total * 100) || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', message: err.message });
  }
});

// ─── GET /api/dashboard/recent ────────────────────────────────────────────────
router.get('/recent', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: getMockRecent() });
    }

    const data = await FactCheck.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title verdict truthScore category createdAt processingTime');

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent', message: err.message });
  }
});

// ─── Mock data (when MongoDB is unavailable) ──────────────────────────────────
function getMockStats() {
  const base = {
    totalChecks: 0,
    avgTruthScore: 0,
    verdictDistribution: {
      TRUE: 0,
      MOSTLY_TRUE: 0,
      MISLEADING: 0,
      MOSTLY_FALSE: 0,
      FALSE: 0,
      UNVERIFIED: 0,
    },
    categoryDistribution: {
      Politics: 0,
      Health: 0,
      Science: 0,
      Economy: 0,
      Technology: 0,
      Environment: 0,
    },
    flaggedHighPriority: 0,
    accuracyRate: 0,
  };

  // Add in-memory custom submissions to stats
  const userSubmissions = Array.from(mockDatabase.values());
  userSubmissions.forEach(item => {
    base.totalChecks += 1;
    
    // Add to verdict distribution
    const vLabel = item.verdict; // 'TRUE', 'MOSTLY_TRUE', etc.
    base.verdictDistribution[vLabel] = (base.verdictDistribution[vLabel] || 0) + 1;
    
    // Add to category distribution
    const cat = item.category;
    base.categoryDistribution[cat] = (base.categoryDistribution[cat] || 0) + 1;
    
    if (vLabel === 'FALSE') {
      base.flaggedHighPriority += 1;
    }
  });

  // Re-calculate average truth score and accuracy rate
  if (userSubmissions.length > 0) {
    const totalScore = userSubmissions.reduce((sum, item) => sum + item.truthScore, 0);
    base.avgTruthScore = Math.round(totalScore / base.totalChecks);
    
    const trues = (base.verdictDistribution['TRUE'] || 0) + (base.verdictDistribution['MOSTLY_TRUE'] || 0);
    base.accuracyRate = Math.round((trues / base.totalChecks) * 100);
  }

  base.recentChecks = getMockRecent();
  return base;
}

function getMockRecent() {
  const userSubmissions = Array.from(mockDatabase.values()).map(item => ({
    _id: item._id,
    title: item.title,
    verdict: item.verdict,
    truthScore: item.truthScore,
    category: item.category,
    createdAt: item.createdAt,
    processingTime: item.processingTime
  }));

  // Return only real user submissions
  return userSubmissions.slice(0, 10);
}

export default router;
