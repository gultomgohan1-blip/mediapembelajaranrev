KREASI DKV — CREATIVE QUEST / TWO-MISSION RELEASE
MISSION 01: LAYOUT ARCHITECT | MISSION 02: FIX THIS DESIGN

ARAH DESAIN YANG SUDAH DISEPAKATI
1. Sistem belajar hybrid: urutan direkomendasikan, tetapi materi dan praktik dapat dibuka kembali.
2. Navigasi sidebar pada desktop dan drawer pada HP.
3. Materi hybrid visual + editorial.
4. Praktik terintegrasi per bab dan Design Studio khusus.
5. Referensi visual eksternal beratribusi serta diagram/ilustrasi pembelajaran.
6. Portofolio karya siswa dengan penyimpanan lokal dan opsi pengiriman terpisah ke Google Apps Script.

ISI PAKET FRONTEND
- index.html
- style.css
- script.js (dipertahankan byte-for-byte; jangan diedit untuk fitur baru)
- studio.js
- mission-hub.js
- fix-this-design.js (baru: interaksi Mission 02)
- app-navigation.js
- portfolio.js
- README.txt
- UPLOAD_PANDUAN.txt

APA YANG BARU PADA PHASE 2
- Mission Hub hanya menampilkan dua misi aktif: Mission 01 Layout Architect dan Mission 02 Fix This Design. Empat kartu roadmap yang belum siap disembunyikan agar siswa tidak mengira misi itu sudah tersedia.
- Fix This Design menggunakan brief Festival Literasi Sekolah. Siswa memperbaiki tiga masalah: kontras, hierarki visual, dan tata letak.
- Setiap pilihan benar memberikan feedback spesifik dan mengubah live preview poster. Pilihan keliru memberi petunjuk dan dapat dicoba kembali.
- Misi memberi 100 Creative Points dan menyimpan status selesai per kode siswa di localStorage pada browser/perangkat yang sama.
- Siswa dapat mengulang misi atau menuju Project & Portfolio.
- Animasi CSS ringan ditambahkan untuk hero, bentuk mengambang, feedback, progres, dan penyelesaian. Animasi menghormati prefers-reduced-motion.
- GIF dapat ditambahkan pada tahap berikutnya, tetapi animasi CSS dipilih lebih dulu agar halaman lebih ringan, tajam di layar HP, dan tidak membutuhkan file gambar besar.

CARA UPLOAD KE GITHUB PAGES
1. Ekstrak ZIP.
2. Unggah semua file frontend langsung ke ROOT repository (jangan ke subfolder): index.html, style.css, script.js, studio.js, mission-hub.js, fix-this-design.js, app-navigation.js, portfolio.js.
3. Commit changes.
4. Setelah GitHub Pages selesai deploy, refresh dengan Ctrl+Shift+R.

PENTING TENTANG SCRIPT.JS
- script.js disalin identik dari paket Unified Mission Hub + Guided Practice.
- API_URL kuis/SUS, payload {kodeSiswa, skorKuis, skorSus}, 15 soal, timer 45 detik/soal, 10 butir SUS, dan rumus SUS tidak diubah.
- Jangan mengganti script.js dengan file dari paket LMS yang lebih lama.

PENTING TENTANG PORTOFOLIO
- portfolio.js tetap bekerja seperti paket sebelumnya. Data lokal tersimpan di IndexedDB browser/perangkat siswa.
- Pengiriman ke Google Drive membutuhkan endpoint PORTFOLIO_APPS_SCRIPT.gs yang terpisah dan konfigurasi administrator. Endpoint tersebut tidak termasuk perubahan Phase 2.

PENYIMPANAN PROGRES MISSION
- Penyelesaian Fix This Design disimpan di localStorage berdasarkan kode siswa dan hanya berlaku pada browser/perangkat yang sama.
- Menghapus data browser dapat menghapus status misi lokal.
- Sistem ini belum mengirim skor Creative Quest ke Google Sheets.

