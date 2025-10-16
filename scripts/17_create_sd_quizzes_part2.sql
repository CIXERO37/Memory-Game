-- Lanjutan script untuk membuat 10 quiz SD dengan masing-masing 25 soal
-- Quiz 4-10: IPS, PKN, Seni Budaya, PJOK, Bahasa Inggris, Agama, Teknologi

-- Quiz 4: IPS Dasar
INSERT INTO quizzes (id, title, description, category, questions, created_at, updated_at) VALUES (
  gen_random_uuid(),
  'IPS Dasar Kelas 1-3',
  'Quiz ilmu pengetahuan sosial dasar untuk siswa SD kelas 1-3',
  'IPS',
  '[
    {
      "id": "ips_1",
      "type": "multiple_choice",
      "question": "Tempat tinggal keluarga disebut...",
      "options": ["Sekolah", "Rumah", "Kantor", "Toko"],
      "correct_answer": "Rumah",
      "explanation": "Rumah adalah tempat tinggal keluarga"
    },
    {
      "id": "ips_2",
      "type": "multiple_choice",
      "question": "Tempat belajar siswa adalah...",
      "options": ["Rumah", "Sekolah", "Toko", "Kantor"],
      "correct_answer": "Sekolah",
      "explanation": "Sekolah adalah tempat belajar siswa"
    },
    {
      "id": "ips_3",
      "type": "multiple_choice",
      "question": "Orang yang mengajar di sekolah adalah...",
      "options": ["Dokter", "Guru", "Polisi", "Tukang"],
      "correct_answer": "Guru",
      "explanation": "Guru adalah orang yang mengajar di sekolah"
    },
    {
      "id": "ips_4",
      "type": "multiple_choice",
      "question": "Tempat berbelanja kebutuhan sehari-hari adalah...",
      "options": ["Sekolah", "Rumah", "Pasar", "Kantor"],
      "correct_answer": "Pasar",
      "explanation": "Pasar adalah tempat berbelanja kebutuhan sehari-hari"
    },
    {
      "id": "ips_5",
      "type": "multiple_choice",
      "question": "Anggota keluarga yang paling tua biasanya adalah...",
      "options": ["Anak", "Ayah", "Ibu", "Kakek"],
      "correct_answer": "Kakek",
      "explanation": "Kakek biasanya adalah anggota keluarga yang paling tua"
    },
    {
      "id": "ips_6",
      "type": "multiple_choice",
      "question": "Tempat ibadah umat Islam adalah...",
      "options": ["Gereja", "Masjid", "Pura", "Vihara"],
      "correct_answer": "Masjid",
      "explanation": "Masjid adalah tempat ibadah umat Islam"
    },
    {
      "id": "ips_7",
      "type": "multiple_choice",
      "question": "Hari libur nasional di Indonesia adalah...",
      "options": ["Hari Senin", "Hari Kemerdekaan", "Hari Selasa", "Hari Rabu"],
      "correct_answer": "Hari Kemerdekaan",
      "explanation": "Hari Kemerdekaan adalah hari libur nasional"
    },
    {
      "id": "ips_8",
      "type": "multiple_choice",
      "question": "Tempat bermain anak-anak adalah...",
      "options": ["Kantor", "Taman", "Toko", "Pasar"],
      "correct_answer": "Taman",
      "explanation": "Taman adalah tempat bermain anak-anak"
    },
    {
      "id": "ips_9",
      "type": "multiple_choice",
      "question": "Orang yang menjaga keamanan adalah...",
      "options": ["Dokter", "Guru", "Polisi", "Tukang"],
      "correct_answer": "Polisi",
      "explanation": "Polisi adalah orang yang menjaga keamanan"
    },
    {
      "id": "ips_10",
      "type": "multiple_choice",
      "question": "Tempat berobat ketika sakit adalah...",
      "options": ["Sekolah", "Rumah", "Rumah sakit", "Toko"],
      "correct_answer": "Rumah sakit",
      "explanation": "Rumah sakit adalah tempat berobat ketika sakit"
    },
    {
      "id": "ips_11",
      "type": "multiple_choice",
      "question": "Anggota keluarga yang melahirkan kita adalah...",
      "options": ["Ayah", "Ibu", "Kakek", "Nenek"],
      "correct_answer": "Ibu",
      "explanation": "Ibu adalah yang melahirkan kita"
    },
    {
      "id": "ips_12",
      "type": "multiple_choice",
      "question": "Tempat menabung uang adalah...",
      "options": ["Toko", "Bank", "Pasar", "Rumah"],
      "correct_answer": "Bank",
      "explanation": "Bank adalah tempat menabung uang"
    },
    {
      "id": "ips_13",
      "type": "multiple_choice",
      "question": "Hari pertama dalam seminggu adalah...",
      "options": ["Senin", "Minggu", "Selasa", "Rabu"],
      "correct_answer": "Minggu",
      "explanation": "Minggu adalah hari pertama dalam seminggu"
    },
    {
      "id": "ips_14",
      "type": "multiple_choice",
      "question": "Tempat berolahraga adalah...",
      "options": ["Toko", "Lapangan", "Pasar", "Kantor"],
      "correct_answer": "Lapangan",
      "explanation": "Lapangan adalah tempat berolahraga"
    },
    {
      "id": "ips_15",
      "type": "multiple_choice",
      "question": "Orang yang mengobati orang sakit adalah...",
      "options": ["Guru", "Polisi", "Dokter", "Tukang"],
      "correct_answer": "Dokter",
      "explanation": "Dokter adalah orang yang mengobati orang sakit"
    },
    {
      "id": "ips_16",
      "type": "multiple_choice",
      "question": "Tempat membaca buku adalah...",
      "options": ["Pasar", "Perpustakaan", "Toko", "Kantor"],
      "correct_answer": "Perpustakaan",
      "explanation": "Perpustakaan adalah tempat membaca buku"
    },
    {
      "id": "ips_17",
      "type": "multiple_choice",
      "question": "Anggota keluarga yang masih kecil adalah...",
      "options": ["Ayah", "Ibu", "Anak", "Kakek"],
      "correct_answer": "Anak",
      "explanation": "Anak adalah anggota keluarga yang masih kecil"
    },
    {
      "id": "ips_18",
      "type": "multiple_choice",
      "question": "Tempat membeli obat adalah...",
      "options": ["Toko", "Apotek", "Pasar", "Rumah"],
      "correct_answer": "Apotek",
      "explanation": "Apotek adalah tempat membeli obat"
    },
    {
      "id": "ips_19",
      "type": "multiple_choice",
      "question": "Hari terakhir dalam seminggu adalah...",
      "options": ["Jumat", "Sabtu", "Minggu", "Senin"],
      "correct_answer": "Minggu",
      "explanation": "Minggu adalah hari terakhir dalam seminggu"
    },
    {
      "id": "ips_20",
      "type": "multiple_choice",
      "question": "Tempat menunggu bus adalah...",
      "options": ["Terminal", "Toko", "Pasar", "Rumah"],
      "correct_answer": "Terminal",
      "explanation": "Terminal adalah tempat menunggu bus"
    },
    {
      "id": "ips_21",
      "type": "multiple_choice",
      "question": "Orang yang membuat rumah adalah...",
      "options": ["Dokter", "Guru", "Tukang", "Polisi"],
      "correct_answer": "Tukang",
      "explanation": "Tukang adalah orang yang membuat rumah"
    },
    {
      "id": "ips_22",
      "type": "multiple_choice",
      "question": "Tempat beribadah umat Kristen adalah...",
      "options": ["Masjid", "Gereja", "Pura", "Vihara"],
      "correct_answer": "Gereja",
      "explanation": "Gereja adalah tempat beribadah umat Kristen"
    },
    {
      "id": "ips_23",
      "type": "multiple_choice",
      "question": "Anggota keluarga yang suka bercerita adalah...",
      "options": ["Ayah", "Ibu", "Nenek", "Anak"],
      "correct_answer": "Nenek",
      "explanation": "Nenek biasanya suka bercerita"
    },
    {
      "id": "ips_24",
      "type": "multiple_choice",
      "question": "Tempat membeli makanan adalah...",
      "options": ["Toko", "Restoran", "Pasar", "Semua benar"],
      "correct_answer": "Semua benar",
      "explanation": "Toko, restoran, dan pasar adalah tempat membeli makanan"
    },
    {
      "id": "ips_25",
      "type": "multiple_choice",
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
  'PKN',
  '[
    {
      "id": "pkn_1",
      "type": "multiple_choice",
      "question": "Lambang negara Indonesia adalah...",
      "options": ["Bendera", "Garuda Pancasila", "Lagu", "Tarian"],
      "correct_answer": "Garuda Pancasila",
      "explanation": "Garuda Pancasila adalah lambang negara Indonesia"
    },
    {
      "id": "pkn_2",
      "type": "multiple_choice",
      "question": "Warna bendera Indonesia adalah...",
      "options": ["Merah putih", "Merah biru", "Kuning hijau", "Hitam putih"],
      "correct_answer": "Merah putih",
      "explanation": "Bendera Indonesia berwarna merah putih"
    },
    {
      "id": "pkn_3",
      "type": "multiple_choice",
      "question": "Kita harus menghormati orang yang lebih tua karena...",
      "options": ["Mereka lebih kaya", "Mereka lebih pintar", "Itu sopan santun", "Mereka lebih kuat"],
      "correct_answer": "Itu sopan santun",
      "explanation": "Menghormati orang yang lebih tua adalah sopan santun"
    },
    {
      "id": "pkn_4",
      "type": "multiple_choice",
      "question": "Ketika bertemu guru, kita harus...",
      "options": ["Lari", "Menunduk", "Menyapa", "Diam"],
      "correct_answer": "Menyapa",
      "explanation": "Ketika bertemu guru, kita harus menyapa"
    },
    {
      "id": "pkn_5",
      "type": "multiple_choice",
      "question": "Kita harus membantu teman yang kesulitan karena...",
      "options": ["Akan mendapat uang", "Itu perbuatan baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Itu perbuatan baik",
      "explanation": "Membantu teman yang kesulitan adalah perbuatan baik"
    },
    {
      "id": "pkn_6",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang menangis, kita harus...",
      "options": ["Tertawa", "Menghibur", "Pergi", "Diam"],
      "correct_answer": "Menghibur",
      "explanation": "Ketika ada teman yang menangis, kita harus menghibur"
    },
    {
      "id": "pkn_7",
      "type": "multiple_choice",
      "question": "Kita harus mengucapkan terima kasih ketika...",
      "options": ["Dimarahi", "Diberi bantuan", "Dihukum", "Ditinggal"],
      "correct_answer": "Diberi bantuan",
      "explanation": "Kita harus mengucapkan terima kasih ketika diberi bantuan"
    },
    {
      "id": "pkn_8",
      "type": "multiple_choice",
      "question": "Ketika melakukan kesalahan, kita harus...",
      "options": ["Lari", "Minta maaf", "Diam", "Tertawa"],
      "correct_answer": "Minta maaf",
      "explanation": "Ketika melakukan kesalahan, kita harus minta maaf"
    },
    {
      "id": "pkn_9",
      "type": "multiple_choice",
      "question": "Kita harus menjaga kebersihan lingkungan karena...",
      "options": ["Akan mendapat uang", "Lingkungan jadi sehat", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Lingkungan jadi sehat",
      "explanation": "Menjaga kebersihan lingkungan membuat lingkungan jadi sehat"
    },
    {
      "id": "pkn_10",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang terjatuh, kita harus...",
      "options": ["Tertawa", "Membantu", "Pergi", "Diam"],
      "correct_answer": "Membantu",
      "explanation": "Ketika ada teman yang terjatuh, kita harus membantu"
    },
    {
      "id": "pkn_11",
      "type": "multiple_choice",
      "question": "Kita harus menghargai perbedaan karena...",
      "options": ["Semua orang sama", "Itu perbuatan baik", "Akan mendapat uang", "Akan dipuji"],
      "correct_answer": "Itu perbuatan baik",
      "explanation": "Menghargai perbedaan adalah perbuatan baik"
    },
    {
      "id": "pkn_12",
      "type": "multiple_choice",
      "question": "Ketika bermain bersama, kita harus...",
      "options": ["Bersaing", "Bekerja sama", "Sendiri", "Diam"],
      "correct_answer": "Bekerja sama",
      "explanation": "Ketika bermain bersama, kita harus bekerja sama"
    },
    {
      "id": "pkn_13",
      "type": "multiple_choice",
      "question": "Kita harus jujur karena...",
      "options": ["Akan mendapat uang", "Jujur itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Jujur itu baik",
      "explanation": "Jujur adalah perbuatan yang baik"
    },
    {
      "id": "pkn_14",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang sakit, kita harus...",
      "options": ["Tertawa", "Menjenguk", "Pergi", "Diam"],
      "correct_answer": "Menjenguk",
      "explanation": "Ketika ada teman yang sakit, kita harus menjenguk"
    },
    {
      "id": "pkn_15",
      "type": "multiple_choice",
      "question": "Kita harus disiplin karena...",
      "options": ["Akan mendapat uang", "Disiplin itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Disiplin itu baik",
      "explanation": "Disiplin adalah perbuatan yang baik"
    },
    {
      "id": "pkn_16",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang berulang tahun, kita harus...",
      "options": ["Tertawa", "Memberi selamat", "Pergi", "Diam"],
      "correct_answer": "Memberi selamat",
      "explanation": "Ketika ada teman yang berulang tahun, kita harus memberi selamat"
    },
    {
      "id": "pkn_17",
      "type": "multiple_choice",
      "question": "Kita harus bertanggung jawab karena...",
      "options": ["Akan mendapat uang", "Tanggung jawab itu baik", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Tanggung jawab itu baik",
      "explanation": "Bertanggung jawab adalah perbuatan yang baik"
    },
    {
      "id": "pkn_18",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang sedih, kita harus...",
      "options": ["Tertawa", "Menghibur", "Pergi", "Diam"],
      "correct_answer": "Menghibur",
      "explanation": "Ketika ada teman yang sedih, kita harus menghibur"
    },
    {
      "id": "pkn_19",
      "type": "multiple_choice",
      "question": "Kita harus menghormati orang tua karena...",
      "options": ["Mereka lebih kaya", "Mereka lebih pintar", "Mereka membesarkan kita", "Mereka lebih kuat"],
      "correct_answer": "Mereka membesarkan kita",
      "explanation": "Kita harus menghormati orang tua karena mereka membesarkan kita"
    },
    {
      "id": "pkn_20",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang berprestasi, kita harus...",
      "options": ["Iri", "Memberi selamat", "Pergi", "Diam"],
      "correct_answer": "Memberi selamat",
      "explanation": "Ketika ada teman yang berprestasi, kita harus memberi selamat"
    },
    {
      "id": "pkn_21",
      "type": "multiple_choice",
      "question": "Kita harus menjaga nama baik keluarga karena...",
      "options": ["Akan mendapat uang", "Itu tanggung jawab", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Itu tanggung jawab",
      "explanation": "Menjaga nama baik keluarga adalah tanggung jawab"
    },
    {
      "id": "pkn_22",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang kesulitan belajar, kita harus...",
      "options": ["Tertawa", "Membantu", "Pergi", "Diam"],
      "correct_answer": "Membantu",
      "explanation": "Ketika ada teman yang kesulitan belajar, kita harus membantu"
    },
    {
      "id": "pkn_23",
      "type": "multiple_choice",
      "question": "Kita harus menghormati guru karena...",
      "options": ["Mereka lebih kaya", "Mereka mengajar kita", "Mereka lebih pintar", "Mereka lebih kuat"],
      "correct_answer": "Mereka mengajar kita",
      "explanation": "Kita harus menghormati guru karena mereka mengajar kita"
    },
    {
      "id": "pkn_24",
      "type": "multiple_choice",
      "question": "Ketika ada teman yang berbuat salah, kita harus...",
      "options": ["Tertawa", "Menasehati", "Pergi", "Diam"],
      "correct_answer": "Menasehati",
      "explanation": "Ketika ada teman yang berbuat salah, kita harus menasehati"
    },
    {
      "id": "pkn_25",
      "type": "multiple_choice",
      "question": "Kita harus menjaga persatuan karena...",
      "options": ["Akan mendapat uang", "Persatuan itu penting", "Akan dipuji", "Akan mendapat hadiah"],
      "correct_answer": "Persatuan itu penting",
      "explanation": "Menjaga persatuan adalah hal yang penting"
    }
  ]'::jsonb,
  NOW(),
  NOW()
);
