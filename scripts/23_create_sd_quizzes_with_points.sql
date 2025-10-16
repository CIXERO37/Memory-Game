-- Script untuk membuat 3 quiz SD pertama dengan field points yang benar
-- Setiap quiz memiliki 25 soal yang sesuai untuk siswa SD kelas 1-3

-- Quiz 1: Matematika Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'Matematika Dasar Kelas 1-3',
  'Quiz matematika dasar untuk siswa SD kelas 1-3',
  'Mathematics',
  '[
    {
      "id": "math_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 2 + 3?",
      "options": ["4", "5", "6", "7"],
      "correct_answer": "5",
      "explanation": "2 + 3 = 5"
    },
    {
      "id": "math_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 8 - 3?",
      "options": ["4", "5", "6", "7"],
      "correct_answer": "5",
      "explanation": "8 - 3 = 5"
    },
    {
      "id": "math_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 4 × 2?",
      "options": ["6", "7", "8", "9"],
      "correct_answer": "8",
      "explanation": "4 × 2 = 8"
    },
    {
      "id": "math_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 12 ÷ 3?",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "4",
      "explanation": "12 ÷ 3 = 4"
    },
    {
      "id": "math_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Angka berapa yang lebih besar: 15 atau 12?",
      "options": ["12", "15", "Sama besar", "Tidak tahu"],
      "correct_answer": "15",
      "explanation": "15 lebih besar dari 12"
    },
    {
      "id": "math_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 7 + 8?",
      "options": ["14", "15", "16", "17"],
      "correct_answer": "15",
      "explanation": "7 + 8 = 15"
    },
    {
      "id": "math_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 20 - 6?",
      "options": ["13", "14", "15", "16"],
      "correct_answer": "14",
      "explanation": "20 - 6 = 14"
    },
    {
      "id": "math_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 3 × 4?",
      "options": ["10", "11", "12", "13"],
      "correct_answer": "12",
      "explanation": "3 × 4 = 12"
    },
    {
      "id": "math_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 18 ÷ 2?",
      "options": ["8", "9", "10", "11"],
      "correct_answer": "9",
      "explanation": "18 ÷ 2 = 9"
    },
    {
      "id": "math_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bentuk geometri yang memiliki 3 sisi adalah...",
      "options": ["Persegi", "Segitiga", "Lingkaran", "Persegi panjang"],
      "correct_answer": "Segitiga",
      "explanation": "Segitiga memiliki 3 sisi"
    },
    {
      "id": "math_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 9 + 7?",
      "options": ["15", "16", "17", "18"],
      "correct_answer": "16",
      "explanation": "9 + 7 = 16"
    },
    {
      "id": "math_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 25 - 8?",
      "options": ["16", "17", "18", "19"],
      "correct_answer": "17",
      "explanation": "25 - 8 = 17"
    },
    {
      "id": "math_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 5 × 3?",
      "options": ["14", "15", "16", "17"],
      "correct_answer": "15",
      "explanation": "5 × 3 = 15"
    },
    {
      "id": "math_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 24 ÷ 4?",
      "options": ["5", "6", "7", "8"],
      "correct_answer": "6",
      "explanation": "24 ÷ 4 = 6"
    },
    {
      "id": "math_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Angka genap adalah...",
      "options": ["1, 3, 5", "2, 4, 6", "7, 9, 11", "Semua benar"],
      "correct_answer": "2, 4, 6",
      "explanation": "Angka genap adalah 2, 4, 6, 8, 10, dst"
    },
    {
      "id": "math_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 11 + 9?",
      "options": ["19", "20", "21", "22"],
      "correct_answer": "20",
      "explanation": "11 + 9 = 20"
    },
    {
      "id": "math_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 30 - 12?",
      "options": ["17", "18", "19", "20"],
      "correct_answer": "18",
      "explanation": "30 - 12 = 18"
    },
    {
      "id": "math_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 6 × 5?",
      "options": ["28", "29", "30", "31"],
      "correct_answer": "30",
      "explanation": "6 × 5 = 30"
    },
    {
      "id": "math_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 35 ÷ 5?",
      "options": ["6", "7", "8", "9"],
      "correct_answer": "7",
      "explanation": "35 ÷ 5 = 7"
    },
    {
      "id": "math_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bentuk geometri yang memiliki 4 sisi sama panjang adalah...",
      "options": ["Persegi panjang", "Segitiga", "Persegi", "Lingkaran"],
      "correct_answer": "Persegi",
      "explanation": "Persegi memiliki 4 sisi yang sama panjang"
    },
    {
      "id": "math_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 13 + 8?",
      "options": ["20", "21", "22", "23"],
      "correct_answer": "21",
      "explanation": "13 + 8 = 21"
    },
    {
      "id": "math_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 40 - 15?",
      "options": ["24", "25", "26", "27"],
      "correct_answer": "25",
      "explanation": "40 - 15 = 25"
    },
    {
      "id": "math_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 7 × 6?",
      "options": ["40", "41", "42", "43"],
      "correct_answer": "42",
      "explanation": "7 × 6 = 42"
    },
    {
      "id": "math_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Berapa hasil dari 48 ÷ 6?",
      "options": ["7", "8", "9", "10"],
      "correct_answer": "8",
      "explanation": "48 ÷ 6 = 8"
    },
    {
      "id": "math_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Angka ganjil adalah...",
      "options": ["2, 4, 6", "1, 3, 5", "8, 10, 12", "Semua salah"],
      "correct_answer": "1, 3, 5",
      "explanation": "Angka ganjil adalah 1, 3, 5, 7, 9, dst"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Quiz 2: IPA Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'IPA Dasar Kelas 1-3',
  'Quiz ilmu pengetahuan alam dasar untuk siswa SD kelas 1-3',
  'Science',
  '[
    {
      "id": "ipa_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang hidup di air adalah...",
      "options": ["Kucing", "Ikan", "Burung", "Sapi"],
      "correct_answer": "Ikan",
      "explanation": "Ikan hidup di air"
    },
    {
      "id": "ipa_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tumbuhan hijau membuat makanan dengan bantuan...",
      "options": ["Cahaya matahari", "Air hujan", "Angin", "Tanah"],
      "correct_answer": "Cahaya matahari",
      "explanation": "Tumbuhan hijau membuat makanan dengan fotosintesis menggunakan cahaya matahari"
    },
    {
      "id": "ipa_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bagian tubuh manusia untuk bernapas adalah...",
      "options": ["Hati", "Paru-paru", "Ginjal", "Lambung"],
      "correct_answer": "Paru-paru",
      "explanation": "Paru-paru adalah organ untuk bernapas"
    },
    {
      "id": "ipa_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Air yang menguap akan berubah menjadi...",
      "options": ["Es", "Uap air", "Salju", "Embun"],
      "correct_answer": "Uap air",
      "explanation": "Air yang menguap berubah menjadi uap air"
    },
    {
      "id": "ipa_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang bertelur adalah...",
      "options": ["Sapi", "Ayam", "Kucing", "Anjing"],
      "correct_answer": "Ayam",
      "explanation": "Ayam adalah hewan yang bertelur"
    },
    {
      "id": "ipa_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Warna daun yang sehat adalah...",
      "options": ["Merah", "Kuning", "Hijau", "Putih"],
      "correct_answer": "Hijau",
      "explanation": "Daun yang sehat berwarna hijau karena mengandung klorofil"
    },
    {
      "id": "ipa_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bagian tumbuhan yang ada di dalam tanah adalah...",
      "options": ["Daun", "Bunga", "Akar", "Batang"],
      "correct_answer": "Akar",
      "explanation": "Akar tumbuhan berada di dalam tanah"
    },
    {
      "id": "ipa_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang bisa terbang adalah...",
      "options": ["Kuda", "Burung", "Ikan", "Kucing"],
      "correct_answer": "Burung",
      "explanation": "Burung memiliki sayap untuk terbang"
    },
    {
      "id": "ipa_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Sumber energi utama di bumi adalah...",
      "options": ["Bulan", "Matahari", "Bintang", "Planet"],
      "correct_answer": "Matahari",
      "explanation": "Matahari adalah sumber energi utama di bumi"
    },
    {
      "id": "ipa_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang hidup di darat adalah...",
      "options": ["Ikan", "Paus", "Kucing", "Hiu"],
      "correct_answer": "Kucing",
      "explanation": "Kucing adalah hewan yang hidup di darat"
    },
    {
      "id": "ipa_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bagian tubuh untuk melihat adalah...",
      "options": ["Telinga", "Hidung", "Mata", "Mulut"],
      "correct_answer": "Mata",
      "explanation": "Mata adalah organ untuk melihat"
    },
    {
      "id": "ipa_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tumbuhan membutuhkan air untuk...",
      "options": ["Berenang", "Minum", "Tumbuh", "Bermain"],
      "correct_answer": "Tumbuh",
      "explanation": "Tumbuhan membutuhkan air untuk tumbuh dan hidup"
    },
    {
      "id": "ipa_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang memiliki cangkang adalah...",
      "options": ["Kucing", "Siput", "Burung", "Ikan"],
      "correct_answer": "Siput",
      "explanation": "Siput memiliki cangkang untuk melindungi tubuhnya"
    },
    {
      "id": "ipa_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Udara yang kita hirup mengandung...",
      "options": ["Air", "Oksigen", "Tanah", "Batu"],
      "correct_answer": "Oksigen",
      "explanation": "Udara yang kita hirup mengandung oksigen"
    },
    {
      "id": "ipa_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang memiliki bulu adalah...",
      "options": ["Ikan", "Katak", "Burung", "Ular"],
      "correct_answer": "Burung",
      "explanation": "Burung memiliki bulu untuk terbang dan menghangatkan tubuh"
    },
    {
      "id": "ipa_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bagian tumbuhan yang berwarna-warni adalah...",
      "options": ["Akar", "Batang", "Bunga", "Daun"],
      "correct_answer": "Bunga",
      "explanation": "Bunga biasanya berwarna-warni dan indah"
    },
    {
      "id": "ipa_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang hidup di hutan adalah...",
      "options": ["Ikan", "Harimau", "Paus", "Hiu"],
      "correct_answer": "Harimau",
      "explanation": "Harimau hidup di hutan"
    },
    {
      "id": "ipa_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tumbuhan yang bisa dimakan adalah...",
      "options": ["Batu", "Kayu", "Sayuran", "Pasir"],
      "correct_answer": "Sayuran",
      "explanation": "Sayuran adalah bagian tumbuhan yang bisa dimakan"
    },
    {
      "id": "ipa_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang memiliki kaki empat adalah...",
      "options": ["Burung", "Ikan", "Kucing", "Ular"],
      "correct_answer": "Kucing",
      "explanation": "Kucing memiliki empat kaki"
    },
    {
      "id": "ipa_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Air yang dingin akan berubah menjadi...",
      "options": ["Uap", "Es", "Asap", "Angin"],
      "correct_answer": "Es",
      "explanation": "Air yang dingin akan membeku menjadi es"
    },
    {
      "id": "ipa_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bagian tubuh untuk mendengar adalah...",
      "options": ["Mata", "Hidung", "Telinga", "Mulut"],
      "correct_answer": "Telinga",
      "explanation": "Telinga adalah organ untuk mendengar"
    },
    {
      "id": "ipa_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang hidup di laut adalah...",
      "options": ["Kucing", "Sapi", "Ikan", "Ayam"],
      "correct_answer": "Ikan",
      "explanation": "Banyak ikan yang hidup di laut"
    },
    {
      "id": "ipa_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tumbuhan membutuhkan cahaya matahari untuk...",
      "options": ["Berenang", "Membuat makanan", "Bermain", "Tidur"],
      "correct_answer": "Membuat makanan",
      "explanation": "Tumbuhan menggunakan cahaya matahari untuk fotosintesis"
    },
    {
      "id": "ipa_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hewan yang memiliki sayap adalah...",
      "options": ["Kucing", "Sapi", "Burung", "Ikan"],
      "correct_answer": "Burung",
      "explanation": "Burung memiliki sayap untuk terbang"
    },
    {
      "id": "ipa_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Bagian tumbuhan yang menyerap air dari tanah adalah...",
      "options": ["Daun", "Bunga", "Akar", "Batang"],
      "correct_answer": "Akar",
      "explanation": "Akar menyerap air dan nutrisi dari tanah"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Quiz 3: Bahasa Indonesia Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'Bahasa Indonesia Dasar Kelas 1-3',
  'Quiz bahasa Indonesia dasar untuk siswa SD kelas 1-3',
  'Language',
  '[
    {
      "id": "bindo_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Huruf pertama dalam alfabet adalah...",
      "options": ["B", "A", "C", "D"],
      "correct_answer": "A",
      "explanation": "Huruf pertama dalam alfabet adalah A"
    },
    {
      "id": "bindo_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan nama orang adalah...",
      "options": ["Makan", "Siti", "Pergi", "Bermain"],
      "correct_answer": "Siti",
      "explanation": "Siti adalah nama orang"
    },
    {
      "id": "bindo_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan tempat adalah...",
      "options": ["Makan", "Rumah", "Pergi", "Bermain"],
      "correct_answer": "Rumah",
      "explanation": "Rumah adalah kata yang menunjukkan tempat"
    },
    {
      "id": "bindo_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Huruf vokal adalah...",
      "options": ["A, I, U, E, O", "B, C, D, F, G", "H, J, K, L, M", "N, P, Q, R, S"],
      "correct_answer": "A, I, U, E, O",
      "explanation": "Huruf vokal adalah A, I, U, E, O"
    },
    {
      "id": "bindo_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan perbuatan adalah...",
      "options": ["Buku", "Makan", "Meja", "Kursi"],
      "correct_answer": "Makan",
      "explanation": "Makan adalah kata kerja yang menunjukkan perbuatan"
    },
    {
      "id": "bindo_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kalimat yang benar adalah...",
      "options": ["Saya pergi sekolah", "Saya pergi ke sekolah", "Saya pergi sekolah ke", "Saya ke pergi sekolah"],
      "correct_answer": "Saya pergi ke sekolah",
      "explanation": "Kalimat yang benar adalah Saya pergi ke sekolah"
    },
    {
      "id": "bindo_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata tanya untuk menanyakan tempat adalah...",
      "options": ["Apa", "Siapa", "Di mana", "Kapan"],
      "correct_answer": "Di mana",
      "explanation": "Di mana digunakan untuk menanyakan tempat"
    },
    {
      "id": "bindo_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Huruf kapital digunakan untuk...",
      "options": ["Akhir kalimat", "Awal kalimat", "Tengah kalimat", "Semua huruf"],
      "correct_answer": "Awal kalimat",
      "explanation": "Huruf kapital digunakan di awal kalimat"
    },
    {
      "id": "bindo_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan benda adalah...",
      "options": ["Lari", "Buku", "Tidur", "Makan"],
      "correct_answer": "Buku",
      "explanation": "Buku adalah kata benda"
    },
    {
      "id": "bindo_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tanda baca untuk mengakhiri kalimat tanya adalah...",
      "options": [".", "!", "?", ","],
      "correct_answer": "?",
      "explanation": "Tanda tanya (?) digunakan untuk mengakhiri kalimat tanya"
    },
    {
      "id": "bindo_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan warna adalah...",
      "options": ["Besar", "Merah", "Tinggi", "Cepat"],
      "correct_answer": "Merah",
      "explanation": "Merah adalah kata yang menunjukkan warna"
    },
    {
      "id": "bindo_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kalimat yang menggunakan kata dan adalah...",
      "options": ["Saya makan", "Saya makan dan minum", "Saya makan atau minum", "Saya makan tetapi minum"],
      "correct_answer": "Saya makan dan minum",
      "explanation": "Kata dan digunakan untuk menggabungkan dua hal"
    },
    {
      "id": "bindo_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan ukuran adalah...",
      "options": ["Biru", "Besar", "Pergi", "Makan"],
      "correct_answer": "Besar",
      "explanation": "Besar adalah kata yang menunjukkan ukuran"
    },
    {
      "id": "bindo_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Huruf yang sama dalam kata mama adalah...",
      "options": ["M dan A", "M dan M", "A dan A", "Semua benar"],
      "correct_answer": "Semua benar",
      "explanation": "Dalam kata mama ada huruf M dan A yang sama"
    },
    {
      "id": "bindo_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan waktu adalah...",
      "options": ["Pagi", "Rumah", "Makan", "Buku"],
      "correct_answer": "Pagi",
      "explanation": "Pagi adalah kata yang menunjukkan waktu"
    },
    {
      "id": "bindo_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kalimat yang sopan adalah...",
      "options": ["Kasih aku!", "Tolong berikan", "Ambil itu!", "Cepat datang!"],
      "correct_answer": "Tolong berikan",
      "explanation": "Kalimat Tolong berikan lebih sopan"
    },
    {
      "id": "bindo_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan jumlah adalah...",
      "options": ["Satu", "Merah", "Pergi", "Makan"],
      "correct_answer": "Satu",
      "explanation": "Satu adalah kata yang menunjukkan jumlah"
    },
    {
      "id": "bindo_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Huruf konsonan adalah...",
      "options": ["A, I, U", "B, C, D", "E, O", "Semua huruf"],
      "correct_answer": "B, C, D",
      "explanation": "Huruf konsonan adalah semua huruf selain vokal"
    },
    {
      "id": "bindo_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan perasaan adalah...",
      "options": ["Senang", "Rumah", "Makan", "Buku"],
      "correct_answer": "Senang",
      "explanation": "Senang adalah kata yang menunjukkan perasaan"
    },
    {
      "id": "bindo_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tanda baca untuk mengakhiri kalimat berita adalah...",
      "options": ["?", "!", ".", ","],
      "correct_answer": ".",
      "explanation": "Tanda titik (.) digunakan untuk mengakhiri kalimat berita"
    },
    {
      "id": "bindo_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan arah adalah...",
      "options": ["Kanan", "Merah", "Makan", "Buku"],
      "correct_answer": "Kanan",
      "explanation": "Kanan adalah kata yang menunjukkan arah"
    },
    {
      "id": "bindo_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kalimat yang menggunakan kata atau adalah...",
      "options": ["Saya makan", "Saya makan dan minum", "Saya makan atau minum", "Saya makan tetapi minum"],
      "correct_answer": "Saya makan atau minum",
      "explanation": "Kata atau digunakan untuk memilih salah satu"
    },
    {
      "id": "bindo_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan bentuk adalah...",
      "options": ["Bulat", "Merah", "Pergi", "Makan"],
      "correct_answer": "Bulat",
      "explanation": "Bulat adalah kata yang menunjukkan bentuk"
    },
    {
      "id": "bindo_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Huruf yang berbeda dalam kata buku adalah...",
      "options": ["B dan U", "B dan K", "K dan U", "Semua sama"],
      "correct_answer": "B dan U",
      "explanation": "Dalam kata buku, huruf B dan U berbeda"
    },
    {
      "id": "bindo_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kata yang menunjukkan suara adalah...",
      "options": ["Keras", "Rumah", "Makan", "Buku"],
      "correct_answer": "Keras",
      "explanation": "Keras adalah kata yang menunjukkan suara"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Verifikasi data yang telah dibuat
SELECT 
  id,
  title,
  category,
  jsonb_array_length(questions) as jumlah_soal,
  created_at
FROM quizzes 
WHERE category IN ('Mathematics', 'Science', 'Language')
ORDER BY created_at;
