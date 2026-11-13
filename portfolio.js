(() => {
  'use strict';
  // Deploy PORTFOLIO_APPS_SCRIPT.gs as a separate Web App, then paste its URL here.
  // The quiz/SUS endpoint in script.js is not used or modified by this module.
  const PORTFOLIO_ENDPOINT = '';
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const fileInput = $('#portfolio-file');
  const saveBtn = $('#portfolio-save-btn');
  const sendBtn = $('#portfolio-submit-btn');
  const gallery = $('#portfolio-gallery');
  const countChip = $('#portfolio-count-chip');
  const galleryTotal = $('#portfolio-gallery-total');
  const status = $('#portfolio-storage-status');
  const emptyPreview = $('#portfolio-empty-preview');
  if (!fileInput || !saveBtn || !gallery) return;

  let selectedFile = null;
  let selectedPreviewUrl = null;
  let dbPromise = null;
  let pendingWork = null;
  let pendingButton = null;
  const dbName = 'kreasi-dkv-portfolio-v1';

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('Browser tidak mendukung penyimpanan portofolio lokal.'));
        return;
      }
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('works')) db.createObjectStore('works', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Database lokal gagal dibuka.'));
    });
    return dbPromise;
  }

  async function runStore(mode, action) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('works', mode);
      const request = action(transaction.objectStore('works'));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
  const getAll = () => runStore('readonly', store => store.getAll());
  const putWork = work => runStore('readwrite', store => store.put(work));
  const deleteWork = id => runStore('readwrite', store => store.delete(id));

  function student() {
    return {
      code: ($('#kode-siswa')?.value || '').trim().toUpperCase(),
      klass: ($('#kelas-siswa')?.value || '').trim()
    };
  }
  function makeId() {
    return (window.crypto?.randomUUID?.() || `work-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  }
  function setStatus(message, kind = 'info') {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
  }
  function currentMeta(file) {
    const person = student();
    return {
      title: $('#portfolio-title')?.value.trim() || file.name.replace(/\.[^.]+$/, ''),
      theme: $('#portfolio-theme')?.value || 'Tema bebas',
      note: $('#portfolio-note')?.value.trim() || '',
      studentCode: person.code,
      studentClass: person.klass
    };
  }
  function updatePreview(file) {
    selectedFile = file;
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    selectedPreviewUrl = URL.createObjectURL(file);

    const wrap = $('#portfolio-preview-wrap');
    const image = $('#portfolio-image-preview');
    const pdf = $('#portfolio-pdf-preview');
    const pdfName = $('#portfolio-pdf-name');
    const pdfOpen = $('#portfolio-pdf-open');
    const fileStatus = $('#portfolio-file-status');

    wrap?.classList.remove('hidden');
    emptyPreview?.classList.add('hidden');
    image?.classList.add('hidden');
    pdf?.classList.add('hidden');

    if (file.type.startsWith('image/')) {
      image.src = selectedPreviewUrl;
      image.classList.remove('hidden');
    } else if (file.type === 'application/pdf') {
      pdfName.textContent = file.name;
      pdfOpen.href = selectedPreviewUrl;
      pdf.classList.remove('hidden');
    }
    if (fileStatus) fileStatus.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB · siap disimpan.`;
    saveBtn.disabled = false;
    if (sendBtn) sendBtn.disabled = !PORTFOLIO_ENDPOINT;
  }

  function makeCard(work) {
    const card = document.createElement('article');
    card.className = 'portfolio-work-card';
    const thumb = document.createElement('div');
    thumb.className = 'portfolio-work-thumb';

    if (work.file?.type?.startsWith('image/')) {
      const image = document.createElement('img');
      image.alt = `Pratinjau ${work.title}`;
      image.src = URL.createObjectURL(work.file);
      thumb.append(image);
    } else {
      const stamp = document.createElement('div');
      stamp.className = 'pdf-stamp';
      stamp.textContent = 'PDF';
      thumb.append(stamp);
    }

    const info = document.createElement('div');
    info.className = 'portfolio-work-info';
    const title = document.createElement('b');
    title.textContent = work.title;
    const meta = document.createElement('small');
    meta.textContent = `${work.theme} · ${new Date(work.createdAt).toLocaleDateString('id-ID')}`;
    const studentMeta = document.createElement('small');
    studentMeta.textContent = `${work.studentCode || 'Kode belum tersedia'} · ${work.studentClass || 'Kelas belum tersedia'}`;
    info.append(title, meta, studentMeta);

    const actions = document.createElement('div');
    actions.className = 'portfolio-work-actions';
    const open = document.createElement('button');
    open.type = 'button';
    open.textContent = 'Buka';
    open.addEventListener('click', () => {
      const url = URL.createObjectURL(work.file);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });

    const send = document.createElement('button');
    send.type = 'button';
    send.textContent = work.remoteStatus === 'sent' ? 'Terkirim ✓' : 'Kirim';
    send.disabled = !PORTFOLIO_ENDPOINT || work.remoteStatus === 'sent';
    send.title = !PORTFOLIO_ENDPOINT ? 'Endpoint portofolio belum dipasang' : 'Kirim karya ini ke guru';
    send.addEventListener('click', () => uploadWork(work, send));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Hapus';
    remove.addEventListener('click', async () => {
      if (!confirm('Hapus karya ini dari portofolio lokal perangkat ini?')) return;
      await deleteWork(work.id);
      renderGallery();
    });
    actions.append(open, send, remove);
    card.append(thumb, info, actions);
    return card;
  }

  async function renderGallery() {
    try {
      const works = (await getAll()).sort((a, b) => b.createdAt - a.createdAt);
      gallery.replaceChildren();
      if (!works.length) {
        const empty = document.createElement('div');
        empty.className = 'portfolio-gallery-empty';
        empty.textContent = 'Belum ada karya. Simpan karya pertamamu untuk membangun portofolio.';
        gallery.append(empty);
      } else {
        works.forEach(work => gallery.append(makeCard(work)));
      }
      if (countChip) countChip.textContent = `${works.length} KARYA`;
      if (galleryTotal) galleryTotal.textContent = `${works.length} item tersimpan`;
    } catch (error) {
      setStatus(error.message || 'Portofolio lokal tidak dapat dimuat.', 'error');
    }
  }

  function readAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(new Error('File tidak bisa dibaca.'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadWork(work, button) {
    if (!PORTFOLIO_ENDPOINT) {
      setStatus('Pengiriman ke guru belum diaktifkan. Administrator perlu memasang URL Web App di portfolio.js.', 'warning');
      return;
    }
    if (!work?.file) {
      setStatus('File karya tidak ditemukan. Pilih ulang file dari perangkat.', 'error');
      return;
    }
    const person = student();
    if (!person.code || !person.klass) {
      setStatus('Identitas siswa belum tersedia. Kembali ke awal dan isi kode serta kelas.', 'error');
      return;
    }
    pendingWork = work;
    pendingButton = button || null;
    if (pendingButton) {
      pendingButton.disabled = true;
      pendingButton.textContent = 'Menyiapkan...';
    }
    if (sendBtn) sendBtn.disabled = true;
    try {
      const base64 = await readAsBase64(work.file);
      const form = $('#portfolio-upload-form');
      if (!form) throw new Error('Formulir pengiriman tidak ditemukan.');
      form.action = PORTFOLIO_ENDPOINT;
      const values = {
        '#pf-code': person.code,
        '#pf-class': person.klass,
        '#pf-title': work.title,
        '#pf-theme': work.theme,
        '#pf-note': work.note || '',
        '#pf-filename': work.file.name || 'karya-siswa',
        '#pf-mime': work.file.type,
        '#pf-data': base64
      };
      Object.entries(values).forEach(([selector, value]) => {
        const element = $(selector);
        if (element) element.value = value;
      });
      if (pendingButton) pendingButton.textContent = 'Mengirim...';
      setStatus('File sedang dikirim ke penyimpanan kelas. Jangan tutup halaman sampai ada konfirmasi.', 'info');
      form.submit();
    } catch (error) {
      setStatus(error.message || 'Pengiriman gagal disiapkan.', 'error');
      if (pendingButton) {
        pendingButton.disabled = false;
        pendingButton.textContent = 'Kirim';
      }
      if (sendBtn) sendBtn.disabled = !selectedFile || !PORTFOLIO_ENDPOINT;
      pendingWork = null;
      pendingButton = null;
    }
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      selectedFile = null;
      saveBtn.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
      setStatus('Format tidak didukung. Gunakan PNG, JPG, WEBP, atau PDF.', 'error');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      selectedFile = null;
      saveBtn.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
      setStatus('Ukuran file melebihi 5 MB. Kompres atau ekspor ulang karya sebelum mengunggah.', 'error');
      return;
    }
    updatePreview(file);
    setStatus('File siap dipratinjau. Lengkapi judul, lalu simpan ke portofolio.', 'info');
  });

  saveBtn.addEventListener('click', async () => {
    if (!selectedFile) {
      setStatus('Pilih file karya terlebih dahulu.', 'error');
      return;
    }
    const person = student();
    if (!person.code || !person.klass) {
      setStatus('Identitas siswa belum tersedia. Kembali ke awal dan isi kode serta kelas.', 'error');
      return;
    }
    const meta = currentMeta(selectedFile);
    const work = {
      id: makeId(), ...meta, file: selectedFile,
      createdAt: Date.now(), remoteStatus: 'local'
    };
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';
    try {
      await putWork(work);
      await renderGallery();
      setStatus('Karya tersimpan di portofolio pada browser/perangkat ini. Jika endpoint kelas diaktifkan, gunakan tombol Kirim pada kartu karya.', 'success');
      saveBtn.textContent = 'Tersimpan ✓';
    } catch (error) {
      setStatus(`Gagal menyimpan karya lokal: ${error.message || 'penyimpanan tidak tersedia.'}`, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Simpan ke portofolio';
    }
  });

  if (sendBtn) {
    sendBtn.disabled = !PORTFOLIO_ENDPOINT;
    sendBtn.title = PORTFOLIO_ENDPOINT ? 'Kirim karya terpilih ke ruang pengumpulan guru' : 'Endpoint portofolio belum dikonfigurasi';
    sendBtn.addEventListener('click', () => {
      if (!selectedFile) {
        setStatus('Pilih file karya terlebih dahulu. Setelah disimpan, karya juga dapat dikirim dari kartu portofolio.', 'warning');
        return;
      }
      uploadWork({ ...currentMeta(selectedFile), file: selectedFile }, sendBtn);
    });
  }

  window.addEventListener('message', async event => {
    const trustedOrigin = event.origin === 'https://script.google.com' || event.origin.endsWith('.googleusercontent.com');
    if (!trustedOrigin || event.data?.type !== 'KREASI_PORTFOLIO_RESULT') return;

    if (event.data.ok) {
      if (pendingWork?.id) {
        pendingWork.remoteStatus = 'sent';
        try { await putWork(pendingWork); } catch (_) {}
      }
      setStatus('Karya diterima di penyimpanan kelas. Guru dapat memeriksa daftar pengumpulan.', 'success');
      if (pendingButton) {
        pendingButton.textContent = 'Terkirim ✓';
        pendingButton.disabled = true;
      }
      if (sendBtn) {
        sendBtn.textContent = 'Terkirim ✓';
        sendBtn.disabled = true;
      }
      await renderGallery();
    } else {
      setStatus(`Pengiriman belum berhasil: ${event.data.message || 'periksa koneksi atau hubungi guru.'}`, 'error');
      if (pendingButton) {
        pendingButton.textContent = 'Kirim';
        pendingButton.disabled = false;
      }
      if (sendBtn) {
        sendBtn.textContent = 'Kirim ke guru ↗';
        sendBtn.disabled = !selectedFile || !PORTFOLIO_ENDPOINT;
      }
    }
    pendingWork = null;
    pendingButton = null;
  });

  if (sendBtn && !PORTFOLIO_ENDPOINT) {
    setStatus('Portofolio lokal siap. Pengiriman ke guru akan aktif setelah Web App portofolio kelas dipasang.', 'warning');
  }
  renderGallery();
})();
