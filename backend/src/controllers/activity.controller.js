const ActivityLog = require("../models/ActivityLog");

// Get all activity logs (Admin only)
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, user } = req.query;
    
    const query = {};
    if (action) query.action = action;
    if (user) query.user = user;

    const logs = await ActivityLog.find(query)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await ActivityLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLogs: count,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
};
