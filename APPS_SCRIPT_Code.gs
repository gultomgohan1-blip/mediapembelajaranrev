/**
 * KREASI DKV — penerima data kuis & angket SUS (Google Apps Script)
 *
 * CARA PASANG (jangan diunggah ke GitHub; file ini hanya untuk Google Apps Script):
 * 1. Buka Google Sheets tujuan > Extensions > Apps Script.
 * 2. Ganti seluruh isi Code.gs dengan file ini, lalu Save.
 * 3. Deploy > Manage deployments > ikon pensil pada deployment yang sudah ada
 *    > Version: "New version" > Deploy. (URL /exec TETAP SAMA, jadi script.js
 *    tidak perlu diubah.) Execute as: Me. Who has access: Anyone.
 *
 * HASIL DI SPREADSHEET
 * Sheet "Angket SUS"  -> Kode | Nama | Pernyataan | 1 | 2 | 3 | 4 | 5
 *   (tanda ✓ pada kolom poin yang dipilih; 10 baris per siswa)
 *   Ubah FORMAT_POIN ke 'ANGKA' bila ingin satu kolom "Poin" berisi angka 1-5.
 * Sheet "Rekap Skor"  -> Kode | Nama | Kelas | Skor Kuis | Skor SUS | Waktu Kirim
 *   (satu baris per siswa; kirim ulang memperbarui baris yang sama)
 */
const FORMAT_POIN = 'KOLOM';            // 'KOLOM' (kolom 1-5 bertanda ✓) atau 'ANGKA' (satu kolom Poin)
const SHEET_SUS = 'Angket SUS';
const SHEET_REKAP = 'Rekap Skor';
const TANDA = '✓';

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const kode = String(d.kodeSiswa || '').trim().toUpperCase();
    if (!/^S\d{2,3}$/.test(kode)) return json_({ ok: false, error: 'Kode siswa tidak valid' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nama = String(d.nama || '').trim();
    const kelas = String(d.kelas || '').trim();

    tulisRekap_(ss, kode, nama, kelas, d.skorKuis, d.skorSus);
    if (Array.isArray(d.jawabanSus) && d.jawabanSus.length) tulisSus_(ss, kode, nama, d.jawabanSus);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet() { return json_({ ok: true, info: 'KREASI DKV endpoint aktif' }); }

function ambilSheet_(ss, nama, header) {
  let sh = ss.getSheetByName(nama);
  if (!sh) sh = ss.insertSheet(nama);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#E8EAFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

function tulisRekap_(ss, kode, nama, kelas, skorKuis, skorSus) {
  const header = ['Kode', 'Nama', 'Kelas', 'Skor Kuis', 'Skor SUS', 'Waktu Kirim'];
  const sh = ambilSheet_(ss, SHEET_REKAP, header);
  const kuis = (skorKuis === null || skorKuis === undefined || skorKuis === '') ? '' : Number(skorKuis);
  const baris = [kode, nama, kelas, kuis, Number(skorSus), new Date()];
  const last = sh.getLastRow();
  const kodeCol = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]).toUpperCase()) : [];
  const idx = kodeCol.indexOf(kode);
  if (idx >= 0) {
    // Jangan menimpa skor kuis lama dengan kosong bila kirim ulang tanpa kuis.
    if (kuis === '') baris[3] = sh.getRange(idx + 2, 4).getValue();
    sh.getRange(idx + 2, 1, 1, header.length).setValues([baris]);
  } else {
    sh.appendRow(baris);
  }
}

function tulisSus_(ss, kode, nama, jawaban) {
  const header = FORMAT_POIN === 'ANGKA'
    ? ['Kode', 'Nama', 'Pernyataan', 'Poin']
    : ['Kode', 'Nama', 'Pernyataan', 1, 2, 3, 4, 5];
  const sh = ambilSheet_(ss, SHEET_SUS, header);

  // Hapus jawaban lama milik kode yang sama (kirim ulang = perbarui).
  const last = sh.getLastRow();
  if (last > 1) {
    const kodeCol = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = kodeCol.length - 1; i >= 0; i--) {
      if (String(kodeCol[i][0]).toUpperCase() === kode) sh.deleteRow(i + 2);
    }
  }

  const rows = jawaban.map(j => {
    const poin = Number(j.poin);
    const pernyataan = `${j.no}. ${String(j.pernyataan || '').trim()}`;
    if (FORMAT_POIN === 'ANGKA') return [kode, nama, pernyataan, poin];
    return [kode, nama, pernyataan, ...[1, 2, 3, 4, 5].map(n => (n === poin ? TANDA : ''))];
  });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, header.length).setValues(rows);
  if (FORMAT_POIN !== 'ANGKA') sh.getRange(2, 4, Math.max(sh.getLastRow() - 1, 1), 5).setHorizontalAlignment('center');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
