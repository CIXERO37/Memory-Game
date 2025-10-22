-- Script untuk membuat 3 quiz SD terakhir dengan kategori yang sesuai constraint
-- Setiap quiz memiliki 25 soal yang sesuai untuk siswa SD kelas 1-3

-- Quiz 8: Bahasa Inggris Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'Bahasa Inggris Dasar Kelas 1-3',
  'Quiz bahasa Inggris dasar untuk siswa SD kelas 1-3',
  'Language',
  '[
    {
      "id": "bing_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari buku adalah...",
      "options": ["Book", "Pen", "Pencil", "Eraser"],
      "correct_answer": "Book",
      "explanation": "Bahasa Inggris dari buku adalah book"
    },
    {
      "id": "bing_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari pensil adalah...",
      "options": ["Book", "Pen", "Pencil", "Eraser"],
      "correct_answer": "Pencil",
      "explanation": "Bahasa Inggris dari pensil adalah pencil"
    },
    {
      "id": "bing_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari pena adalah...",
      "options": ["Book", "Pen", "Pencil", "Eraser"],
      "correct_answer": "Pen",
      "explanation": "Bahasa Inggris dari pena adalah pen"
    },
    {
      "id": "bing_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari penghapus adalah...",
      "options": ["Book", "Pen", "Pencil", "Eraser"],
      "correct_answer": "Eraser",
      "explanation": "Bahasa Inggris dari penghapus adalah eraser"
    },
    {
      "id": "bing_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari meja adalah...",
      "options": ["Chair", "Table", "Desk", "Bench"],
      "correct_answer": "Table",
      "explanation": "Bahasa Inggris dari meja adalah table"
    },
    {
      "id": "bing_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari kursi adalah...",
      "options": ["Chair", "Table", "Desk", "Bench"],
      "correct_answer": "Chair",
      "explanation": "Bahasa Inggris dari kursi adalah chair"
    },
    {
      "id": "bing_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari rumah adalah...",
      "options": ["House", "School", "Office", "Shop"],
      "correct_answer": "House",
      "explanation": "Bahasa Inggris dari rumah adalah house"
    },
    {
      "id": "bing_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari sekolah adalah...",
      "options": ["House", "School", "Office", "Shop"],
      "correct_answer": "School",
      "explanation": "Bahasa Inggris dari sekolah adalah school"
    },
    {
      "id": "bing_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari mobil adalah...",
      "options": ["Car", "Bus", "Train", "Plane"],
      "correct_answer": "Car",
      "explanation": "Bahasa Inggris dari mobil adalah car"
    },
    {
      "id": "bing_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari bus adalah...",
      "options": ["Car", "Bus", "Train", "Plane"],
      "correct_answer": "Bus",
      "explanation": "Bahasa Inggris dari bus adalah bus"
    },
    {
      "id": "bing_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari kereta adalah...",
      "options": ["Car", "Bus", "Train", "Plane"],
      "correct_answer": "Train",
      "explanation": "Bahasa Inggris dari kereta adalah train"
    },
    {
      "id": "bing_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari pesawat adalah...",
      "options": ["Car", "Bus", "Train", "Plane"],
      "correct_answer": "Plane",
      "explanation": "Bahasa Inggris dari pesawat adalah plane"
    },
    {
      "id": "bing_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari kucing adalah...",
      "options": ["Cat", "Dog", "Bird", "Fish"],
      "correct_answer": "Cat",
      "explanation": "Bahasa Inggris dari kucing adalah cat"
    },
    {
      "id": "bing_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari anjing adalah...",
      "options": ["Cat", "Dog", "Bird", "Fish"],
      "correct_answer": "Dog",
      "explanation": "Bahasa Inggris dari anjing adalah dog"
    },
    {
      "id": "bing_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari burung adalah...",
      "options": ["Cat", "Dog", "Bird", "Fish"],
      "correct_answer": "Bird",
      "explanation": "Bahasa Inggris dari burung adalah bird"
    },
    {
      "id": "bing_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari ikan adalah...",
      "options": ["Cat", "Dog", "Bird", "Fish"],
      "correct_answer": "Fish",
      "explanation": "Bahasa Inggris dari ikan adalah fish"
    },
    {
      "id": "bing_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari merah adalah...",
      "options": ["Red", "Blue", "Green", "Yellow"],
      "correct_answer": "Red",
      "explanation": "Bahasa Inggris dari merah adalah red"
    },
    {
      "id": "bing_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari biru adalah...",
      "options": ["Red", "Blue", "Green", "Yellow"],
      "correct_answer": "Blue",
      "explanation": "Bahasa Inggris dari biru adalah blue"
    },
    {
      "id": "bing_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari hijau adalah...",
      "options": ["Red", "Blue", "Green", "Yellow"],
      "correct_answer": "Green",
      "explanation": "Bahasa Inggris dari hijau adalah green"
    },
    {
      "id": "bing_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari kuning adalah...",
      "options": ["Red", "Blue", "Green", "Yellow"],
      "correct_answer": "Yellow",
      "explanation": "Bahasa Inggris dari kuning adalah yellow"
    },
    {
      "id": "bing_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari satu adalah...",
      "options": ["One", "Two", "Three", "Four"],
      "correct_answer": "One",
      "explanation": "Bahasa Inggris dari satu adalah one"
    },
    {
      "id": "bing_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari dua adalah...",
      "options": ["One", "Two", "Three", "Four"],
      "correct_answer": "Two",
      "explanation": "Bahasa Inggris dari dua adalah two"
    },
    {
      "id": "bing_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari tiga adalah...",
      "options": ["One", "Two", "Three", "Four"],
      "correct_answer": "Three",
      "explanation": "Bahasa Inggris dari tiga adalah three"
    },
    {
      "id": "bing_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari empat adalah...",
      "options": ["One", "Two", "Three", "Four"],
      "correct_answer": "Four",
      "explanation": "Bahasa Inggris dari empat adalah four"
    },
    {
      "id": "bing_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bahasa Inggris dari lima adalah...",
      "options": ["Four", "Five", "Six", "Seven"],
      "correct_answer": "Five",
      "explanation": "Bahasa Inggris dari lima adalah five"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Quiz 9: Agama Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'Agama Dasar Kelas 1-3',
  'Quiz pendidikan agama dasar untuk siswa SD kelas 1-3',
  'General',
  '[
    {
      "id": "agama_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tuhan yang Maha Esa adalah...",
      "options": ["Allah", "Yesus", "Buddha", "Semua benar"],
      "correct_answer": "Semua benar",
      "explanation": "Tuhan yang Maha Esa adalah Allah, Yesus, Buddha, dan lainnya sesuai kepercayaan masing-masing"
    },
    {
      "id": "agama_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa kepada Tuhan karena...",
      "options": ["Akan mendapat uang", "Tuhan mendengar doa kita", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Tuhan mendengar doa kita",
      "explanation": "Kita harus berdoa kepada Tuhan karena Tuhan mendengar doa kita"
    },
    {
      "id": "agama_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat beribadah umat Islam adalah...",
      "options": ["Gereja", "Masjid", "Pura", "Vihara"],
      "correct_answer": "Masjid",
      "explanation": "Masjid adalah tempat beribadah umat Islam"
    },
    {
      "id": "agama_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat beribadah umat Kristen adalah...",
      "options": ["Gereja", "Masjid", "Pura", "Vihara"],
      "correct_answer": "Gereja",
      "explanation": "Gereja adalah tempat beribadah umat Kristen"
    },
    {
      "id": "agama_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat beribadah umat Hindu adalah...",
      "options": ["Gereja", "Masjid", "Pura", "Vihara"],
      "correct_answer": "Pura",
      "explanation": "Pura adalah tempat beribadah umat Hindu"
    },
    {
      "id": "agama_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat beribadah umat Buddha adalah...",
      "options": ["Gereja", "Masjid", "Pura", "Vihara"],
      "correct_answer": "Vihara",
      "explanation": "Vihara adalah tempat beribadah umat Buddha"
    },
    {
      "id": "agama_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menghormati orang yang berbeda agama karena...",
      "options": ["Akan mendapat uang", "Itu perbuatan baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Itu perbuatan baik",
      "explanation": "Menghormati orang yang berbeda agama adalah perbuatan baik"
    },
    {
      "id": "agama_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berbuat baik kepada sesama karena...",
      "options": ["Akan mendapat uang", "Itu perintah Tuhan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Itu perintah Tuhan",
      "explanation": "Berbuat baik kepada sesama adalah perintah Tuhan"
    },
    {
      "id": "agama_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus jujur karena...",
      "options": ["Akan mendapat uang", "Jujur itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Jujur itu baik",
      "explanation": "Jujur adalah perbuatan yang baik"
    },
    {
      "id": "agama_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menolong orang yang membutuhkan karena...",
      "options": ["Akan mendapat uang", "Itu perbuatan baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Itu perbuatan baik",
      "explanation": "Menolong orang yang membutuhkan adalah perbuatan baik"
    },
    {
      "id": "agama_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus memaafkan orang yang berbuat salah karena...",
      "options": ["Akan mendapat uang", "Memaafkan itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memaafkan itu baik",
      "explanation": "Memaafkan orang yang berbuat salah adalah perbuatan baik"
    },
    {
      "id": "agama_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus bersyukur kepada Tuhan karena...",
      "options": ["Akan mendapat uang", "Tuhan memberikan banyak nikmat", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Tuhan memberikan banyak nikmat",
      "explanation": "Kita harus bersyukur kepada Tuhan karena Tuhan memberikan banyak nikmat"
    },
    {
      "id": "agama_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa sebelum makan karena...",
      "options": ["Akan mendapat uang", "Mensyukuri makanan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Mensyukuri makanan",
      "explanation": "Kita harus berdoa sebelum makan untuk mensyukuri makanan"
    },
    {
      "id": "agama_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa sebelum tidur karena...",
      "options": ["Akan mendapat uang", "Mensyukuri hari yang telah dilalui", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Mensyukuri hari yang telah dilalui",
      "explanation": "Kita harus berdoa sebelum tidur untuk mensyukuri hari yang telah dilalui"
    },
    {
      "id": "agama_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa sebelum belajar karena...",
      "options": ["Akan mendapat uang", "Memohon petunjuk Tuhan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memohon petunjuk Tuhan",
      "explanation": "Kita harus berdoa sebelum belajar untuk memohon petunjuk Tuhan"
    },
    {
      "id": "agama_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa setelah belajar karena...",
      "options": ["Akan mendapat uang", "Mensyukuri ilmu yang didapat", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Mensyukuri ilmu yang didapat",
      "explanation": "Kita harus berdoa setelah belajar untuk mensyukuri ilmu yang didapat"
    },
    {
      "id": "agama_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika bangun tidur karena...",
      "options": ["Akan mendapat uang", "Mensyukuri kesehatan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Mensyukuri kesehatan",
      "explanation": "Kita harus berdoa ketika bangun tidur untuk mensyukuri kesehatan"
    },
    {
      "id": "agama_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika sakit karena...",
      "options": ["Akan mendapat uang", "Memohon kesembuhan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memohon kesembuhan",
      "explanation": "Kita harus berdoa ketika sakit untuk memohon kesembuhan"
    },
    {
      "id": "agama_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika senang karena...",
      "options": ["Akan mendapat uang", "Mensyukuri kebahagiaan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Mensyukuri kebahagiaan",
      "explanation": "Kita harus berdoa ketika senang untuk mensyukuri kebahagiaan"
    },
    {
      "id": "agama_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika sedih karena...",
      "options": ["Akan mendapat uang", "Memohon kekuatan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memohon kekuatan",
      "explanation": "Kita harus berdoa ketika sedih untuk memohon kekuatan"
    },
    {
      "id": "agama_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika takut karena...",
      "options": ["Akan mendapat uang", "Memohon perlindungan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memohon perlindungan",
      "explanation": "Kita harus berdoa ketika takut untuk memohon perlindungan"
    },
    {
      "id": "agama_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika marah karena...",
      "options": ["Akan mendapat uang", "Memohon kesabaran", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memohon kesabaran",
      "explanation": "Kita harus berdoa ketika marah untuk memohon kesabaran"
    },
    {
      "id": "agama_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika bingung karena...",
      "options": ["Akan mendapat uang", "Memohon petunjuk", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memohon petunjuk",
      "explanation": "Kita harus berdoa ketika bingung untuk memohon petunjuk"
    },
    {
      "id": "agama_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika berhasil karena...",
      "options": ["Akan mendapat uang", "Mensyukuri keberhasilan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Mensyukuri keberhasilan",
      "explanation": "Kita harus berdoa ketika berhasil untuk mensyukuri keberhasilan"
    },
    {
      "id": "agama_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus berdoa ketika gagal karena...",
      "options": ["Akan mendapat uang", "Memohon kekuatan", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Memohon kekuatan",
      "explanation": "Kita harus berdoa ketika gagal untuk memohon kekuatan"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Quiz 10: Teknologi Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'Teknologi Dasar Kelas 1-3',
  'Quiz teknologi dasar untuk siswa SD kelas 1-3',
  'Technology',
  '[
    {
      "id": "tekno_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menelepon adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Telepon",
      "explanation": "Telepon adalah alat untuk menelepon"
    },
    {
      "id": "tekno_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menonton adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Televisi",
      "explanation": "Televisi adalah alat untuk menonton"
    },
    {
      "id": "tekno_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mendengarkan musik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Radio",
      "explanation": "Radio adalah alat untuk mendengarkan musik"
    },
    {
      "id": "tekno_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengetik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Komputer",
      "explanation": "Komputer adalah alat untuk mengetik"
    },
    {
      "id": "tekno_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengambil foto adalah...",
      "options": ["Kamera", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Kamera",
      "explanation": "Kamera adalah alat untuk mengambil foto"
    },
    {
      "id": "tekno_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mendengarkan musik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Radio",
      "explanation": "Radio adalah alat untuk mendengarkan musik"
    },
    {
      "id": "tekno_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menonton adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Televisi",
      "explanation": "Televisi adalah alat untuk menonton"
    },
    {
      "id": "tekno_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menelepon adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Telepon",
      "explanation": "Telepon adalah alat untuk menelepon"
    },
    {
      "id": "tekno_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengetik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Komputer",
      "explanation": "Komputer adalah alat untuk mengetik"
    },
    {
      "id": "tekno_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengambil foto adalah...",
      "options": ["Kamera", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Kamera",
      "explanation": "Kamera adalah alat untuk mengambil foto"
    },
    {
      "id": "tekno_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mendengarkan musik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Radio",
      "explanation": "Radio adalah alat untuk mendengarkan musik"
    },
    {
      "id": "tekno_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menonton adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Televisi",
      "explanation": "Televisi adalah alat untuk menonton"
    },
    {
      "id": "tekno_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menelepon adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Telepon",
      "explanation": "Telepon adalah alat untuk menelepon"
    },
    {
      "id": "tekno_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengetik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Komputer",
      "explanation": "Komputer adalah alat untuk mengetik"
    },
    {
      "id": "tekno_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengambil foto adalah...",
      "options": ["Kamera", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Kamera",
      "explanation": "Kamera adalah alat untuk mengambil foto"
    },
    {
      "id": "tekno_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mendengarkan musik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Radio",
      "explanation": "Radio adalah alat untuk mendengarkan musik"
    },
    {
      "id": "tekno_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menonton adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Televisi",
      "explanation": "Televisi adalah alat untuk menonton"
    },
    {
      "id": "tekno_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menelepon adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Telepon",
      "explanation": "Telepon adalah alat untuk menelepon"
    },
    {
      "id": "tekno_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengetik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Komputer",
      "explanation": "Komputer adalah alat untuk mengetik"
    },
    {
      "id": "tekno_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengambil foto adalah...",
      "options": ["Kamera", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Kamera",
      "explanation": "Kamera adalah alat untuk mengambil foto"
    },
    {
      "id": "tekno_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mendengarkan musik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Radio",
      "explanation": "Radio adalah alat untuk mendengarkan musik"
    },
    {
      "id": "tekno_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menonton adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Televisi",
      "explanation": "Televisi adalah alat untuk menonton"
    },
    {
      "id": "tekno_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menelepon adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Telepon",
      "explanation": "Telepon adalah alat untuk menelepon"
    },
    {
      "id": "tekno_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengetik adalah...",
      "options": ["Telepon", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Komputer",
      "explanation": "Komputer adalah alat untuk mengetik"
    },
    {
      "id": "tekno_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk mengambil foto adalah...",
      "options": ["Kamera", "Radio", "Televisi", "Komputer"],
      "correct_answer": "Kamera",
      "explanation": "Kamera adalah alat untuk mengambil foto"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Verifikasi semua data yang telah dibuat
SELECT 
  id,
  title,
  category,
  jsonb_array_length(questions) as jumlah_soal,
  created_at
FROM quizzes 
WHERE category IN ('Mathematics', 'Science', 'Language', 'General', 'Entertainment', 'Sports', 'Technology')
ORDER BY created_at;



