(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const panel = $('#fix-this-design-mission');
  if (!panel) return;

  const start = $('[data-mission-start="fix"]');
  const back = $('#fix-back-to-hub');
  const hub = $('.mission-hub');
  const reset = $('#fix-reset-btn');
  const retry = $('#fix-retry-btn');
  const completion = $('#fix-complete-card');
  const poster = $('#fix-poster-after');
  const posterCaption = $('#fix-after-caption');
  const countLabel = $('#fix-progress-label');
  const percentLabel = $('#fix-progress-percent');
  const progressFill = $('#fix-progress-fill');
  const cardStatus = $('#mission-fix-card-status');
  const feedbackHub = $('#mission-hub-feedback');
  const taskOrder = ['contrast', 'hierarchy', 'layout'];
  const completed = new Set();

  const studentCode = () => ($('#kode-siswa')?.value || 'guest').trim().toUpperCase() || 'guest';
  const storageKey = () => `kreasi-dkv-fix-design-v1-${studentCode()}`;
  let isPersistedComplete = false;

  function safeRead() {
    try { return localStorage.getItem(storageKey()) === 'done'; }
    catch (_) { return false; }
  }
  function safeWrite() {
    try { localStorage.setItem(storageKey(), 'done'); isPersistedComplete = true; }
    catch (_) { isPersistedComplete = false; }
  }
  function announce(message) {
    if (feedbackHub) {
      feedbackHub.textContent = message;
      feedbackHub.classList.remove('is-fresh');
      void feedbackHub.offsetWidth;
      feedbackHub.classList.add('is-fresh');
    }
  }
  function openMission() {
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('is-entering');
    window.setTimeout(() => panel.classList.remove('is-entering'), 650);
    panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    announce('Mission 02 aktif: perbaiki kontras, hierarki visual, dan tata letak poster.');
  }
  function closeMission() {
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');
    if (hub) hub.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function updateProgress() {
    const n = completed.size;
    const pct = Math.round(n / taskOrder.length * 100);
    if (countLabel) countLabel.textContent = `${n} dari 3 perbaikan selesai`;
    if (percentLabel) percentLabel.textContent = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    taskOrder.forEach((key, index) => {
      const step = $(`[data-fix-progress-step="${key}"]`);
      if (!step) return;
      step.classList.toggle('is-done', completed.has(key));
      step.classList.toggle('is-current', !completed.has(key) && completed.size === index);
    });
  }
  function setTaskFeedback(key, message, type = '') {
    const el = $(`[data-fix-feedback="${key}"]`);
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-error', 'is-success', 'is-info');
    if (type) el.classList.add(`is-${type}`);
    el.classList.remove('is-fresh');
    void el.offsetWidth;
    el.classList.add('is-fresh');
  }
  function markTaskComplete(key, selectedButton) {
    completed.add(key);
    const task = $(`[data-fix-task="${key}"]`);
    if (task) {
      task.classList.add('is-complete');
      $$(`[data-fix-choice="${key}"]`, task).forEach(button => {
        button.disabled = true;
        button.setAttribute('aria-pressed', String(button === selectedButton));
        button.classList.toggle('is-correct-answer', button === selectedButton);
      });
    }
    poster?.classList.add(`fix-after-${key}`);
    if (posterCaption) posterCaption.textContent = `${completed.size}/3 perbaikan diterapkan. Poster berubah mengikuti keputusan desainmu.`;
    setTaskFeedback(key, {
      contrast: 'Tepat! Kontras yang kuat membantu judul tetap terbaca dan menonjol dari latar.',
      hierarchy: 'Bagus! Judul menjadi fokus pertama, sedangkan tanggal dan keterangan berperan sebagai informasi pendukung.',
      layout: 'Tepat! Margin dan grid membantu menjaga jarak, alignment, serta keteraturan antar elemen.'
    }[key], 'success');
    updateProgress();
    if (completed.size === taskOrder.length) finishMission();
  }
  function finishMission() {
    safeWrite();
    if (completion) {
      completion.classList.remove('hidden');
      completion.classList.add('is-celebrating');
    }
    if (cardStatus) cardStatus.textContent = '✓ Selesai · 100 Creative Points tersimpan di perangkat ini';
    if (start) start.innerHTML = 'Lihat hasil / ulangi misi <span aria-hidden="true">↗</span>';
    announce('Mission 02 selesai! Kamu memperbaiki tiga prinsip desain dan mendapatkan 100 Creative Points.');
  }
  function resetMission() {
    completed.clear();
    try { localStorage.removeItem(storageKey()); } catch (_) {}
    isPersistedComplete = false;
    taskOrder.forEach(key => {
      const task = $(`[data-fix-task="${key}"]`);
      if (task) {
        task.classList.remove('is-complete', 'is-shaking');
        $$(`[data-fix-choice="${key}"]`, task).forEach(button => {
          button.disabled = false;
          button.setAttribute('aria-pressed', 'false');
          button.classList.remove('is-correct-answer', 'is-wrong-answer');
        });
      }
      setTaskFeedback(key, {
        contrast: 'Pilih pasangan warna untuk memperbaiki kontras.',
        hierarchy: 'Pilih hierarki yang membantu pembaca memahami pesan.',
        layout: 'Pilih komposisi yang memberi ruang dan keteraturan.'
      }[key]);
    });
    poster?.classList.remove('fix-after-contrast', 'fix-after-hierarchy', 'fix-after-layout');
    if (posterCaption) posterCaption.textContent = 'Hasil akan berubah setiap kali kamu memilih perbaikan.';
    completion?.classList.add('hidden');
    completion?.classList.remove('is-celebrating');
    if (cardStatus) cardStatus.textContent = 'Belum diselesaikan · 3 keputusan desain';
    if (start) start.innerHTML = 'Mulai misi Fix This Design <span aria-hidden="true">↗</span>';
    updateProgress();
    announce('Tantangan diulang. Perhatikan kembali tiga masalah pada poster awal.');
  }

  start?.addEventListener('click', openMission);
  back?.addEventListener('click', closeMission);
  reset?.addEventListener('click', resetMission);
  retry?.addEventListener('click', resetMission);
  $('#fix-open-portfolio')?.addEventListener('click', () => {
    const tab = $('[data-studio-tab="studio-project-panel"]');
    if (tab) tab.click();
    else $('#studio-project-panel')?.classList.remove('hidden');
    $('#studio-project-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $$('[data-fix-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.fixChoice;
      if (!taskOrder.includes(key) || completed.has(key)) return;
      const task = $(`[data-fix-task="${key}"]`);
      if (button.dataset.correct === 'true') {
        markTaskComplete(key, button);
      } else {
        button.classList.remove('is-wrong-answer');
        void button.offsetWidth;
        button.classList.add('is-wrong-answer');
        if (task) {
          task.classList.remove('is-shaking');
          void task.offsetWidth;
          task.classList.add('is-shaking');
        }
        setTaskFeedback(key, {
          contrast: 'Belum tepat. Bandingkan seberapa jelas huruf terlihat dari latarnya.',
          hierarchy: 'Coba lagi. Pikirkan informasi apa yang harus terlihat lebih dahulu.',
          layout: 'Belum tepat. Perhatikan jarak, margin, dan apakah elemen saling bertumpuk.'
        }[key], 'error');
      }
    });
  });

  // Restore completion per kode siswa. Progress tersimpan di browser/perangkat ini.
  isPersistedComplete = safeRead();
  if (isPersistedComplete) {
    taskOrder.forEach(key => {
      completed.add(key);
      const task = $(`[data-fix-task="${key}"]`);
      task?.classList.add('is-complete');
      $$(`[data-fix-choice="${key}"]`, task || panel).forEach(button => {
        button.disabled = true;
        button.setAttribute('aria-pressed', String(button.dataset.correct === 'true'));
        if (button.dataset.correct === 'true') button.classList.add('is-correct-answer');
      });
      poster?.classList.add(`fix-after-${key}`);
    if (posterCaption) posterCaption.textContent = `${completed.size}/3 perbaikan diterapkan. Poster berubah mengikuti keputusan desainmu.`;
      setTaskFeedback(key, {
        contrast: 'Terselesaikan: kontras yang kuat membantu judul tetap terbaca.',
        hierarchy: 'Terselesaikan: judul menjadi fokus pertama dan detail menjadi pendukung.',
        layout: 'Terselesaikan: margin dan grid menjaga jarak serta alignment.'
      }[key], 'success');
    });
    completion?.classList.remove('hidden');
    if (cardStatus) cardStatus.textContent = '✓ Pernah diselesaikan · 100 Creative Points tersimpan';
    if (start) start.innerHTML = 'Lihat hasil / ulangi misi <span aria-hidden="true">↗</span>';
  }
  updateProgress();
})();
