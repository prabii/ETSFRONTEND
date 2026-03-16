const OfficeSettings = require("../models/OfficeSettings");
const { DEFAULT_OFFICE } = require("../config/constants");

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await OfficeSettings.findOne();

    // Auto-create defaults if not configured yet
    if (!settings) {
      settings = await OfficeSettings.create(DEFAULT_OFFICE);
    }

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    const { officeName, companyName, lat, lng, radius, workStartTime, lateAfterMinutes } = req.body;

    let settings = await OfficeSettings.findOne();

    if (!settings) {
      settings = await OfficeSettings.create({
        officeName,
        companyName,
        lat,
        lng,
        radius,
        workStartTime,
        lateAfterMinutes,
      });
    } else {
      if (officeName !== undefined) settings.officeName = officeName;
      if (companyName !== undefined) settings.companyName = companyName;
      if (lat !== undefined) settings.lat = lat;
      if (lng !== undefined) settings.lng = lng;
      if (radius !== undefined) settings.radius = radius;
      if (workStartTime !== undefined) settings.workStartTime = workStartTime;
      if (lateAfterMinutes !== undefined) settings.lateAfterMinutes = lateAfterMinutes;
      await settings.save();
    }

    res.status(200).json({ success: true, message: "Settings updated.", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

module.exports = { getSettings, updateSettings };
