require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./db");
const authRoutes = require("./routes/auth");
const tutorRoutes = require("./routes/tutors");
const attendanceRoutes = require("./routes/attendance");
const adminRoutes = require("./routes/admin");

const app = express();

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
app.use("/tutors", tutorRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/admin", adminRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3001);

app.listen(port, () => {
  console.log(`Attendance backend listening on port ${port}`);
});
