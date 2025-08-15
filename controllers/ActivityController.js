const { Timestamp } = require('firebase-admin/firestore');
const RecentActivities = require('../models/RecentActivities');
// const activityService = require('../models/RecentActivities');

class ActivityController {
  // GET /api/admin/activities/recent
static async getRecentActivities(req, res) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const activities = await RecentActivities.find({
      timestamp: { $gte: twentyFourHoursAgo }  // 👈 filter by timestamp
    })
      .sort({ timestamp:1 })                // newest first
      // .limit(5)                             // optionally limit results
      .populate('userId', 'name email')
      .populate('target', 'name email');

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
}




};

module.exports = ActivityController;
