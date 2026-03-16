const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin role required.",
  });
};

const requireAdminOrHR = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "hr")) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied. Admin or HR role required.",
  });
};

const requireEmployee = (req, res, next) => {
  if (req.user && (req.user.role === "employee" || req.user.role === "admin" || req.user.role === "hr")) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied.",
  });
};

module.exports = { requireAdmin, requireAdminOrHR, requireEmployee };
