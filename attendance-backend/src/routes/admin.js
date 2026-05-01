const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../db");

const router = express.Router();
const VALID_SCHEDULES = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);

function normalizeTutorId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUnitId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchTutors() {
  const tutorsResult = await db.query(
    `SELECT t.id, t.name, t.title,
            COALESCE(array_agg(u.id ORDER BY u.id) FILTER (WHERE u.id IS NOT NULL), '{}') AS class_ids
     FROM tutors t
     LEFT JOIN units u ON u.tutor_id = t.id
     GROUP BY t.id
     ORDER BY t.name`
  );

  return tutorsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    title: row.title,
    classIds: row.class_ids,
  }));
}

async function fetchUnits() {
  const unitsResult = await db.query(
    `SELECT u.id, u.name, u.room, u.schedule, u.tutor_id,
            COUNT(s.id)::int AS student_count
     FROM units u
     LEFT JOIN students s ON s.unit_id = u.id
     GROUP BY u.id
     ORDER BY u.name`
  );

  return unitsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    room: row.room,
    schedule: row.schedule,
    tutorId: row.tutor_id,
    studentCount: row.student_count,
  }));
}

async function fetchStudents(unitId) {
  const params = [];
  let whereClause = "";

  if (unitId) {
    params.push(unitId);
    whereClause = "WHERE s.unit_id = $1";
  }

  const studentsResult = await db.query(
    `SELECT s.id, s.name, s.unit_id, u.name AS unit_name
     FROM students s
     JOIN units u ON u.id = s.unit_id
     ${whereClause}
     ORDER BY s.id`,
    params
  );

  return studentsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    unitId: row.unit_id,
    course: row.unit_name,
  }));
}

router.get("/bootstrap", async (req, res) => {
  const [tutors, units, students] = await Promise.all([
    fetchTutors(),
    fetchUnits(),
    fetchStudents(),
  ]);

  return res.json({ tutors, units, students });
});

router.get("/tutors", async (req, res) => {
  return res.json({ tutors: await fetchTutors() });
});

router.post("/tutors", async (req, res) => {
  const id = normalizeTutorId(req.body?.id);
  const name = String(req.body?.name || "").trim();
  const pin = String(req.body?.pin || "").trim();
  const title = String(req.body?.title || "").trim() || `Tutor · ${name}`;

  if (!id || !name || !pin) {
    return res.status(400).json({ error: "Tutor ID, name, and password are required" });
  }

  const pinHash = await bcrypt.hash(pin, 10);
  await db.query(
    "INSERT INTO tutors (id, name, title, pin_hash) VALUES ($1, $2, $3, $4)",
    [id, name, title, pinHash]
  );

  return res.status(201).json({ tutor: { id, name, title } });
});

router.put("/tutors/:id", async (req, res) => {
  const tutorId = normalizeTutorId(req.params.id);
  const name = String(req.body?.name || "").trim();
  const title = String(req.body?.title || "").trim();
  const pin = String(req.body?.pin || "").trim();

  if (!name || !title) {
    return res.status(400).json({ error: "Tutor name and title are required" });
  }

  if (pin) {
    const pinHash = await bcrypt.hash(pin, 10);
    await db.query(
      "UPDATE tutors SET name = $1, title = $2, pin_hash = $3 WHERE id = $4",
      [name, title, pinHash, tutorId]
    );
  } else {
    await db.query(
      "UPDATE tutors SET name = $1, title = $2 WHERE id = $3",
      [name, title, tutorId]
    );
  }

  return res.json({ updated: true });
});

router.delete("/tutors/:id", async (req, res) => {
  await db.query("DELETE FROM tutors WHERE id = $1", [normalizeTutorId(req.params.id)]);
  return res.status(204).send();
});

router.get("/units", async (req, res) => {
  return res.json({ units: await fetchUnits() });
});

