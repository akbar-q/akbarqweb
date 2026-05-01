require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./db");
const { authenticateRequest, requireRole } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const tutorRoutes = require("./routes/tutors");
const attendanceRoutes = require("./routes/attendance");
const adminRoutes = require("./routes/admin");

const app = express();
const frontendDir = path.resolve(__dirname, "../../attendance-demo");
const sharedAssetsDir = path.resolve(__dirname, "../../assets");
const frontendIndexPath = path.join(frontendDir, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(cors({
  origin: corsOrigin === "*" ? true : corsOrigin,
}));
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (error) {
    res.status(500).json({ ok: false, database: "disconnected", error: error.message });
  }
});

app.use("/auth", authRoutes);
app.use("/tutors", authenticateRequest, tutorRoutes);
app.use("/attendance", authenticateRequest, attendanceRoutes);
app.use("/admin", authenticateRequest, requireRole("admin"), adminRoutes);

if (fs.existsSync(sharedAssetsDir)) {
  app.use("/assets", express.static(sharedAssetsDir));
}

if (hasFrontendBuild) {
  app.use(express.static(frontendDir));
  app.get(/^\/(?!auth|tutors|attendance|admin|health).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  console.warn(`Attendance frontend was not found at ${frontendIndexPath}`);
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`Attendance backend listening on port ${port}`);
});