PENGUJIAN YANG DISARANKAN SETELAH DEPLOY
1. Login dengan kode uji yang valid.
2. Buka Design Challenge dari sidebar. Pastikan Mission Hub tampil.
3. Klik Mulai misi Fix This Design.
4. Coba satu pilihan salah di setiap kategori dan pastikan feedback muncul.
5. Pilih jawaban benar untuk kontras, hierarki, dan layout. Pastikan preview berubah dan kartu selesai muncul.
6. Refresh halaman dan pastikan status selesai dipulihkan untuk kode siswa/browser yang sama.
7. Coba Ulangi Misi, Kembali ke Mission Board, dan Lanjut ke Portofolio.
8. Uji mode terang/gelap dan layar HP.
9. Selesaikan kuis dan SUS pada sesi uji terpisah; pastikan pengiriman ke endpoint lama tetap berjalan.

MATERI
Mission 02 berlatih menerapkan kontras, hierarki visual, margin, grid, dan alignment sebagai prinsip desain grafis. Materi rujukan utama mengikuti buku Desain Grafis SMK Kelas XI (2013), dengan penyesuaian guru terhadap CP/ATP yang digunakan di kelas.


PEMBARUAN VERSI INI
- Mission Hub difokuskan pada dua misi aktif: Layout Architect dan Fix This Design.
- Kartu misi yang belum dibangun disembunyikan agar siswa tidak mengira fitur tersebut sudah tersedia.
- Kontras teks Project & Portfolio diperbaiki secara khusus untuk mode terang dan gelap.
- File script.js tetap dipertahankan tanpa perubahan.

PERBAIKAN PORTOFOLIO KONTRAS
- Semua teks portofolio sekarang menggunakan warna khusus yang dipasangkan dengan permukaan terang/gelap, termasuk judul, label, input, select, placeholder, preview PDF, galeri, tombol, dan catatan guru.
- Nilai warna dibuat eksplisit untuk mencegah teks mewarisi warna latar dari komponen lain.
- Kontras teks utama pada kedua tema menggunakan pasangan warna dengan rasio kontras tinggi.

UPDATE: PROJECT & MATERIALS READABILITY FIX
- Added explicit contrast tokens to Project & Portfolio brief/rubric/upload cards.
- Fixed project-choice note and project form labels for both light and dark modes.
- Fixed chapter-specific discussion-card surfaces in dark mode; earlier chapter-ID rules kept pastel backgrounds under light text.
- Fixed chapter swatch labels/headings, image-use notes, chapter completion controls, and lesson table headers/cells.
- The quiz/SUS logic, endpoint configuration, and script.js are unchanged.


========================================================================
REDESIGN HALAMAN MATERI & BAB — PLAYFUL CREATIVE
========================================================================
Cakupan: Materi & Pembahasan (hero, pemilih bab, 5 bab, pengayaan).
Tidak diubah: kuis, SUS, Design Studio, Mission Hub, Portofolio, halaman identitas.

Arah visual
- Bentuk geometris berani, kontur tinta tebal, bayangan keras (hard shadow).
- Satu warna aksen per bab: Bab 1 koral, Bab 2 matahari, Bab 3 kobalt,
  Bab 4 mint, Bab 5 violet. Warna yang sama dipakai pada ubin pilih bab
  dan nomor bab di sidebar.
- Judul memakai Poppins (dimuat dari Google Fonts), isi tetap Plus Jakarta Sans.
- Mode terang dan gelap memakai satu set variabel warna (di awal materi.css).

Struktur kode
- materi.css dimuat SETELAH style.css dan hanya memakai namespace baru:
  mh-* (hero/ringkasan) dan m-* (bab). Lapisan gaya lama di style.css tidak
  disentuh; kelas lama pada bagian materi sudah diganti nama sehingga tidak
  saling menimpa (mis. discussion-card -> m-card, lesson-check -> m-practice).
- Hook JavaScript dipertahankan: .tab-btn[data-tab], .tab-panel, kelas
  text-white pada tab aktif, .mark-chapter-btn[data-mark-chapter],
  #course-chapters, #course-overview.

GIF demo (dibuat dengan Python/Pillow, 640x480 atau 640x400, 75-420 KB)
- anim-hero    : poster tersusun dari bentuk, huruf, dan garis (hero)
- anim-unsur   : garis > bidang > tipografi > warna (Bab 1)
- anim-warna   : RGB aditif vs CMY subtraktif (Bab 2)
- anim-grid    : elemen acak menjadi sejajar grid (Bab 3)
- anim-scanner : pemindaian gambar menjadi piksel (Bab 4)
- anim-aset    : unduh berkas lalu simpan di folder aset (Bab 5)
Setiap GIF punya poster statis (*-still.png) untuk prefers-reduced-motion.