router.post("/units", async (req, res) => {
  const id = normalizeUnitId(req.body?.id);
  const name = String(req.body?.name || "").trim();
  const room = String(req.body?.room || "").trim();
  const schedule = String(req.body?.schedule || "").trim();
  const tutorId = req.body?.tutorId ? normalizeTutorId(req.body.tutorId) : null;

  if (!id || !name || !room || !VALID_SCHEDULES.has(schedule)) {
    return res.status(400).json({ error: "Unit ID, name, room, and valid schedule are required" });
  }

  await db.query(
    "INSERT INTO units (id, name, room, schedule, tutor_id) VALUES ($1, $2, $3, $4, $5)",
    [id, name, room, schedule, tutorId || null]
  );

  return res.status(201).json({ unit: { id, name, room, schedule, tutorId } });
});

router.put("/units/:id", async (req, res) => {
  const unitId = normalizeUnitId(req.params.id);
  const name = String(req.body?.name || "").trim();
  const room = String(req.body?.room || "").trim();
  const schedule = String(req.body?.schedule || "").trim();
  const tutorId = req.body?.tutorId ? normalizeTutorId(req.body.tutorId) : null;

  if (!name || !room || !VALID_SCHEDULES.has(schedule)) {
    return res.status(400).json({ error: "Unit name, room, and valid schedule are required" });
  }

  await db.query(
    "UPDATE units SET name = $1, room = $2, schedule = $3, tutor_id = $4 WHERE id = $5",
    [name, room, schedule, tutorId || null, unitId]
  );

  return res.json({ updated: true });
});

router.delete("/units/:id", async (req, res) => {
  await db.query("DELETE FROM units WHERE id = $1", [normalizeUnitId(req.params.id)]);
  return res.status(204).send();
});

router.get("/students", async (req, res) => {
  const unitId = req.query.unitId ? normalizeUnitId(req.query.unitId) : "";
  return res.json({ students: await fetchStudents(unitId) });
});

router.post("/students", async (req, res) => {
  const id = String(req.body?.id || "").trim();
  const name = String(req.body?.name || "").trim();
  const unitId = normalizeUnitId(req.body?.unitId);

  if (!id || !name || !unitId) {
    return res.status(400).json({ error: "Student ID, name, and unit ID are required" });
  }

  await db.query(
    "INSERT INTO students (id, name, unit_id) VALUES ($1, $2, $3)",
    [id, name, unitId]
  );

  return res.status(201).json({ student: { id, name, unitId } });
});

router.put("/students/:id", async (req, res) => {
  const studentId = String(req.params.id || "").trim();
  const name = String(req.body?.name || "").trim();
  const unitId = req.body?.unitId ? normalizeUnitId(req.body.unitId) : null;

  if (!name) {
    return res.status(400).json({ error: "Student name is required" });
  }

  if (unitId) {
    await db.query(
      "UPDATE students SET name = $1, unit_id = $2 WHERE id = $3",
      [name, unitId, studentId]
    );
  } else {
    await db.query(
      "UPDATE students SET name = $1 WHERE id = $2",
      [name, studentId]
    );
  }

  return res.json({ updated: true });
});

router.delete("/students/:id", async (req, res) => {
  await db.query("DELETE FROM students WHERE id = $1", [String(req.params.id || "").trim()]);
  return res.status(204).send();
});

router.put("/settings/admin-password", async (req, res) => {
  const currentPin = String(req.body?.currentPin || "").trim();
  const newPin = String(req.body?.newPin || "").trim();

  if (!currentPin || !newPin) {
    return res.status(400).json({ error: "Current and new admin passwords are required" });
  }

  const result = await db.query(
    "SELECT value FROM settings WHERE key = 'admin_password_hash'"
  );

  const storedHash = result.rows[0]?.value;
  const isValid = storedHash ? await bcrypt.compare(currentPin, storedHash) : false;
  if (!isValid) {
    return res.status(401).json({ error: "Current admin password is incorrect" });
  }

  const nextHash = await bcrypt.hash(newPin, 10);
  await db.query(
    "UPDATE settings SET value = $1 WHERE key = 'admin_password_hash'",
    [nextHash]
  );

  return res.json({ updated: true });
});

module.exports = router;
