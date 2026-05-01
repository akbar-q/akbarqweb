const jwt = require("jsonwebtoken");

function getBearerToken(request) {
  const header = String(request.headers.authorization || "").trim();
  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

function authenticateRequest(request, response, next) {
  const token = getBearerToken(request);
  if (!token) {
    return response.status(401).json({ error: "Missing bearer token" });
  }

  try {
    request.auth = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return response.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(role) {
  return (request, response, next) => {
    if (request.auth?.role !== role) {
      return response.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

function requireTutorParamOrAdmin(paramName = "id") {
  return (request, response, next) => {
    if (request.auth?.role === "admin") {
      return next();
    }

    const requestedTutorId = String(request.params?.[paramName] || "").trim().toLowerCase();
    if (request.auth?.role === "tutor" && request.auth?.sub === requestedTutorId) {
      return next();
    }

    return response.status(403).json({ error: "Forbidden" });
  };
}

module.exports = {
  authenticateRequest,
  requireRole,
  requireTutorParamOrAdmin,
};