const express = require("express");

const db = require("../db");

const router = express.Router();
const VALID_STATUSES = new Set(["present", "late", "absent", "leave"]);

router.get("/:classId/:date", async (req, res) => {
  const { classId, date } = req.params;

  const result = await db.query(
    `SELECT student_id, status, note, updated_at
     FROM attendance_records
     WHERE unit_id = $1 AND attendance_date = $2
     ORDER BY student_id`,
    [classId, date]
  );

  const records = result.rows.reduce((accumulator, row) => {
    accumulator[row.student_id] = {
      status: row.status,
      note: row.note,
      updatedAt: row.updated_at,
    };
    return accumulator;
  }, {});

  return res.json({ classId, date, records });
});

router.put("/:classId/:date/:studentId", async (req, res) => {
  const { classId, date, studentId } = req.params;
  const { status, note } = req.body || {};

  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: "Status must be present, late, absent, or leave" });
  }

  const studentResult = await db.query(
    "SELECT id FROM students WHERE id = $1 AND unit_id = $2",
    [studentId, classId]
  );

  if (!studentResult.rows[0]) {
    return res.status(404).json({ error: "Student not found in the selected unit" });
  }

  const result = await db.query(
    `INSERT INTO attendance_records (unit_id, student_id, attendance_date, status, note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (unit_id, student_id, attendance_date)
     DO UPDATE SET
       status = EXCLUDED.status,
       note = EXCLUDED.note,
       updated_at = NOW()
     RETURNING unit_id, student_id, attendance_date, status, note, updated_at`,
    [classId, studentId, date, status, note || ""]
  );

  return res.json({ saved: result.rows[0] });
});

module.exports = router;
