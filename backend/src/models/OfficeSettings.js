const mongoose = require("mongoose");
const { DEFAULT_OFFICE } = require("../config/constants");

const officeSettingsSchema = new mongoose.Schema(
  {
    officeName: {
      type: String,
      default: DEFAULT_OFFICE.officeName,
    },
    companyName: {
      type: String,
      default: DEFAULT_OFFICE.companyName,
    },
    lat: {
      type: Number,
      required: true,
      default: DEFAULT_OFFICE.lat,
    },
    lng: {
      type: Number,
      required: true,
      default: DEFAULT_OFFICE.lng,
    },
    radius: {
      type: Number,
      required: true,
      default: DEFAULT_OFFICE.radius, // meters
    },
    workStartTime: {
      type: String,
      default: DEFAULT_OFFICE.workStartTime, // "09:00"
    },
    lateAfterMinutes: {
      type: Number,
      default: DEFAULT_OFFICE.lateAfterMinutes, // minutes after workStartTime
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OfficeSettings", officeSettingsSchema);
