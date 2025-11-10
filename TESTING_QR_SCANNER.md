# Panduan Testing QR Scanner Feature

## Persiapan Testing

### 1. Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 2. Siapkan 2 Device/Browser

Anda memerlukan:

- **Device 1**: Untuk menampilkan QR code (PC/Laptop)
- **Device 2**: Untuk scan QR code (Smartphone atau tab browser berbeda)

---

## Cara Testing

### Metode 1: Testing dengan Test File (Recommended untuk Development)

#### Step 1: Buka Test QR Generator

1. Buka file `test-qr-code.html` di browser
2. Anda akan melihat QR code dengan room code "ABC123" (default)
3. Atau klik "Random Code" untuk generate code random
4. QR code akan otomatis ter-generate

#### Step 2: Scan dengan Device Lain

1. Di device lain (smartphone), buka: `http://localhost:3000/join`
2. Klik tombol **"SCAN"** di samping label "ROOM CODE"
3. Browser akan meminta permission untuk akses kamera
4. Klik **"Allow"** atau **"Izinkan"**
5. Arahkan kamera ke QR code di layar device pertama
6. Room code akan otomatis terisi!

---

### Metode 2: Testing dengan Actual Game Flow

#### Step 1: Host Membuat Room

1. Buka `http://localhost:3000`
2. Login (jika perlu)
3. Click "Host Game"
4. Buat room baru
5. Di halaman lobby, akan muncul QR code

#### Step 2: Player Join via QR Scan

1. Di device lain, buka `http://localhost:3000/join`
2. Klik tombol **"SCAN"**
3. Allow camera access
4. Scan QR code dari lobby host
5. Room code terisi otomatis
6. Isi username dan pilih avatar
7. Click "JOIN ROOM"

---

## Testing Scenarios

### ✅ Happy Path

1. **Scan berhasil dengan QR valid**

   - QR code berisi URL lengkap: `http://localhost:3000/join?room=ABC123`
   - Room code terisi: `ABC123`
   - Scanner modal tertutup otomatis
   - Ready untuk join room

2. **Scan QR dengan format berbeda**
   - QR berisi room code saja: `ABC123`
   - QR berisi URL lain tapi ada parameter room: `https://example.com/join?room=XYZ789`
   - Semua harus extract room code dengan benar

### ⚠️ Error Cases

1. **Camera permission ditolak**

   - Error message muncul
   - Tombol "Close" tersedia
   - Bisa tutup dan coba lagi

2. **Camera tidak tersedia**

   - Error message: "Camera not supported"
   - Fallback ke manual input

3. **QR code tidak valid**
   - Scanner terus berjalan
   - Tidak ada action sampai QR valid terdeteksi

---

## Checklist Testing

### UI/UX

- [ ] Tombol "SCAN" muncul di samping "ROOM CODE"
- [ ] Icon camera terlihat jelas
- [ ] Tombol responsive (hover, click effect)
- [ ] Modal scanner tampil penuh layar
- [ ] Close button (X) di pojok kanan atas
- [ ] Scanning animation berjalan (green line)
- [ ] Corner borders terlihat

### Functionality

- [ ] Klik "SCAN" membuka modal scanner
- [ ] Browser meminta camera permission
- [ ] Camera feed tampil setelah permission granted
- [ ] QR code detection bekerja
- [ ] Room code auto-fill setelah scan
- [ ] Modal tertutup setelah scan berhasil
- [ ] Klik close button menutup modal
- [ ] Error handling bekerja

### Cross-Browser Testing

- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop (Mac)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Edge Mobile

### Performance

- [ ] Camera initialization < 2 detik
- [ ] QR detection < 1 detik
- [ ] Tidak ada memory leak
- [ ] Smooth animation

---

## Troubleshooting

### Camera tidak muncul

**Problem**: Modal terbuka tapi camera tidak aktif

**Solution**:

1. Check browser console untuk error
2. Pastikan browser support `getUserMedia`
3. Check browser permission settings
4. Coba browser berbeda
5. Pastikan HTTPS (atau localhost)

### QR Code tidak terdeteksi

**Problem**: Camera aktif tapi QR tidak ke-scan

**Solution**:

1. Pastikan QR code cukup besar di layar
2. Pastikan pencahayaan cukup
3. Jangan terlalu dekat atau jauh
4. Pastikan QR code berisi text/URL valid
5. Coba QR code berbeda

### Permission Error

**Problem**: "Camera access denied"

**Solution**:

1. Reset browser permission:
   - Chrome: Settings → Privacy → Site Settings → Camera
   - Firefox: Preferences → Privacy & Security → Permissions → Camera
   - Safari: Preferences → Websites → Camera
2. Reload page
3. Allow permission saat diminta

### Build Error

**Problem**: Error saat npm install atau build

**Solution**:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or force install react-qr-reader
npm install react-qr-reader --force
```

---

## Tips untuk Testing yang Baik

1. **Test di Real Device**:

   - Emulator tidak selalu akurat untuk camera
   - Test di smartphone fisik lebih reliable

2. **Network Testing**:

   - Jika testing di network berbeda, use ngrok atau expose localhost

   ```bash
   npx ngrok http 3000
   ```

3. **Different Lighting Conditions**:

   - Test di ruangan terang dan gelap
   - Test dengan screen brightness berbeda

4. **Multiple QR Code Formats**:

   - URL lengkap
   - Room code saja
   - URL dengan query params berbeda

5. **User Journey**:
   - Test complete flow dari start sampai join room
   - Jangan hanya test scanner isolated

---

## Expected Results

### ✅ Success Criteria

- Camera access request muncul
- Camera feed tampil dalam modal
- QR code terdeteksi dalam 1-2 detik
- Room code terisi otomatis
- Modal tertutup otomatis
- No console errors
- Smooth user experience

### 📊 Performance Metrics

- Camera init: < 2 seconds
- QR detection: < 1 second
- Modal open/close: < 300ms
- No memory leaks
- CPU usage reasonable

---

## Demo Video Script

1. Show join page
2. Click "SCAN" button
3. Allow camera permission
4. Show QR code on another screen
5. Point camera to QR
6. Show automatic room code fill
7. Complete join process

---

## Next Steps After Testing

Jika testing berhasil:

1. ✅ Commit changes
2. ✅ Update documentation
3. ✅ Test di production/staging
4. ✅ Get user feedback
5. ✅ Monitor analytics

Jika ada issues:

1. Document the issue
2. Check browser console
3. Review code implementation
4. Fix and retest
5. Add edge case handling

---

## Contact & Support

Jika menemukan bug atau butuh bantuan:

1. Check browser console untuk error details
2. Dokumentasikan steps to reproduce
3. Include browser/device info
4. Take screenshots/video
