INSERT INTO settings (key, value)
VALUES ('admin_password_hash', '$2b$10$H5L3r3CgnzrYI5NisIUuEeJ3vD/IBYFqVHGFlrkMFlGBz3TM8xBm2')
ON CONFLICT (key) DO NOTHING;

INSERT INTO tutors (id, name, title, pin_hash)
VALUES (
  'eee',
  'Akbar Qamar',
  'Tutor · Units 4020, 4001 and 4015',
  '$2b$10$fgyJPknQS4sFvxbGJhGijeJx5NEJaF33nPHEmZ09dlZm.h8FOUGbi'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (id, name, room, schedule, tutor_id)
VALUES
  ('unit-4020', 'Unit 4020', 'Tuesday register', 'Tuesday', 'eee'),
  ('unit-4001', 'Unit 4001', 'Wednesday register', 'Wednesday', 'eee'),
  ('unit-4015', 'Unit 4015', 'Thursday register', 'Thursday', 'eee')
ON CONFLICT (id) DO NOTHING;

WITH names(name, ordinal) AS (
  VALUES
    ('Nusrat Jahan Ripa', 1),
    ('Sophia Sestuso Veran', 2),
    ('David Haitham Al-Shadfan', 3),
    ('Athul Antony', 4),
    ('Muhammad Usman Malik', 5),
    ('Sabulao John Benedict', 6),
    ('Joshua Samuel', 7),
    ('Faiz Abdul Razak', 8),
    ('Gian Melchor Albaran Gella', 9),
    ('Soofia Sheik Sakhabuth', 10),
    ('Stephanie Lauren Avenion Laylo', 11),
    ('Sasindu Amash Abeysinghe', 12),
    ('Aschton James Macatangay', 13),
    ('Showkat Ahmed', 14),
    ('Kylie Noelle B. Andal', 15),
    ('Bencel Ermitanio Sajulga', 16),
    ('Leonarda Allan Rosales', 17),
    ('Benidict Sajulga', 18),
    ('Miguel Melendez Cendreda', 19),
    ('Angelo Jan Villarama Cruz', 20),
    ('Ayeen Limoodehi', 21),
    ('Mohammed Zazi', 22)
)
INSERT INTO students (id, name, unit_id)
SELECT '4020-' || LPAD(ordinal::text, 2, '0'), name, 'unit-4020'
FROM names
ON CONFLICT (id) DO NOTHING;

WITH names(name, ordinal) AS (
  VALUES
    ('Nusrat Jahan Ripa', 1),
    ('Sophia Sestuso Veran', 2),
    ('David Haitham Al-Shadfan', 3),
    ('Athul Antony', 4),
    ('Muhammad Usman Malik', 5),
    ('Sabulao John Benedict', 6),
    ('Joshua Samuel', 7),
    ('Faiz Abdul Razak', 8),
    ('Gian Melchor Albaran Gella', 9),
    ('Soofia Sheik Sakhabuth', 10),
    ('Stephanie Lauren Avenion Laylo', 11),
    ('Sasindu Amash Abeysinghe', 12),
    ('Aschton James Macatangay', 13),
    ('Showkat Ahmed', 14),
    ('Kylie Noelle B. Andal', 15),
    ('Bencel Ermitanio Sajulga', 16),
    ('Leonarda Allan Rosales', 17),
    ('Benidict Sajulga', 18),
    ('Miguel Melendez Cendreda', 19),
    ('Angelo Jan Villarama Cruz', 20),
    ('Ayeen Limoodehi', 21),
    ('Mohammed Zazi', 22)
)
INSERT INTO students (id, name, unit_id)
SELECT '4001-' || LPAD(ordinal::text, 2, '0'), name, 'unit-4001'
FROM names
ON CONFLICT (id) DO NOTHING;

WITH names(name, ordinal) AS (
  VALUES
    ('Nusrat Jahan Ripa', 1),
    ('Sophia Sestuso Veran', 2),
    ('David Haitham Al-Shadfan', 3),
    ('Athul Antony', 4),
    ('Muhammad Usman Malik', 5),
    ('Sabulao John Benedict', 6),
    ('Joshua Samuel', 7),
    ('Faiz Abdul Razak', 8),
    ('Gian Melchor Albaran Gella', 9),
    ('Soofia Sheik Sakhabuth', 10),
    ('Stephanie Lauren Avenion Laylo', 11),
    ('Sasindu Amash Abeysinghe', 12),
    ('Aschton James Macatangay', 13),
    ('Showkat Ahmed', 14),
    ('Kylie Noelle B. Andal', 15),
    ('Bencel Ermitanio Sajulga', 16),
    ('Leonarda Allan Rosales', 17),
    ('Benidict Sajulga', 18),
    ('Miguel Melendez Cendreda', 19),
    ('Angelo Jan Villarama Cruz', 20),
    ('Ayeen Limoodehi', 21),
    ('Mohammed Zazi', 22)
)
INSERT INTO students (id, name, unit_id)
SELECT '4015-' || LPAD(ordinal::text, 2, '0'), name, 'unit-4015'
FROM names
ON CONFLICT (id) DO NOTHING;
