-- Script untuk membuat 7 quiz SD lainnya dengan kategori yang sesuai constraint
-- Setiap quiz memiliki 25 soal yang sesuai untuk siswa SD kelas 1-3

-- Quiz 4: IPS Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'IPS Dasar Kelas 1-3',
  'Quiz ilmu pengetahuan sosial dasar untuk siswa SD kelas 1-3',
  'General',
  '[
    {
      "id": "ips_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat tinggal keluarga disebut...",
      "options": ["Sekolah", "Rumah", "Kantor", "Toko"],
      "correct_answer": "Rumah",
      "explanation": "Rumah adalah tempat tinggal keluarga"
    },
    {
      "id": "ips_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat belajar siswa adalah...",
      "options": ["Rumah", "Sekolah", "Toko", "Kantor"],
      "correct_answer": "Sekolah",
      "explanation": "Sekolah adalah tempat belajar siswa"
    },
    {
      "id": "ips_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Orang yang mengajar di sekolah adalah...",
      "options": ["Dokter", "Guru", "Polisi", "Tukang"],
      "correct_answer": "Guru",
      "explanation": "Guru adalah orang yang mengajar di sekolah"
    },
    {
      "id": "ips_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat berbelanja kebutuhan sehari-hari adalah...",
      "options": ["Sekolah", "Rumah", "Pasar", "Kantor"],
      "correct_answer": "Pasar",
      "explanation": "Pasar adalah tempat berbelanja kebutuhan sehari-hari"
    },
    {
      "id": "ips_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Anggota keluarga yang paling tua biasanya adalah...",
      "options": ["Anak", "Ayah", "Ibu", "Kakek"],
      "correct_answer": "Kakek",
      "explanation": "Kakek biasanya adalah anggota keluarga yang paling tua"
    },
    {
      "id": "ips_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat ibadah umat Islam adalah...",
      "options": ["Gereja", "Masjid", "Pura", "Vihara"],
      "correct_answer": "Masjid",
      "explanation": "Masjid adalah tempat ibadah umat Islam"
    },
    {
      "id": "ips_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hari libur nasional di Indonesia adalah...",
      "options": ["Hari Senin", "Hari Kemerdekaan", "Hari Selasa", "Hari Rabu"],
      "correct_answer": "Hari Kemerdekaan",
      "explanation": "Hari Kemerdekaan adalah hari libur nasional"
    },
    {
      "id": "ips_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat bermain anak-anak adalah...",
      "options": ["Kantor", "Taman", "Toko", "Pasar"],
      "correct_answer": "Taman",
      "explanation": "Taman adalah tempat bermain anak-anak"
    },
    {
      "id": "ips_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Orang yang menjaga keamanan adalah...",
      "options": ["Dokter", "Guru", "Polisi", "Tukang"],
      "correct_answer": "Polisi",
      "explanation": "Polisi adalah orang yang menjaga keamanan"
    },
    {
      "id": "ips_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat berobat ketika sakit adalah...",
      "options": ["Sekolah", "Rumah", "Rumah sakit", "Toko"],
      "correct_answer": "Rumah sakit",
      "explanation": "Rumah sakit adalah tempat berobat ketika sakit"
    },
    {
      "id": "ips_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Anggota keluarga yang melahirkan kita adalah...",
      "options": ["Ayah", "Ibu", "Kakek", "Nenek"],
      "correct_answer": "Ibu",
      "explanation": "Ibu adalah yang melahirkan kita"
    },
    {
      "id": "ips_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat menabung uang adalah...",
      "options": ["Toko", "Bank", "Pasar", "Rumah"],
      "correct_answer": "Bank",
      "explanation": "Bank adalah tempat menabung uang"
    },
    {
      "id": "ips_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hari pertama dalam seminggu adalah...",
      "options": ["Senin", "Minggu", "Selasa", "Rabu"],
      "correct_answer": "Minggu",
      "explanation": "Minggu adalah hari pertama dalam seminggu"
    },
    {
      "id": "ips_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat berolahraga adalah...",
      "options": ["Toko", "Lapangan", "Pasar", "Kantor"],
      "correct_answer": "Lapangan",
      "explanation": "Lapangan adalah tempat berolahraga"
    },
    {
      "id": "ips_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Orang yang mengobati orang sakit adalah...",
      "options": ["Guru", "Polisi", "Dokter", "Tukang"],
      "correct_answer": "Dokter",
      "explanation": "Dokter adalah orang yang mengobati orang sakit"
    },
    {
      "id": "ips_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat membaca buku adalah...",
      "options": ["Pasar", "Perpustakaan", "Toko", "Kantor"],
      "correct_answer": "Perpustakaan",
      "explanation": "Perpustakaan adalah tempat membaca buku"
    },
    {
      "id": "ips_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Anggota keluarga yang masih kecil adalah...",
      "options": ["Ayah", "Ibu", "Anak", "Kakek"],
      "correct_answer": "Anak",
      "explanation": "Anak adalah anggota keluarga yang masih kecil"
    },
    {
      "id": "ips_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat membeli obat adalah...",
      "options": ["Toko", "Apotek", "Pasar", "Rumah"],
      "correct_answer": "Apotek",
      "explanation": "Apotek adalah tempat membeli obat"
    },
    {
      "id": "ips_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hari terakhir dalam seminggu adalah...",
      "options": ["Jumat", "Sabtu", "Minggu", "Senin"],
      "correct_answer": "Minggu",
      "explanation": "Minggu adalah hari terakhir dalam seminggu"
    },
    {
      "id": "ips_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat menunggu bus adalah...",
      "options": ["Terminal", "Toko", "Pasar", "Rumah"],
      "correct_answer": "Terminal",
      "explanation": "Terminal adalah tempat menunggu bus"
    },
    {
      "id": "ips_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Orang yang membuat rumah adalah...",
      "options": ["Dokter", "Guru", "Tukang", "Polisi"],
      "correct_answer": "Tukang",
      "explanation": "Tukang adalah orang yang membuat rumah"
    },
    {
      "id": "ips_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat beribadah umat Kristen adalah...",
      "options": ["Masjid", "Gereja", "Pura", "Vihara"],
      "correct_answer": "Gereja",
      "explanation": "Gereja adalah tempat beribadah umat Kristen"
    },
    {
      "id": "ips_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Anggota keluarga yang suka bercerita adalah...",
      "options": ["Ayah", "Ibu", "Nenek", "Anak"],
      "correct_answer": "Nenek",
      "explanation": "Nenek biasanya suka bercerita"
    },
    {
      "id": "ips_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tempat membeli makanan adalah...",
      "options": ["Toko", "Restoran", "Pasar", "Semua benar"],
      "correct_answer": "Semua benar",
      "explanation": "Toko, restoran, dan pasar adalah tempat membeli makanan"
    },
    {
      "id": "ips_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Hari yang paling banyak orang libur adalah...",
      "options": ["Senin", "Sabtu", "Minggu", "Selasa"],
      "correct_answer": "Minggu",
      "explanation": "Minggu adalah hari yang paling banyak orang libur"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Quiz 5: PKN Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'PKN Dasar Kelas 1-3',
  'Quiz pendidikan kewarganegaraan dasar untuk siswa SD kelas 1-3',
  'General',
  '[
    {
      "id": "pkn_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Lambang negara Indonesia adalah...",
      "options": ["Bendera", "Garuda Pancasila", "Lagu", "Tarian"],
      "correct_answer": "Garuda Pancasila",
      "explanation": "Garuda Pancasila adalah lambang negara Indonesia"
    },
    {
      "id": "pkn_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Warna bendera Indonesia adalah...",
      "options": ["Merah putih", "Merah biru", "Kuning hijau", "Hitam putih"],
      "correct_answer": "Merah putih",
      "explanation": "Bendera Indonesia berwarna merah putih"
    },
    {
      "id": "pkn_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menghormati orang yang lebih tua karena...",
      "options": ["Mereka lebih kaya", "Mereka lebih pintar", "Itu sopan santun", "Mereka lebih kuat"],
      "correct_answer": "Itu sopan santun",
      "explanation": "Menghormati orang yang lebih tua adalah sopan santun"
    },
    {
      "id": "pkn_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika bertemu guru, kita harus...",
      "options": ["Lari", "Menunduk", "Menyapa", "Diam"],
      "correct_answer": "Menyapa",
      "explanation": "Ketika bertemu guru, kita harus menyapa"
    },
    {
      "id": "pkn_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus membantu teman yang kesulitan karena...",
      "options": ["Akan mendapat uang", "Itu perbuatan baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Itu perbuatan baik",
      "explanation": "Membantu teman yang kesulitan adalah perbuatan baik"
    },
    {
      "id": "pkn_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang menangis, kita harus...",
      "options": ["Tertawa", "Menghibur", "Pergi", "Diam"],
      "correct_answer": "Menghibur",
      "explanation": "Ketika ada teman yang menangis, kita harus menghibur"
    },
    {
      "id": "pkn_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus mengucapkan terima kasih ketika...",
      "options": ["Dimarahi", "Diberi bantuan", "Dihukum", "Ditinggal"],
      "correct_answer": "Diberi bantuan",
      "explanation": "Kita harus mengucapkan terima kasih ketika diberi bantuan"
    },
    {
      "id": "pkn_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika melakukan kesalahan, kita harus...",
      "options": ["Lari", "Minta maaf", "Diam", "Tertawa"],
      "correct_answer": "Minta maaf",
      "explanation": "Ketika melakukan kesalahan, kita harus minta maaf"
    },
    {
      "id": "pkn_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menjaga kebersihan lingkungan karena...",
      "options": ["Akan mendapat uang", "Lingkungan jadi sehat", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Lingkungan jadi sehat",
      "explanation": "Menjaga kebersihan lingkungan membuat lingkungan jadi sehat"
    },
    {
      "id": "pkn_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang terjatuh, kita harus...",
      "options": ["Tertawa", "Membantu", "Pergi", "Diam"],
      "correct_answer": "Membantu",
      "explanation": "Ketika ada teman yang terjatuh, kita harus membantu"
    },
    {
      "id": "pkn_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menghargai perbedaan karena...",
      "options": ["Semua orang sama", "Itu perbuatan baik", "Akan mendapat uang", "Akan dipuji"],
      "correct_answer": "Itu perbuatan baik",
      "explanation": "Menghargai perbedaan adalah perbuatan baik"
    },
    {
      "id": "pkn_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika bermain bersama, kita harus...",
      "options": ["Bersaing", "Bekerja sama", "Sendiri", "Diam"],
      "correct_answer": "Bekerja sama",
      "explanation": "Ketika bermain bersama, kita harus bekerja sama"
    },
    {
      "id": "pkn_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus jujur karena...",
      "options": ["Akan mendapat uang", "Jujur itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Jujur itu baik",
      "explanation": "Jujur adalah perbuatan yang baik"
    },
    {
      "id": "pkn_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang sakit, kita harus...",
      "options": ["Tertawa", "Menjenguk", "Pergi", "Diam"],
      "correct_answer": "Menjenguk",
      "explanation": "Ketika ada teman yang sakit, kita harus menjenguk"
    },
    {
      "id": "pkn_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus disiplin karena...",
      "options": ["Akan mendapat uang", "Disiplin itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Disiplin itu baik",
      "explanation": "Disiplin adalah perbuatan yang baik"
    },
    {
      "id": "pkn_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang berulang tahun, kita harus...",
      "options": ["Tertawa", "Memberi selamat", "Pergi", "Diam"],
      "correct_answer": "Memberi selamat",
      "explanation": "Ketika ada teman yang berulang tahun, kita harus memberi selamat"
    },
    {
      "id": "pkn_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus bertanggung jawab karena...",
      "options": ["Akan mendapat uang", "Tanggung jawab itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Tanggung jawab itu baik",
      "explanation": "Bertanggung jawab adalah perbuatan yang baik"
    },
    {
      "id": "pkn_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang sedih, kita harus...",
      "options": ["Tertawa", "Menghibur", "Pergi", "Diam"],
      "correct_answer": "Menghibur",
      "explanation": "Ketika ada teman yang sedih, kita harus menghibur"
    },
    {
      "id": "pkn_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menghormati orang tua karena...",
      "options": ["Mereka lebih kaya", "Mereka lebih pintar", "Mereka membesarkan kita", "Mereka lebih kuat"],
      "correct_answer": "Mereka membesarkan kita",
      "explanation": "Kita harus menghormati orang tua karena mereka membesarkan kita"
    },
    {
      "id": "pkn_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang berprestasi, kita harus...",
      "options": ["Iri", "Memberi selamat", "Pergi", "Diam"],
      "correct_answer": "Memberi selamat",
      "explanation": "Ketika ada teman yang berprestasi, kita harus memberi selamat"
    },
    {
      "id": "pkn_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menjaga nama baik keluarga karena...",
      "options": ["Akan mendapat uang", "Itu tanggung jawab", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Itu tanggung jawab",
      "explanation": "Menjaga nama baik keluarga adalah tanggung jawab"
    },
    {
      "id": "pkn_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang kesulitan belajar, kita harus...",
      "options": ["Tertawa", "Membantu", "Pergi", "Diam"],
      "correct_answer": "Membantu",
      "explanation": "Ketika ada teman yang kesulitan belajar, kita harus membantu"
    },
    {
      "id": "pkn_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menghormati guru karena...",
      "options": ["Mereka lebih kaya", "Mereka mengajar kita", "Mereka lebih pintar", "Mereka lebih kuat"],
      "correct_answer": "Mereka mengajar kita",
      "explanation": "Kita harus menghormati guru karena mereka mengajar kita"
    },
    {
      "id": "pkn_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika ada teman yang berbuat salah, kita harus...",
      "options": ["Tertawa", "Menasehati", "Pergi", "Diam"],
      "correct_answer": "Menasehati",
      "explanation": "Ketika ada teman yang berbuat salah, kita harus menasehati"
    },
    {
      "id": "pkn_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Kita harus menjaga persatuan karena...",
      "options": ["Akan mendapat uang", "Persatuan itu penting", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Persatuan itu penting",
      "explanation": "Menjaga persatuan adalah hal yang penting"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);

-- Quiz 6: Seni Budaya Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'Seni Budaya Dasar Kelas 1-3',
  'Quiz seni budaya dasar untuk siswa SD kelas 1-3',
  'Entertainment',
  '[
    {
      "id": "senbud_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Warna primer adalah...",
      "options": ["Merah, kuning, biru", "Hijau, orange, ungu", "Hitam, putih, abu", "Merah, hijau, biru"],
      "correct_answer": "Merah, kuning, biru",
      "explanation": "Warna primer adalah merah, kuning, biru"
    },
    {
      "id": "senbud_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat untuk menggambar adalah...",
      "options": ["Pensil", "Sendok", "Garpu", "Piring"],
      "correct_answer": "Pensil",
      "explanation": "Pensil adalah alat untuk menggambar"
    },
    {
      "id": "senbud_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Lagu anak-anak yang terkenal adalah...",
      "options": ["Pelangi", "Lagu dewasa", "Lagu rock", "Lagu jazz"],
      "correct_answer": "Pelangi",
      "explanation": "Pelangi adalah lagu anak-anak yang terkenal"
    },
    {
      "id": "senbud_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tarian tradisional Indonesia adalah...",
      "options": ["Tari balet", "Tari saman", "Tari modern", "Tari hip hop"],
      "correct_answer": "Tari saman",
      "explanation": "Tari saman adalah tarian tradisional Indonesia"
    },
    {
      "id": "senbud_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat musik tradisional Indonesia adalah...",
      "options": ["Gitar", "Piano", "Angklung", "Drum"],
      "correct_answer": "Angklung",
      "explanation": "Angklung adalah alat musik tradisional Indonesia"
    },
    {
      "id": "senbud_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Warna yang menenangkan adalah...",
      "options": ["Merah", "Biru", "Kuning", "Orange"],
      "correct_answer": "Biru",
      "explanation": "Biru adalah warna yang menenangkan"
    },
    {
      "id": "senbud_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika menggambar, kita harus menggunakan...",
      "options": ["Kaki", "Tangan", "Kepala", "Perut"],
      "correct_answer": "Tangan",
      "explanation": "Ketika menggambar, kita harus menggunakan tangan"
    },
    {
      "id": "senbud_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Lagu yang dinyanyikan dengan gembira adalah...",
      "options": ["Lagu sedih", "Lagu ceria", "Lagu marah", "Lagu takut"],
      "correct_answer": "Lagu ceria",
      "explanation": "Lagu ceria dinyanyikan dengan gembira"
    },
    {
      "id": "senbud_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tarian yang dilakukan berkelompok adalah...",
      "options": ["Tari solo", "Tari berpasangan", "Tari kelompok", "Tari sendiri"],
      "correct_answer": "Tari kelompok",
      "explanation": "Tari kelompok dilakukan berkelompok"
    },
    {
      "id": "senbud_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat musik yang dipukul adalah...",
      "options": ["Gitar", "Piano", "Drum", "Seruling"],
      "correct_answer": "Drum",
      "explanation": "Drum adalah alat musik yang dipukul"
    },
    {
      "id": "senbud_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Warna yang hangat adalah...",
      "options": ["Biru", "Merah", "Hijau", "Ungu"],
      "correct_answer": "Merah",
      "explanation": "Merah adalah warna yang hangat"
    },
    {
      "id": "senbud_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika bernyanyi, kita harus menggunakan...",
      "options": ["Kaki", "Suara", "Kepala", "Perut"],
      "correct_answer": "Suara",
      "explanation": "Ketika bernyanyi, kita harus menggunakan suara"
    },
    {
      "id": "senbud_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Lagu yang dinyanyikan dengan lembut adalah...",
      "options": ["Lagu keras", "Lagu lembut", "Lagu marah", "Lagu takut"],
      "correct_answer": "Lagu lembut",
      "explanation": "Lagu lembut dinyanyikan dengan lembut"
    },
    {
      "id": "senbud_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tarian yang dilakukan berdua adalah...",
      "options": ["Tari solo", "Tari berpasangan", "Tari kelompok", "Tari sendiri"],
      "correct_answer": "Tari berpasangan",
      "explanation": "Tari berpasangan dilakukan berdua"
    },
    {
      "id": "senbud_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat musik yang ditiup adalah...",
      "options": ["Gitar", "Piano", "Seruling", "Drum"],
      "correct_answer": "Seruling",
      "explanation": "Seruling adalah alat musik yang ditiup"
    },
    {
      "id": "senbud_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Warna yang sejuk adalah...",
      "options": ["Merah", "Hijau", "Kuning", "Orange"],
      "correct_answer": "Hijau",
      "explanation": "Hijau adalah warna yang sejuk"
    },
    {
      "id": "senbud_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika menari, kita harus menggunakan...",
      "options": ["Kaki", "Tangan", "Kepala", "Semua benar"],
      "correct_answer": "Semua benar",
      "explanation": "Ketika menari, kita menggunakan kaki, tangan, dan kepala"
    },
    {
      "id": "senbud_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Lagu yang dinyanyikan dengan sedih adalah...",
      "options": ["Lagu ceria", "Lagu sedih", "Lagu marah", "Lagu takut"],
      "correct_answer": "Lagu sedih",
      "explanation": "Lagu sedih dinyanyikan dengan sedih"
    },
    {
      "id": "senbud_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tarian yang dilakukan sendiri adalah...",
      "options": ["Tari solo", "Tari berpasangan", "Tari kelompok", "Tari berdua"],
      "correct_answer": "Tari solo",
      "explanation": "Tari solo dilakukan sendiri"
    },
    {
      "id": "senbud_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Alat musik yang dipetik adalah...",
      "options": ["Gitar", "Piano", "Drum", "Seruling"],
      "correct_answer": "Gitar",
      "explanation": "Gitar adalah alat musik yang dipetik"
    },
    {
      "id": "senbud_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Warna yang cerah adalah...",
      "options": ["Hitam", "Kuning", "Abu-abu", "Coklat"],
      "correct_answer": "Kuning",
      "explanation": "Kuning adalah warna yang cerah"
    },
    {
      "id": "senbud_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Ketika bermain musik, kita harus menggunakan...",
      "options": ["Kaki", "Tangan", "Kepala", "Perut"],
      "correct_answer": "Tangan",
      "explanation": "Ketika bermain musik, kita harus menggunakan tangan"
    },
    {
      "id": "senbud_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Lagu yang dinyanyikan dengan keras adalah...",
      "options": ["Lagu lembut", "Lagu keras", "Lagu sedih", "Lagu takut"],
      "correct_answer": "Lagu keras",
      "explanation": "Lagu keras dinyanyikan dengan keras"
    },
    {
      "id": "senbud_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Tarian yang dilakukan dengan cepat adalah...",
      "options": ["Tari lambat", "Tari cepat", "Tari sedang", "Tari diam"],
      "correct_answer": "Tari cepat",
      "explanation": "Tari cepat dilakukan dengan cepat"
    },
    {
      "id": "senbud_25",
      "type": "multiple_choice",
      "points": 4,
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
  'Sports',
  '[
    {
      "id": "pjok_1",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang baik untuk kesehatan adalah...",
      "options": ["Tidur", "Lari", "Makan", "Duduk"],
      "correct_answer": "Lari",
      "explanation": "Lari adalah olahraga yang baik untuk kesehatan"
    },
    {
      "id": "pjok_2",
      "type": "multiple_choice",
      "points": 4,
      "question": "Sebelum berolahraga, kita harus...",
      "options": ["Makan banyak", "Pemanasan", "Tidur", "Duduk"],
      "correct_answer": "Pemanasan",
      "explanation": "Sebelum berolahraga, kita harus pemanasan"
    },
    {
      "id": "pjok_3",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan bola adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Sepak bola",
      "explanation": "Sepak bola adalah olahraga yang dilakukan dengan bola"
    },
    {
      "id": "pjok_4",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan di air adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Renang",
      "explanation": "Renang adalah olahraga yang dilakukan di air"
    },
    {
      "id": "pjok_5",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan melompat adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat jauh"],
      "correct_answer": "Lompat jauh",
      "explanation": "Lompat jauh adalah olahraga yang dilakukan dengan melompat"
    },
    {
      "id": "pjok_6",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan tangan adalah...",
      "options": ["Lari", "Sepak bola", "Basket", "Renang"],
      "correct_answer": "Basket",
      "explanation": "Basket adalah olahraga yang dilakukan dengan tangan"
    },
    {
      "id": "pjok_7",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan kaki adalah...",
      "options": ["Basket", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Sepak bola",
      "explanation": "Sepak bola adalah olahraga yang dilakukan dengan kaki"
    },
    {
      "id": "pjok_8",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan raket adalah...",
      "options": ["Lari", "Sepak bola", "Bulu tangkis", "Renang"],
      "correct_answer": "Bulu tangkis",
      "explanation": "Bulu tangkis adalah olahraga yang dilakukan dengan raket"
    },
    {
      "id": "pjok_9",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan sepeda adalah...",
      "options": ["Lari", "Bersepeda", "Renang", "Lompat"],
      "correct_answer": "Bersepeda",
      "explanation": "Bersepeda adalah olahraga yang dilakukan dengan sepeda"
    },
    {
      "id": "pjok_10",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berjalan adalah...",
      "options": ["Lari", "Jalan cepat", "Renang", "Lompat"],
      "correct_answer": "Jalan cepat",
      "explanation": "Jalan cepat adalah olahraga yang dilakukan dengan berjalan"
    },
    {
      "id": "pjok_11",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan melempar adalah...",
      "options": ["Lari", "Lempar lembing", "Renang", "Lompat"],
      "correct_answer": "Lempar lembing",
      "explanation": "Lempar lembing adalah olahraga yang dilakukan dengan melempar"
    },
    {
      "id": "pjok_12",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan memanjat adalah...",
      "options": ["Lari", "Panjat tebing", "Renang", "Lompat"],
      "correct_answer": "Panjat tebing",
      "explanation": "Panjat tebing adalah olahraga yang dilakukan dengan memanjat"
    },
    {
      "id": "pjok_13",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Renang",
      "explanation": "Renang adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_14",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari",
      "explanation": "Lari adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_15",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan melompat adalah...",
      "options": ["Lari", "Sepak bola", "Renang", "Lompat tinggi"],
      "correct_answer": "Lompat tinggi",
      "explanation": "Lompat tinggi adalah olahraga yang dilakukan dengan melompat"
    },
    {
      "id": "pjok_16",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya bebas", "Lompat"],
      "correct_answer": "Renang gaya bebas",
      "explanation": "Renang gaya bebas adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_17",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya dada", "Lompat"],
      "correct_answer": "Renang gaya dada",
      "explanation": "Renang gaya dada adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_18",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya punggung", "Lompat"],
      "correct_answer": "Renang gaya punggung",
      "explanation": "Renang gaya punggung adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_19",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berenang adalah...",
      "options": ["Lari", "Sepak bola", "Renang gaya kupu-kupu", "Lompat"],
      "correct_answer": "Renang gaya kupu-kupu",
      "explanation": "Renang gaya kupu-kupu adalah olahraga yang dilakukan dengan berenang"
    },
    {
      "id": "pjok_20",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari jarak pendek", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari jarak pendek",
      "explanation": "Lari jarak pendek adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_21",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari jarak jauh", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari jarak jauh",
      "explanation": "Lari jarak jauh adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_22",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari estafet", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari estafet",
      "explanation": "Lari estafet adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_23",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari marathon", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari marathon",
      "explanation": "Lari marathon adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_24",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari sprint", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari sprint",
      "explanation": "Lari sprint adalah olahraga yang dilakukan dengan berlari"
    },
    {
      "id": "pjok_25",
      "type": "multiple_choice",
      "points": 4,
      "question": "Olahraga yang dilakukan dengan berlari adalah...",
      "options": ["Lari cross country", "Sepak bola", "Renang", "Lompat"],
      "correct_answer": "Lari cross country",
      "explanation": "Lari cross country adalah olahraga yang dilakukan dengan berlari"
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
WHERE category IN ('General', 'Entertainment', 'Sports')
ORDER BY created_at;



