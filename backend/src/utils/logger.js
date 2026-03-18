const ActivityLog = require("../models/ActivityLog");

/**
 * Utility to log user activities
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action name (e.g., 'LOGIN', 'CREATE_EMPLOYEE')
 * @param {string} targetType - Resource type (e.g., 'User', 'Employee')
 * @param {string} targetId - ID of the affected resource
 * @param {Object} details - Additional optional details
 * @param {string} ip - IP address of the request
 */
const logActivity = async (userId, action, targetType, targetId = null, details = {}, ip = "") => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      targetType,
      targetId,
      details,
      ipAddress: ip,
    });
  } catch (error) {
    console.error("Failed to log activity:", error.message);
    // We don't want to throw error and break the main flow if logging fails
  }
};

module.exports = { logActivity };
