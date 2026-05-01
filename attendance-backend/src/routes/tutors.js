const express = require("express");

const db = require("../db");
const { requireTutorParamOrAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/:id/classes", requireTutorParamOrAdmin("id"), async (req, res) => {
  const tutorId = String(req.params.id || "").trim().toLowerCase();

  const unitsResult = await db.query(
    `SELECT
       u.id,
       u.name,
       u.room,
       u.schedule,
       u.tutor_id,
       COUNT(s.id)::int AS student_count
     FROM units u
     LEFT JOIN students s ON s.unit_id = u.id
     WHERE u.tutor_id = $1
     GROUP BY u.id
     ORDER BY u.name`,
    [tutorId]
  );

  const unitIds = unitsResult.rows.map((row) => row.id);
  const studentsResult = unitIds.length
    ? await db.query(
        "SELECT id, name, unit_id FROM students WHERE unit_id = ANY($1::text[]) ORDER BY id",
        [unitIds]
      )
    : { rows: [] };

  const studentsByUnit = studentsResult.rows.reduce((accumulator, student) => {
    const bucket = accumulator[student.unit_id] || [];
    bucket.push({
      id: student.id,
      name: student.name,
      course: unitsResult.rows.find((row) => row.id === student.unit_id)?.name || "",
    });
    accumulator[student.unit_id] = bucket;
    return accumulator;
  }, {});

  const classes = unitsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    room: row.room,
    schedule: row.schedule,
    tutorId: row.tutor_id,
    studentCount: row.student_count,
    students: studentsByUnit[row.id] || [],
  }));

  return res.json({ tutorId, classes });
});

module.exports = router;
