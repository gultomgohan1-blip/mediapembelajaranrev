(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const sidebar = $('#lms-sidebar');
  const overlay = $('#sidebar-overlay');
  const menuToggle = $('#mobile-menu-toggle');
  const contextTitle = $('#mobile-context-title');
  const pageIds = ['section-0','section-1','section-2','section-3'];
  const titles = {overview:'Ringkasan belajar',materials:'Materi & Pembahasan',guided:'Guided Practice',challenge:'Design Challenge',portfolio:'Project & Portfolio',quiz:'Kuis',sus:'Angket SUS'};
  const chapterLabels = {'tab-1':'Unsur tata letak','tab-2':'Warna','tab-3':'Prinsip layout','tab-4':'Scanner','tab-5':'Data internet'};
  const visited = new Set();
  let done = new Set();
  const assess = () => window.LMSAssessment;
  function renderStudentCard() {
    const id = assess()?.identitas?.() || {};
    const nameEl = $('#sidebar-student-code');
    const classEl = $('#sidebar-student-class');
    if (nameEl) nameEl.textContent = id.nama || studentKey();
    if (classEl) classEl.textContent = [studentKey() !== 'GUEST' ? studentKey() : '', id.kelas || 'Kelas DKV'].filter(Boolean).join(' · ');
  }

  function studentKey() { return ($('#kode-siswa')?.value || 'guest').trim().toUpperCase() || 'guest'; }
  function progressKey() { return `kreasi-dkv-completed-${studentKey()}`; }
  function loadDone() { try { done = new Set(JSON.parse(localStorage.getItem(progressKey()) || '[]')); } catch (_) { done = new Set(); } }
  function saveDone() { try { localStorage.setItem(progressKey(), JSON.stringify([...done])); } catch (_) {} updateProgress(); }
  function updateProgress() {
    const count = done.size;
    const countEl = $('#sidebar-progress-count');
    const fill = $('#sidebar-progress-fill');
    if (countEl) countEl.textContent = `${count}/5`;
    if (fill) fill.style.width = `${count / 5 * 100}%`;
    $$('.mark-chapter-btn').forEach(btn => {
      const complete = done.has(btn.dataset.markChapter);
      btn.classList.toggle('is-done', complete);
      btn.textContent = complete ? 'Bab selesai ✓' : 'Tandai selesai ✓';
    });
    $$('.sidebar-chapter-list button').forEach(btn => {
      btn.classList.toggle('is-done', done.has(btn.dataset.shellChapter));
      const n = btn.dataset.shellChapter;
      btn.setAttribute('aria-label', `${chapterLabels[n]}${done.has(n) ? ', selesai' : ''}`);
    });
  }
  function currentPage() { return pageIds.find(id => !$('#'+id)?.classList.contains('hidden')) || 'section-0'; }
  function setPage(id) {
    pageIds.forEach(pid => $('#'+pid)?.classList.toggle('hidden', pid !== id));
    document.body.classList.toggle('app-active', id !== 'section-0');
    if (id !== 'section-0') renderStudentCard();
    const bar = $('#progress-bar');
    if (bar) bar.style.width = `${(pageIds.indexOf(id)+1)*25}%`;
    $$('.step').forEach(step => step.classList.toggle('text-indigo-500', Number(step.dataset.step) <= pageIds.indexOf(id)));
    if (id !== 'section-2') window.scrollTo({top:0,behavior:'smooth'});
    updateShellState();
  }
  function openSidebar(open) {
    sidebar?.classList.toggle('mobile-open', open);
    overlay?.classList.toggle('active', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('drawer-open', !!open);
  }
  function setActiveNav(key) {
    $$('[data-shell-nav]').forEach(btn => {
      const active = btn.dataset.shellNav === key;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current');
    });
    if (contextTitle) contextTitle.textContent = titles[key] || 'Creative learning path';
  }
  function scrollToTarget(id) {
    const target = $('#'+id);
    if (target) target.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function clickStudio(panelId) {
    const studio = $('#design-studio');
    const panel = $('#'+panelId);
    if (!studio || !panel) {
      showToast('Bagian praktik belum termuat. Muat ulang halaman dan coba kembali.');
      return;
    }
    // Tampilkan panel secara langsung agar navigasi sidebar tidak bergantung
    // pada event click sintetis atau urutan listener dari file lain.
    $$('.studio-panel', studio).forEach(item => {
      const active = item === panel;
      item.classList.toggle('hidden', !active);
      item.setAttribute('aria-hidden', String(!active));
      if (active) item.removeAttribute('inert'); else item.setAttribute('inert', '');
    });
    $$('[data-studio-tab]', studio).forEach(tab => {
      const active = tab.dataset.studioTab === panelId;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
    });
    panel.classList.remove('hidden');
    panel.removeAttribute('inert');
    requestAnimationFrame(() => { const target = $('#'+panelId); if (target) window.scrollTo({top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - 112), behavior: 'auto'}); });
  }
  function showToast(message) {
    let toast = $('#lms-nav-toast');
    if (!toast) { toast = document.createElement('div'); toast.id='lms-nav-toast'; toast.className='lms-nav-toast'; toast.setAttribute('role','status'); document.body.append(toast); }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(()=>toast.classList.remove('show'),3000);
  }
  function navigate(key) {
    openSidebar(false);
    if (currentPage() === 'section-2' && key !== 'quiz') assess()?.jeda();
    if (key === 'overview') { setPage('section-1'); setActiveNav(key); scrollToTarget('course-overview'); return; }
    if (key === 'materials') { setPage('section-1'); setActiveNav(key); $('.tab-btn[data-tab="tab-1"]')?.click(); scrollToTarget('course-chapters'); return; }
    if (key === 'guided' || key === 'challenge' || key === 'portfolio') {
      setPage('section-1'); setActiveNav(key);
      const panel = key === 'guided' ? 'studio-guided-panel' : key === 'challenge' ? 'studio-challenge-panel' : 'studio-project-panel';
      clickStudio(panel); return;
    }
    if (key === 'quiz') {
      const A = assess();
      if (currentPage() === 'section-2') { setActiveNav('quiz'); return; }
      if (A?.kuisSelesai()) { A.siapkanSUS(); setPage('section-3'); setActiveNav('sus'); showToast('Kuis sudah selesai. Hasil dan angket SUS tersedia di halaman ini.'); return; }
      if (A) { A.bukaKuis(); setActiveNav('quiz'); return; }
      showToast('Kuis belum termuat. Muat ulang halaman dan coba kembali.');
      return;
    }
    if (key === 'sus') {
      const A = assess();
      if (!A) { showToast('Angket belum termuat. Muat ulang halaman dan coba kembali.'); return; }
      A.siapkanSUS(); setPage('section-3'); setActiveNav('sus');
      requestAnimationFrame(() => scrollToTarget('sus-list'));
    }
  }
  function updateShellState() {
    const page = currentPage();
    document.body.classList.toggle('app-active', page !== 'section-0');
    const shell = $('#lms-workspace');
    shell?.classList.toggle('is-learning', page !== 'section-0');
    if (page === 'section-0') openSidebar(false);
    if (page === 'section-2') setActiveNav('quiz');
    if (page === 'section-3') setActiveNav('sus');
    if (page === 'section-1' && !$$('[data-shell-nav].is-active').length) setActiveNav('overview');
  }

  $$('[data-shell-nav]').forEach(btn => btn.addEventListener('click',()=>navigate(btn.dataset.shellNav)));
  $$('[data-shell-chapter]').forEach(btn => btn.addEventListener('click',()=>{
    openSidebar(false); setPage('section-1'); setActiveNav('materials');
    const tab = $(`.tab-btn[data-tab="${btn.dataset.shellChapter}"]`); tab?.click();
    $$('.sidebar-chapter-list button').forEach(x=>x.classList.toggle('is-active',x===btn));
    scrollToTarget('course-chapters');
  }));
  $$('.mark-chapter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.markChapter;
    if(done.has(id)) done.delete(id); else done.add(id);
    saveDone();
  }));
  menuToggle?.addEventListener('click',()=>openSidebar(!sidebar?.classList.contains('mobile-open')));
  overlay?.addEventListener('click',()=>openSidebar(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')openSidebar(false)});
  // Update mobile/desktop nav state when the legacy assessment controller changes page visibility.
  const observer = new MutationObserver(updateShellState);
  pageIds.forEach(id=>{const el=$('#'+id);if(el)observer.observe(el,{attributes:true,attributeFilter:['class']});});
  // Keep chapter navigation synchronized with the existing chapter tabs.
  $$('[data-studio-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    const key = btn.dataset.studioTab === 'studio-guided-panel' ? 'guided' : btn.dataset.studioTab === 'studio-challenge-panel' ? 'challenge' : 'portfolio';
    setActiveNav(key);
  }));
  $$('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.tab;
    $$('.sidebar-chapter-list button').forEach(x=>x.classList.toggle('is-active',x.dataset.shellChapter===id));
    const names={'tab-1':'Unsur tata letak','tab-2':'Warna','tab-3':'Prinsip layout','tab-4':'Scanner','tab-5':'Data internet'};
    if(contextTitle && currentPage()==='section-1')contextTitle.textContent=names[id]||'Materi & Pembahasan';
  }));
  // Student code is already validated by the original login form.
  $('#btn-mulai')?.addEventListener('click',()=>{loadDone();renderStudentCard();setActiveNav('overview')});
  loadDone(); updateProgress(); updateShellState();
})();
