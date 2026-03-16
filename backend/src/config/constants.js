module.exports = {
  // Time after which check-in is considered "late" (24h format HH:MM)
  WORK_START_TIME: "09:00",
  LATE_AFTER_MINUTES: 15, // 9:15 AM onwards = late

  // Default office geo-fencing (Hyderabad)
  DEFAULT_OFFICE: {
    officeName: "ZenithYuga Tech Pvt Ltd - Head Office",
    companyName: "ZenithYuga Tech Pvt Ltd",
    lat: 17.445482458263523,
    lng: 78.38650943262039,
    radius: 100, // meters
    workStartTime: "09:00",
    lateAfterMinutes: 15,
  },

  // QR Token TTL in minutes
  QR_TOKEN_TTL_MINUTES: 15,
};
