-- Lanjutan script untuk membuat 10 quiz SD dengan masing-masing 25 soal
-- Quiz 6-10: Seni Budaya, PJOK, Bahasa Inggris, Agama, Teknologi

-- Quiz 6: Seni Budaya Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'Seni Budaya Dasar Kelas 1-3',
  'Quiz seni budaya dasar untuk siswa SD kelas 1-3',
  'Seni Budaya',
  '[
    {
      "id": "senbud_1",
      "type": "multiple_choice",
      "question": "Warna primer adalah...",
      "options": ["Merah, kuning, biru", "Hijau, orange, ungu", "Hitam, putih, abu", "Merah, hijau, biru"],
      "correct_answer": "Merah, kuning, biru",
      "explanation": "Warna primer adalah merah, kuning, biru"
    },
    {
      "id": "senbud_2",
      "type": "multiple_choice",
      "question": "Alat untuk menggambar adalah...",
      "options": ["Pensil", "Sendok", "Garpu", "Piring"],
      "correct_answer": "Pensil",
      "explanation": "Pensil adalah alat untuk menggambar"
    },
    {
      "id": "senbud_3",
      "type": "multiple_choice",
      "question": "Lagu anak-anak yang terkenal adalah...",
      "options": ["Pelangi", "Lagu dewasa", "Lagu rock", "Lagu jazz"],
      "correct_answer": "Pelangi",
      "explanation": "Pelangi adalah lagu anak-anak yang terkenal"
    },
    {
      "id": "senbud_4",
      "type": "multiple_choice",
      "question": "Tarian tradisional Indonesia adalah...",
      "options": ["Tari balet", "Tari saman", "Tari modern", "Tari hip hop"],
      "correct_answer": "Tari saman",
      "explanation": "Tari saman adalah tarian tradisional Indonesia"
    },
    {
      "id": "senbud_5",
      "type": "multiple_choice",
      "question": "Alat musik tradisional Indonesia adalah...",
      "options": ["Gitar", "Piano", "Angklung", "Drum"],
      "correct_answer": "Angklung",
      "explanation": "Angklung adalah alat musik tradisional Indonesia"
    },
    {
      "id": "senbud_6",
      "type": "multiple_choice",
      "question": "Warna yang menenangkan adalah...",
      "options": ["Merah", "Biru", "Kuning", "Orange"],
      "correct_answer": "Biru",
      "explanation": "Biru adalah warna yang menenangkan"
    },
    {
      "id": "senbud_7",
      "type": "multiple_choice",
      "question": "Ketika menggambar, kita harus menggunakan...",
      "options": ["Kaki", "Tangan", "Kepala", "Perut"],
      "correct_answer": "Tangan",
      "explanation": "Ketika menggambar, kita harus menggunakan tangan"
    },
    {
      "id": "senbud_8",
      "type": "multiple_choice",
      "question": "Lagu yang dinyanyikan dengan gembira adalah...",
      "options": ["Lagu sedih", "Lagu ceria", "Lagu marah", "Lagu takut"],
      "correct_answer": "Lagu ceria",
      "explanation": "Lagu ceria dinyanyikan dengan gembira"
    },
    {
      "id": "senbud_9",
      "type": "multiple_choice",
      "question": "Tarian yang dilakukan berkelompok adalah...",
      "options": ["Tari solo", "Tari berpasangan", "Tari kelompok", "Tari sendiri"],
      "correct_answer": "Tari kelompok",
      "explanation": "Tari kelompok dilakukan berkelompok"
    },
    {
      "id": "senbud_10",
      "type": "multiple_choice",
      "question": "Alat musik yang dipukul adalah...",
      "options": ["Gitar", "Piano", "Drum", "Seruling"],
      "correct_answer": "Drum",
      "explanation": "Drum adalah alat musik yang dipukul"
    },
    {
      "id": "senbud_11",
      "type": "multiple_choice",
      "question": "Warna yang hangat adalah...",
      "options": ["Biru", "Merah", "Hijau", "Ungu"],
      "correct_answer": "Merah",
      "explanation": "Merah adalah warna yang hangat"
    },
    {
      "id": "senbud_12",
      "type": "multiple_choice",
      "question": "Ketika bernyanyi, kita harus menggunakan...",
      "options": ["Kaki", "Suara", "Kepala", "Perut"],
      "correct_answer": "Suara",
      "explanation": "Ketika bernyanyi, kita harus menggunakan suara"
    },
    {
      "id": "senbud_13",
      "type": "multiple_choice",
      "question": "Lagu yang dinyanyikan dengan lembut adalah...",
      "options": ["Lagu keras", "Lagu lembut", "Lagu marah", "Lagu takut"],
      "correct_answer": "Lagu lembut",
      "explanation": "Lagu lembut dinyanyikan dengan lembut"
    },
    {
      "id": "senbud_14",
      "type": "multiple_choice",
      "question": "Tarian yang dilakukan berdua adalah...",
      "options": ["Tari solo", "Tari berpasangan", "Tari kelompok", "Tari sendiri"],
      "correct_answer": "Tari berpasangan",
      "explanation": "Tari berpasangan dilakukan berdua"
    },
    {
      "id": "senbud_15",
      "type": "multiple_choice",
      "question": "Alat musik yang ditiup adalah...",
      "options": ["Gitar", "Piano", "Seruling", "Drum"],
      "correct_answer": "Seruling",
      "explanation": "Seruling adalah alat musik yang ditiup"
    },
    {
      "id": "senbud_16",
      "type": "multiple_choice",
      "question": "Warna yang sejuk adalah...",
      "options": ["Merah", "Hijau", "Kuning", "Orange"],
      "correct_answer": "Hijau",
      "explanation": "Hijau adalah warna yang sejuk"
    },
    {
      "id": "senbud_17",
      "type": "multiple_choice",
      "question": "Ketika menari, kita harus menggunakan...",
      "options": ["Kaki", "Tangan", "Kepala", "Semua benar"],
      "correct_answer": "Semua benar",
      "explanation": "Ketika menari, kita menggunakan kaki, tangan, dan kepala"
    },
    {
      "id": "senbud_18",
      "type": "multiple_choice",
      "question": "Lagu yang dinyanyikan dengan sedih adalah...",
      "options": ["Lagu ceria", "Lagu sedih", "Lagu marah", "Lagu takut"],
      "correct_answer": "Lagu sedih",
      "explanation": "Lagu sedih dinyanyikan dengan sedih"
    },
    {
      "id": "senbud_19",
      "type": "multiple_choice",
      "question": "Tarian yang dilakukan sendiri adalah...",
      "options": ["Tari solo", "Tari berpasangan", "Tari kelompok", "Tari berdua"],
      "correct_answer": "Tari solo",
      "explanation": "Tari solo dilakukan sendiri"
    },
    {
      "id": "senbud_20",
      "type": "multiple_choice",
      "question": "Alat musik yang dipetik adalah...",
      "options": ["Gitar", "Piano", "Drum", "Seruling"],
      "correct_answer": "Gitar",
      "explanation": "Gitar adalah alat musik yang dipetik"
    },
    {
      "id": "senbud_21",
      "type": "multiple_choice",
      "question": "Warna yang cerah adalah...",
      "options": ["Hitam", "Kuning", "Abu-abu", "Coklat"],
      "correct_answer": "Kuning",
      "explanation": "Kuning adalah warna yang cerah"
    },
    {
      "id": "senbud_22",
      "type": "multiple_choice",
      "question": "Ketika bermain musik, kita harus menggunakan...",
      "options": ["Kaki", "Tangan", "Kepala", "Perut"],
      "correct_answer": "Tangan",
      "explanation": "Ketika bermain musik, kita harus menggunakan tangan"
    },
    {
      "id": "senbud_23",
      "type": "multiple_choice",
      "question": "Lagu yang dinyanyikan dengan keras adalah...",
      "options": ["Lagu lembut", "Lagu keras", "Lagu sedih", "Lagu takut"],
      "correct_answer": "Lagu keras",
      "explanation": "Lagu keras dinyanyikan dengan keras"
    },
    {
      "id": "senbud_24",
      "type": "multiple_choice",
      "question": "Tarian yang dilakukan dengan cepat adalah...",
      "options": ["Tari lambat", "Tari cepat", "Tari sedang", "Tari diam"],
      "correct_answer": "Tari cepat",
      "explanation": "Tari cepat dilakukan dengan cepat"
    },
    {
      "id": "senbud_25",
      "type": "multiple_choice",
      "question": "Alat musik yang ditekan adalah...",
      "options": ["Gitar", "Piano", "Drum", "Seruling"],
      "correct_answer": "Piano",
      "explanation": "Piano adalah alat musik yang ditekan"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Quiz 7: PJOK Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'PJOK Dasar Kelas 1-3',
  'Quiz pendidikan jasmani olahraga dan kesehatan dasar untuk siswa SD kelas 1-3',
  'PJOK',
  '[
    {
      "id": "pjok_1",
      "type": "multiple_choice",
      "question": "Olahraga yang baik untuk kesehatan adalah...",
      "options": ["Tidur", "Lari", "Makan", "Duduk"],
      "correct_answer": "Lari",
      "explanation": "Lari adalah olahraga yang baik untuk kesehatan"
    },
    {
      "id": "pjok_2",
      "type": "multiple_choice",
      "question": "Sebelum berolahraga, kita harus...",
      "options": ["Makan banyak", "Pemanasan", "Tidur", "Duduk"],
      "correct_answer": "Pemanasan",
      "explanation": "Sebelum berolahraga, kita harus pemanasan"
    },
    {
      "id": "pjok_3",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan bola adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Sepak bola",
      "explanation": "Sepak bola adalah olahraga yang dilakukan dengan bola"
    },
    {
      "id": "pjok_4",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan di air adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Renang",
      "explanation": "Renang adalah olahraga yang dilakukan di air"
    },
    {
      "id": "pjok_5",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan melompat adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat jauh"],
      "correct_answer": "Lompat jauh",
      "explanation": "Lompat jauh adalah olahraga yang dilakukan dengan melompat"
    },
    {
      "id": "pjok_6",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan tangan adalah...",
      "options": ["Lari", "Sepak bola", "Basket", "Renang"],
      "correct_answer": "Basket",
      "explanation": "Basket adalah olahraga yang dilakukan dengan tangan"
    },
    {
      "id": "pjok_7",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan kaki adalah...",
      "options": ["Basket", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Sepak bola",
      "explanation": "Sepak bola adalah olahraga yang dilakukan dengan kaki"
    },
    {
      "id": "pjok_8",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan raket adalah...",
      "options": ["Lari", "Sepak bola", "Bulu tangkis", "Renang"],
      "correct_answer": "Bulu tangkis",
      "explanation": "Bulu tangkis adalah olahraga yang dilakukan dengan raket"
    },
    {
      "id": "pjok_9",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan sepeda adalah...",
      "options": ["Lari", "Bersepeda", "Renang", "Lompat"],
      "correct_answer": "Bersepeda",
      "explanation": "Bersepeda adalah olahraga yang dilakukan dengan sepeda"
    },
    {
      "id": "pjok_10",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berjalan adalah...",
      "options": ["Lari", "Jalan cepat", "Renang", "Lompat"],
      "correct_answer": "Jalan cepat",
      "explanation": "Jalan cepat adalah olahraga yang dilakukan dengan berjalan"
    },
    {
      "id": "pjok_11",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan melempar adalah...",
      "options": ["Lari", "Lempar lembing", "Renang", "Lompat"],
      "correct_answer": "Lempar lembing",
      "explanation": "Lempar lembing adalah olahraga yang dilakukan dengan melempar"
    },
    {
      "id": "pjok_12",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan memanjat adalah...",
      "options": ["Lari", "Panjat tebing", "Renang", "Lompat"],
      "correct_answer": "Panjat tebing",
      "explanation": "Panjat tebing adalah olahraga yang dilakukan dengan memanjat"
    },
    {
      "id": "pjok_13",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Renang",
      "explanation": "Renang adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_14",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari",
      "explanation": "Lari adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_15",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan melompat adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat tinggi"],
      "correct_answer": "Lompat tinggi",
      "explanation": "Lompat tinggi adalah olahraga yang dilakukan dengan melompat"
    },
    {
      "id": "pjok_16",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya bebas", "Lompat"],
      "correct_answer": "Renang gaya bebas",
      "explanation": "Renang gaya bebas adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_17",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya dada", "Lompat"],
      "correct_answer": "Renang gaya dada",
      "explanation": "Renang gaya dada adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_18",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya punggung", "Lompat"],
      "correct_answer": "Renang gaya punggung",
      "explanation": "Renang gaya punggung adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_19",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya kupu-kupu", "Lompat"],
      "correct_answer": "Renang gaya kupu-kupu",
      "explanation": "Renang gaya kupu-kupu adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_20",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari jarak pendek", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari jarak pendek",
      "explanation": "Lari jarak pendek adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_21",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari jarak jauh", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari jarak jauh",
      "explanation": "Lari jarak jauh adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_22",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari estafet", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari estafet",
      "explanation": "Lari estafet adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_23",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari marathon", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari marathon",
      "explanation": "Lari marathon adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_24",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari sprint", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari sprint",
      "explanation": "Lari sprint adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_25",
      "type": "multiple_choice",
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari cross country", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari cross country",
      "explanation": "Lari cross country adalah olahraga yang dilakukan dengan berlari"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);
