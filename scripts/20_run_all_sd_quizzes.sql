-- Script gabungan untuk membuat 10 quiz SD dengan masing-masing 25 soal
-- Menjalankan semua script quiz SD sekaligus

-- Menjalankan script quiz 1-3
\i scripts/16_create_sd_quizzes.sql

-- Menjalankan script quiz 4-5
\i scripts/17_create_sd_quizzes_part2.sql

-- Menjalankan script quiz 6-7
\i scripts/18_create_sd_quizzes_part3.sql

-- Menjalankan script quiz 8-10 (DIPERBAIKI)
\i scripts/19_create_sd_quizzes_part4_fixed.sql

-- Verifikasi data yang telah dibuat
SELECT 
  id,
  title,
  category,
  jsonb_array_length(questions) as jumlah_soal,
  created_at
FROM quizzes 
WHERE category IN ('Matematika', 'IPA', 'Bahasa Indonesia', 'IPS', 'PKN', 'Seni Budaya', 'PJOK', 'Bahasa Inggris', 'Agama', 'Teknologi')
ORDER BY created_at;
