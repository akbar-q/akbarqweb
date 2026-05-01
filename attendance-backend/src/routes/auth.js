const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../db");

const router = express.Router();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
}

router.post("/login", async (req, res) => {
  const { id, pin } = req.body || {};

  if (!id || !pin) {
    return res.status(400).json({ error: "Tutor ID and password are required" });
  }

  const result = await db.query(
    "SELECT id, name, title, pin_hash FROM tutors WHERE id = $1",
    [String(id).trim().toLowerCase()]
  );

  const tutor = result.rows[0];
  if (!tutor) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(String(pin), tutor.pin_hash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json({
    token: signToken({ sub: tutor.id, role: "tutor" }),
    tutor: {
      id: tutor.id,
      name: tutor.name,
      title: tutor.title,
    },
  });
});

router.post("/admin/login", async (req, res) => {
  const { pin } = req.body || {};

  if (!pin) {
    return res.status(400).json({ error: "Admin password is required" });
  }

  const result = await db.query(
    "SELECT value FROM settings WHERE key = 'admin_password_hash'"
  );

  const storedHash = result.rows[0]?.value;
  if (!storedHash) {
    return res.status(500).json({ error: "Admin password is not configured" });
  }

  const isValid = await bcrypt.compare(String(pin), storedHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid admin password" });
  }

  return res.json({
    token: signToken({ sub: "admin", role: "admin" }),
  });
});

module.exports = router;
