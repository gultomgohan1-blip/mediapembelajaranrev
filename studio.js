(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Tab Design Studio.
  const studioTabs = $$('.studio-tab');
  const studioPanels = $$('.studio-panel');
  studioPanels.forEach((panel) => {
    const active = !panel.classList.contains('hidden');
    panel.setAttribute('aria-hidden', String(!active));
    if (active) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
  });
  studioTabs.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.studioTab;
      studioTabs.forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      studioPanels.forEach((panel) => {
        const active = panel.id === target;
        panel.classList.toggle('hidden', !active);
        panel.setAttribute('aria-hidden', String(!active));
        if (active) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
      });
      const activePanel = document.getElementById(target);
      if (activePanel) requestAnimationFrame(() => activePanel.scrollIntoView({behavior:'smooth', block:'start'}));
    });
  });

  // Satu sistem warna dipakai oleh live canvas dan file PNG hasil ekspor.
  const paletteMap = {
    forest:    { bg:'#173D32', paper:'#FFF9EC', accent:'#D6EF6A', second:'#F2A46F', soft:'#285D4D' },
    ocean:     { bg:'#102E46', paper:'#F4FBFF', accent:'#59D8D0', second:'#FFC857', soft:'#1C5871' },
    sunset:    { bg:'#3A1F36', paper:'#FFF3EA', accent:'#FF786D', second:'#FFD166', soft:'#77415D' },
    editorial: { bg:'#F0E9D9', paper:'#20242C', accent:'#3158DD', second:'#F06F52', soft:'#D6CBB6' },
    citrus:    { bg:'#17253F', paper:'#FFF9E8', accent:'#D5F36A', second:'#5479EE', soft:'#344E78' },
    lavender:  { bg:'#312A4A', paper:'#FFF8FF', accent:'#D9BEFF', second:'#FF91B9', soft:'#655681' },
    mono:      { bg:'#17191D', paper:'#FAF8F2', accent:'#FFFFFF', second:'#A7ADB6', soft:'#414751' },
    coral:     { bg:'#F6E6D7', paper:'#2D2930', accent:'#E45F50', second:'#E6B75C', soft:'#E9CBB5' }
  };
  // Pilih warna teks berdasarkan kontras WCAG, bukan asumsi warna palet.
  function luminance(hex) {
    const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x,16)/255);
    return rgb.map(v => v <= .04045 ? v/12.92 : Math.pow((v+.055)/1.055,2.4)).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  }
  function contrast(a,b) {
    const x=luminance(a), y=luminance(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  function readableOn(bg, preferred) {
    const dark='#152032', light='#FFFFFF';
    const options=[preferred,dark,light].filter(Boolean);
    return options.sort((a,b)=>contrast(b,bg)-contrast(a,bg))[0];
  }
  function drawRoundedPanel(ctx,x,y,w,h,r,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  }
  const $brief = $('#poster-brief');
  const $title = $('#poster-title-input');
  const $desc = $('#poster-desc-input');
  const $cta = $('#poster-cta-input');
  const $palette = $('#poster-palette');
  const $layout = $('#poster-layout');
  const $motif = $('#poster-motif');
  const $preview = $('#poster-preview');
  const $liveCanvas = $('#poster-live-canvas');
  const $exportStatus = $('#poster-export-status');
  const $download = $('#poster-download');

  const briefPresets = {
    environment: { title:'KURANGI PLASTIK SEKALI PAKAI', desc:'Bawa tumbler dan tas pakai ulang. Langkah kecilmu membantu menjaga bumi.', cta:'MULAI DARI DIRI SENDIRI', palette:'forest', layout:'swiss', motif:'waves' },
    water: { title:'SETETES AIR, BERARTI', desc:'Tutup keran setelah digunakan. Gunakan air secukupnya dan jaga sumber air untuk masa depan.', cta:'HEMAT AIR MULAI HARI INI', palette:'ocean', layout:'center', motif:'circles' },
    energy: { title:'MATIKAN SAAT TAK DIGUNAKAN', desc:'Gunakan listrik seperlunya. Matikan lampu dan perangkat ketika tidak dibutuhkan.', cta:'HEMAT ENERGI SEKARANG', palette:'citrus', layout:'diagonal', motif:'lines' },
    literacy: { title:'CEK DULU SEBELUM KLIK', desc:'Periksa sumber informasi, pikirkan dampaknya, dan bagikan konten dengan bijak.', cta:'JADI PENGGUNA CERDAS', palette:'lavender', layout:'type', motif:'grid' },
    health: { title:'GERAK 30 MENIT SETIAP HARI', desc:'Sisihkan waktu untuk bergerak, minum air, dan istirahat dengan teratur.', cta:'MULAI HIDUP SEHAT', palette:'coral', layout:'split', motif:'circles' },
    'anti-bullying': { title:'KATA-KATA BISA MENGUATKAN', desc:'Hargai perbedaan, dengarkan teman, dan ciptakan lingkungan sekolah yang aman.', cta:'JADILAH TEMAN YANG PEDULI', palette:'sunset', layout:'collage', motif:'cutout' },
    culture: { title:'BANGGA CERITA BUDAYA KITA', desc:'Kenali motif, bahasa, musik, dan tradisi di sekitar kita. Warisan budaya hidup saat dijaga.', cta:'KENALI DAN LESTARIKAN', palette:'editorial', layout:'frame', motif:'geometry' },
    recycling: { title:'PILAH SEBELUM MEMBUANG', desc:'Pisahkan sampah organik, anorganik, dan bahan yang dapat didaur ulang.', cta:'MULAI DARI TEMPAT SAMPAH', palette:'forest', layout:'split', motif:'geometry' },
    reading: { title:'SATU HARI, SATU CERITA', desc:'Luangkan waktu membaca. Temukan ide, pengetahuan, dan sudut pandang baru dari setiap halaman.', cta:'BUKA BUKU HARI INI', palette:'sunset', layout:'swiss', motif:'grid' },
    'clean-school': { title:'SEKOLAH BERSIH, BELAJAR NYAMAN', desc:'Buang sampah pada tempatnya, rawat fasilitas, dan jaga ruang belajar bersama.', cta:'JAGA KELAS KITA', palette:'ocean', layout:'collage', motif:'waves' }
  };

  function wrapText(ctx, text, maxWidth, maxLines = 5) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const clipped = lines.slice(0, maxLines);
      clipped[maxLines - 1] = clipped[maxLines - 1].replace(/[.,;:]?$/, '') + '…';
      return clipped;
    }
    return lines;
  }

  function drawWrapped(ctx, text, x, y, maxWidth, font, color, lineHeight, align = 'left', maxLines = 4) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    const lines = wrapText(ctx, text, maxWidth, maxLines);
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
    return lines.length;
  }

  function drawMotif(ctx, motif, c, W, H, layout) {
    ctx.save();
    if (motif === 'circles') {
      ctx.globalAlpha = .96;
      ctx.fillStyle = c.soft; ctx.beginPath(); ctx.arc(W * .78, H * .30, 270, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.second; ctx.beginPath(); ctx.arc(W * .78, H * .30, 190, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(W * .78, H * .30, 104, 0, Math.PI * 2); ctx.fill();
    } else if (motif === 'lines') {
      ctx.strokeStyle = c.second; ctx.lineWidth = 17;
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(690 + i * 43, 100); ctx.lineTo(1040 + i * 43, 565); ctx.stroke(); }
      ctx.fillStyle = c.accent; ctx.fillRect(740, 635, 380, 25);
    } else if (motif === 'geometry') {
      ctx.fillStyle = c.soft; ctx.beginPath(); ctx.moveTo(840, 95); ctx.lineTo(W, 95); ctx.lineTo(W, 820); ctx.lineTo(700, 820); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.second; ctx.beginPath(); ctx.moveTo(930, 145); ctx.lineTo(W, 145); ctx.lineTo(W, 520); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(760, 680); ctx.lineTo(1120, 680); ctx.lineTo(940, 1010); ctx.closePath(); ctx.fill();
    } else if (motif === 'grid') {
      ctx.strokeStyle = c.soft; ctx.globalAlpha = .55; ctx.lineWidth = 2;
      for (let x = 650; x <= 1200; x += 54) { ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x, 1320); ctx.stroke(); }
      for (let y = 150; y <= 1320; y += 54) { ctx.beginPath(); ctx.moveTo(650, y); ctx.lineTo(1200, y); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.fillStyle = c.accent; ctx.fillRect(735, 235, 270, 270);
    } else if (motif === 'waves') {
      ctx.lineWidth = 35; ctx.strokeStyle = c.soft;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(560, 315 + k * 82); ctx.bezierCurveTo(710, 120 + k * 82, 930, 495 + k * 82, 1290, 230 + k * 82); ctx.stroke(); }
      ctx.strokeStyle = c.accent; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(600, 700); ctx.bezierCurveTo(800, 520, 1000, 865, 1280, 640); ctx.stroke();
    } else if (motif === 'cutout') {
      ctx.fillStyle = c.soft; ctx.save(); ctx.translate(930, 360); ctx.rotate(-.24); ctx.fillRect(-260, -210, 490, 500); ctx.restore();
      ctx.fillStyle = c.second; ctx.beginPath(); ctx.arc(1020, 420, 190, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.accent; ctx.save(); ctx.translate(815, 670); ctx.rotate(.28); ctx.fillRect(-180, -35, 460, 76); ctx.restore();
    }
    ctx.restore();
  }

  function drawPoster() {
    const c = paletteMap[$palette?.value] || paletteMap.forest;
    const layout = $layout?.value || 'center';
    const motif = $motif?.value || 'waves';
    const title = ($title?.value || 'JUDUL POSTER').trim().toLocaleUpperCase('id-ID');
    const desc = ($desc?.value || 'Tuliskan pesan pendukung yang singkat dan mudah dipahami.').trim();
    const cta = ($cta?.value || 'TULISKAN AJAKAN').trim().toLocaleUpperCase('id-ID');
    const canvas = document.createElement('canvas');
    canvas.width = 1240; canvas.height = 1754;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const bodyInk=readableOn(c.bg,c.paper);
    const accentInk=readableOn(c.accent,c.bg);
    const kickerInk=contrast(c.second,c.bg)>=4.5?c.second:bodyInk;
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);

    // Bentuk utama menjadi focal point dan berubah sesuai pilihan motif.
    if (motif !== 'none') drawMotif(ctx, motif, c, W, H, layout);

    // Sistem layout: tiap opsi punya posisi teks, ruang visual, dan ritme yang berbeda.
    let x = 100, y = 790, width = 940, align = 'left', titleSize = 104, kicker = 'VISUAL CAMPAIGN / DKV';
    if (layout === 'center') { x = W / 2; y = 820; width = 990; align = 'center'; titleSize = 102; }
    if (layout === 'split') { x = 92; y = 690; width = 650; align = 'left'; titleSize = 94; }
    if (layout === 'diagonal') { x = 112; y = 820; width = 900; align = 'left'; titleSize = 104; ctx.save(); ctx.translate(0, 90); ctx.rotate(-.07); ctx.fillStyle = c.accent; ctx.fillRect(30, 570, 1180, 28); ctx.restore(); }
    if (layout === 'swiss') { x = 112; y = 670; width = 825; align = 'left'; titleSize = 91; ctx.fillStyle = c.accent; ctx.fillRect(88, 175, 20, 440); ctx.fillStyle = c.second; ctx.font = '900 190px Arial, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('01', 1148, 440); ctx.strokeStyle = c.paper; ctx.globalAlpha = .35; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(88, 555); ctx.lineTo(1150, 555); ctx.stroke(); ctx.globalAlpha = 1; }
    if (layout === 'frame') { x = W / 2; y = 785; width = 930; align = 'center'; titleSize = 98; ctx.strokeStyle = c.accent; ctx.lineWidth = 12; ctx.strokeRect(58, 58, W - 116, H - 116); ctx.strokeStyle = c.second; ctx.lineWidth = 3; ctx.strokeRect(92, 92, W - 184, H - 184); }
    if (layout === 'collage') { x = 98; y = 960; width = 1000; align = 'left'; titleSize = 100; ctx.fillStyle = c.accent; ctx.save(); ctx.translate(930, 420); ctx.rotate(-.2); ctx.fillRect(-190, -180, 380, 360); ctx.restore(); ctx.fillStyle = c.second; ctx.beginPath(); ctx.arc(955, 430, 150, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c.soft; ctx.fillRect(75, 740, 1090, 62); }
    if (layout === 'type') { x = 92; y = 610; width = 1080; align = 'left'; titleSize = 122; ctx.fillStyle = c.accent; ctx.fillRect(88, 242, 760, 24); ctx.fillStyle = c.second; ctx.font = '900 35px Arial, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('TYPE / IMAGE / MESSAGE', 92, 210); }
    if (layout === 'magazine') { x=105;y=860;width=940;align='left';titleSize=98; ctx.fillStyle=c.accent;ctx.fillRect(0,0,465,560);ctx.fillStyle=c.second;ctx.fillRect(500,135,650,275);ctx.fillStyle=accentInk;ctx.font='900 205px Arial';ctx.textAlign='center';ctx.fillText('DKV',235,365);ctx.fillStyle=c.bg;ctx.fillRect(520,160,600,225);ctx.fillStyle=bodyInk;ctx.font='900 40px Arial';ctx.textAlign='left';ctx.fillText('IDEAS / VISUAL / CULTURE',545,290); }
    if (layout === 'sticker') { x=108;y=900;width=960;align='left';titleSize=105;ctx.save();ctx.translate(720,390);ctx.rotate(-.15);drawRoundedPanel(ctx,-270,-160,550,350,44,c.accent);ctx.fillStyle=accentInk;ctx.textAlign='center';ctx.font='900 120px Arial';ctx.fillText('MAKE',0,5);ctx.fillText('IT!',0,130);ctx.restore();ctx.fillStyle=c.second;ctx.beginPath();ctx.arc(210,355,115,0,Math.PI*2);ctx.fill(); }
    if (layout === 'asym') { x = 120; y = 840; width = 780; align = 'left'; titleSize = 104; ctx.fillStyle = c.soft; ctx.beginPath(); ctx.moveTo(880, 150); ctx.lineTo(1220, 150); ctx.lineTo(1220, 780); ctx.closePath(); ctx.fill(); ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(990, 470, 140, 0, Math.PI * 2); ctx.fill(); }

    // Header dan nomor seri.
    ctx.fillStyle = contrast(c.accent,c.bg)>=4.5?c.accent:bodyInk; ctx.font = '800 25px Arial, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('DKV STUDIO  /  VISUAL COMMUNICATION', 92, 100);
    ctx.fillStyle = bodyInk; ctx.globalAlpha = 1; ctx.textAlign = 'right'; ctx.font = '700 22px Arial, sans-serif'; ctx.fillText('DESIGN STUDY 01', 1148, 100); ctx.globalAlpha = 1;

    // Kicker, judul, deskripsi. Ukuran judul menyesuaikan panjang kata dan lebar bidang.
    ctx.textAlign = align; ctx.fillStyle = kickerInk; ctx.font = '800 28px Arial, sans-serif'; ctx.fillText(kicker, x, y - 82);
    const approxLength = title.length;
    const fontSize = Math.max(64, Math.min(titleSize, approxLength > 34 ? titleSize * .72 : approxLength > 25 ? titleSize * .84 : titleSize));
    const headlineLines = drawWrapped(ctx, title, x, y + 22, width, `900 ${fontSize}px Arial, sans-serif`, bodyInk, fontSize * 1.02, align, 4);
    const descTop = y + 22 + headlineLines * fontSize * 1.02 + 45;
    drawWrapped(ctx, desc, x, descTop, Math.min(width, 850), '400 37px Arial, sans-serif', bodyInk, 52, align, 4);

    // Footer call-to-action.
    const ctaY = 1510;
    ctx.fillStyle = c.accent;
    if (layout === 'frame') { ctx.fillRect(180, ctaY - 32, 880, 104); }
    else if (layout === 'type') { ctx.fillRect(88, ctaY - 32, 1060, 104); }
    else { ctx.fillRect(92, ctaY - 32, 1056, 104); }
    ctx.fillStyle = accentInk; ctx.textAlign = 'center'; ctx.font = '900 31px Arial, sans-serif';
    drawWrapped(ctx, cta, W / 2, ctaY + 28, 980, '900 31px Arial, sans-serif', accentInk, 39, 'center', 2);
    ctx.fillStyle = bodyInk; ctx.globalAlpha = 1; ctx.font = '700 21px Arial, sans-serif'; ctx.fillText('LMS DKV  ·  STUDENT DESIGN PROJECT', W / 2, 1690); ctx.globalAlpha = 1;
    return canvas;
  }

  function updatePosterPreview() {
    if (!$liveCanvas || !$preview) return;
    $preview.classList.remove(
      'palette-forest','palette-ocean','palette-sunset','palette-editorial','palette-citrus','palette-lavender','palette-mono','palette-coral',
      'layout-center','layout-split','layout-diagonal','layout-swiss','layout-frame','layout-collage','layout-type','layout-asym','layout-magazine','layout-sticker',
      'motif-circles','motif-lines','motif-geometry','motif-grid','motif-waves','motif-cutout','motif-none'
    );
    $preview.classList.add(`palette-${$palette.value}`, `layout-${$layout.value}`, `motif-${$motif.value}`);
    const source = drawPoster();
    $liveCanvas.width = source.width;
    $liveCanvas.height = source.height;
    const ctx = $liveCanvas.getContext('2d');
    if (ctx) ctx.drawImage(source, 0, 0);
    const palette=paletteMap[$palette.value]||paletteMap.forest;
    const status=$('#poster-contrast-status');
    if(status) status.textContent=`Kontras judul ${contrast(readableOn(palette.bg,palette.paper),palette.bg).toFixed(1)}:1 · tombol ${contrast(readableOn(palette.accent,palette.bg),palette.accent).toFixed(1)}:1 · teks disesuaikan otomatis.`;
    if ($exportStatus) $exportStatus.textContent = 'Live canvas diperbarui. Semua pilihan desain sudah diterapkan.';
  }

  if ($brief) $brief.addEventListener('change', () => {
    const preset = briefPresets[$brief.value];
    if (!preset) return;
    $title.value = preset.title; $desc.value = preset.desc; $cta.value = preset.cta;
    $palette.value = preset.palette; $layout.value = preset.layout; $motif.value = preset.motif;
    $$('.style-preset-card').forEach((card) => card.classList.remove('is-selected'));
    updatePosterPreview();
    if ($exportStatus) $exportStatus.textContent = `Brief “${$brief.options[$brief.selectedIndex].text}” diterapkan ke live canvas.`;
  });

  $$('[data-style-preset]').forEach((button) => button.addEventListener('click', () => {
    if ($brief) $brief.value = 'custom';
    $palette.value = button.dataset.palette;
    $layout.value = button.dataset.layout;
    $motif.value = button.dataset.motif;
    $$('.style-preset-card').forEach((card) => card.classList.toggle('is-selected', card === button));
    updatePosterPreview();
    if ($exportStatus) $exportStatus.textContent = `Gaya ${button.querySelector('b')?.textContent || 'pilihan'} diterapkan ke canvas.`;
  }));

  [$title, $desc, $cta, $palette, $layout, $motif].forEach((control) => {
    if (!control) return;
    control.addEventListener('input', updatePosterPreview);
    control.addEventListener('change', updatePosterPreview);
  });
  // Brief awal langsung diterapkan supaya pilihan dropdown dan live canvas selalu sinkron.
  if ($brief && briefPresets[$brief.value]) {
    const initialPreset = briefPresets[$brief.value];
    $title.value = initialPreset.title; $desc.value = initialPreset.desc; $cta.value = initialPreset.cta;
    $palette.value = initialPreset.palette; $layout.value = initialPreset.layout; $motif.value = initialPreset.motif;
  }
  // Jalankan setelah DOM dan renderer tersedia agar pratinjau awal bukan placeholder.
  updatePosterPreview();

  if ($download) $download.addEventListener('click', () => {
    try {
      const canvas = drawPoster();
      canvas.toBlob((blob) => {
        if (!blob) { if ($exportStatus) $exportStatus.textContent = 'Ekspor belum berhasil. Coba lagi.'; return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = 'poster-kampanye-dkv.png';
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        if ($exportStatus) $exportStatus.textContent = 'Poster berhasil diekspor sebagai PNG.';
      }, 'image/png');
    } catch (error) {
      console.error('Poster export failed:', error);
      if ($exportStatus) $exportStatus.textContent = 'Ekspor belum berhasil. Coba gunakan Chrome versi terbaru.';
    }
  });

  // Praktik susun layout: mendukung drag-and-drop dan mode pilih-lalu-ketuk.
  // Mode ketuk mengubah DOM secara langsung, sehingga tidak bergantung pada
  // dukungan DataTransfer/DragEvent sintetis pada browser ponsel.
  let selectedLayoutItem = null;
  const layoutTargets = { navbar: 'slot-1', content: 'slot-2', footer: 'slot-3' };
  const layoutCopy = {
    navbar: '<div class="challenge-placed challenge-title"><span>01 / HEADLINE</span><b>JUDUL / IDENTITAS KAMPANYE</b></div>',
    content: '<div class="challenge-placed challenge-visual"><span>02 / KEY VISUAL</span><b>✳</b><small>ILUSTRASI ATAU FOTO UTAMA</small></div>',
    footer: '<div class="challenge-placed challenge-cta"><span>03 / CALL TO ACTION</span><b>INFORMASI / AJAKAN</b></div>'
  };
  const layoutItems = $$('.wireframe-item');
  const layoutSlots = $$('.layout-slot');
  const layoutFeedback = $('#layout-feedback');
  function updateChallengeProgress() {
    const count = layoutSlots.filter(slot => slot.dataset.terisi === '1').length;
    const label = $('#challenge-step-status');
    const fill = $('#challenge-step-fill');
    if (label) label.textContent = `${count} dari 3 elemen tersusun`;
    if (fill) fill.style.width = `${count / 3 * 100}%`;
  }
  function chooseLayoutItem(item) {
    if (!item || item.draggable === false) return;
    selectedLayoutItem = item;
    layoutItems.forEach(other => { other.classList.toggle('studio-item-selected', other === item); other.setAttribute('aria-pressed', String(other === item)); });
    if (layoutFeedback) {
      layoutFeedback.className = 'challenge-feedback is-info';
      layoutFeedback.textContent = `Terpilih: ${item.textContent.trim()}. Sekarang ketuk kotak dengan fungsi yang sesuai.`;
    }
  }
  function placeLayoutItem(item, slot) {
    if (!item || !slot || slot.dataset.terisi === '1') return;
    const type = item.dataset.layout;
    if (layoutTargets[type] !== slot.id) {
      if (layoutFeedback) {
        layoutFeedback.className = 'challenge-feedback is-error';
        layoutFeedback.textContent = 'Belum tepat. Cocokkan fungsi elemen dengan area poster: judul di atas, visual di tengah, dan ajakan di bawah.';
      }
      return;
    }
    slot.innerHTML = layoutCopy[type];
    slot.dataset.terisi = '1';
    slot.classList.add('is-filled');
    item.draggable = false;
    item.setAttribute('aria-disabled', 'true');
    item.classList.remove('studio-item-selected');
    item.setAttribute('aria-pressed', 'false');
    item.classList.add('is-placed');
    selectedLayoutItem = null;
    if (layoutFeedback) {
      layoutFeedback.className = 'challenge-feedback is-success';
      layoutFeedback.textContent = 'Bagus! Elemen ditempatkan pada area yang sesuai.';
    }
    updateChallengeProgress();
    if (layoutSlots.length && layoutSlots.every(target => target.dataset.terisi === '1')) {
      if (layoutFeedback) layoutFeedback.textContent = 'Level 1 selesai! Lanjutkan ke tantangan kontras.';
      setTimeout(() => {
        $('#mini-lab .grid')?.classList.add('hidden');
        $('#level-2')?.classList.remove('hidden');
        $('#level-2')?.scrollIntoView({behavior:'smooth',block:'nearest'});
      }, 450);
    }
  }
  layoutItems.forEach(item => {
    item.addEventListener('click', () => chooseLayoutItem(item));
    item.addEventListener('dragstart', event => {
      chooseLayoutItem(item);
      event.dataTransfer.setData('text/plain', item.dataset.layout);
      event.dataTransfer.effectAllowed = 'move';
      if (layoutFeedback) layoutFeedback.textContent = `Menyeret ${item.textContent.trim()}.`;
    });
  });
  layoutSlots.forEach(slot => {
    const activateSlot = () => { if (selectedLayoutItem) placeLayoutItem(selectedLayoutItem, slot); };
    slot.addEventListener('click', activateSlot);
    slot.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateSlot(); }
    });
    slot.addEventListener('dragover', event => {
      event.preventDefault();
      slot.classList.add('is-drop-target');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('is-drop-target'));
    slot.addEventListener('drop', event => {
      event.preventDefault();
      slot.classList.remove('is-drop-target');
      const type = event.dataTransfer?.getData('text/plain');
      const item = layoutItems.find(candidate => candidate.dataset.layout === type);
      if (item) placeLayoutItem(item, slot);
      // script.js juga mendukung drop desktop; sinkronkan indikator setelah listener itu berjalan.
      setTimeout(updateChallengeProgress, 0);
    });
  });
  updateChallengeProgress();

  // Reset hanya mengulang Design Challenge; kuis, SUS, dan pengiriman data tidak disentuh.
  const resetChallengeButton = $('#challenge-reset-btn');
  const slotDefaults = {
    'slot-1': 'Letakkan judul di sini',
    'slot-2': 'Letakkan visual utama di sini',
    'slot-3': 'Letakkan ajakan/informasi di sini'
  };
  function resetChallenge() {
    selectedLayoutItem = null;
    layoutItems.forEach(item => {
      item.draggable = true;
      item.removeAttribute('aria-disabled');
      item.setAttribute('aria-pressed', 'false');
      item.classList.remove('studio-item-selected', 'is-placed');
    });
    layoutSlots.forEach(slot => {
      slot.removeAttribute('data-terisi');
      slot.classList.remove('is-filled', 'is-drop-target');
      slot.textContent = slotDefaults[slot.id] || 'Letakkan elemen di sini';
    });
    $('#mini-lab .grid')?.classList.remove('hidden');
    $('#level-2')?.classList.add('hidden');
    $('#level-3')?.classList.add('hidden');
    if (layoutFeedback) {
      layoutFeedback.className = 'challenge-feedback is-info';
      layoutFeedback.textContent = 'Tantangan diulang. Pilih judul, visual, lalu ajakan untuk mulai kembali.';
    }
    updateChallengeProgress();
  }
  resetChallengeButton?.addEventListener('click', resetChallenge);

  // Checklist proyek dan pratinjau portofolio tetap lokal di perangkat siswa.
  const projectChecks = $$('.project-check-input');
  const projectFill = $('#project-progress-fill');
  const projectText = $('#project-progress-text');
  function updateProjectProgress() {
    const done = projectChecks.filter((check) => check.checked).length;
    const percent = projectChecks.length ? done / projectChecks.length * 100 : 0;
    if (projectFill) projectFill.style.width = `${percent}%`;
    if (projectText) projectText.textContent = `${done} dari ${projectChecks.length} pemeriksaan selesai.`;
  }
  projectChecks.forEach((check) => check.addEventListener('change', updateProjectProgress));
  updateProjectProgress();

  const portfolioInput = $('#portfolio-file');
  const portfolioWrap = $('#portfolio-preview-wrap');
  const imagePreview = $('#portfolio-image-preview');
  const pdfPreview = $('#portfolio-pdf-preview');
  const pdfName = $('#portfolio-pdf-name');
  const pdfOpen = $('#portfolio-pdf-open');
  const fileStatus = $('#portfolio-file-status');
  let previousObjectUrl = null;
  if (portfolioInput) portfolioInput.addEventListener('change', () => {
    const file = portfolioInput.files && portfolioInput.files[0];
    if (!file) return;
    if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
    previousObjectUrl = URL.createObjectURL(file);
    portfolioWrap.classList.remove('hidden'); imagePreview.classList.add('hidden'); pdfPreview.classList.add('hidden');
    if (file.type.startsWith('image/')) {
      imagePreview.src = previousObjectUrl; imagePreview.classList.remove('hidden');
      fileStatus.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB · pratinjau gambar siap.`;
    } else if (file.type === 'application/pdf') {
      pdfName.textContent = file.name; pdfOpen.href = previousObjectUrl; pdfPreview.classList.remove('hidden');
      fileStatus.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB · file PDF siap dibuka.`;
    } else {
      portfolioWrap.classList.add('hidden'); fileStatus.textContent = 'Format file belum didukung. Pilih PNG, JPG, WEBP, atau PDF.';
    }
  });
})();

// Praktik pendamping Bab 4: simulator rekomendasi pengaturan pemindaian.
(() => {
  const $ = (selector) => document.querySelector(selector);
  const object = $('#scan-object');
  const mode = $('#scan-mode');
  const resolution = $('#scan-resolution');
  const advice = $('#scan-advice');
  if (!object || !mode || !resolution || !advice) return;

  function recommendScan() {
    const objectValue = object.value;
    const modeValue = mode.value;
    const dpi = Number(resolution.value);
    let expectedMode = objectValue === 'photo' ? 'color' : objectValue === 'sketch' ? 'grayscale' : 'grayscale';
    let expectedDpi = 300;
    let explanation = objectValue === 'photo'
      ? 'Foto memiliki informasi warna dan gradasi. Gunakan mode Color agar warna tetap terekam.'
      : objectValue === 'sketch'
        ? 'Sketsa garis perlu terlihat jelas. Grayscale cocok untuk mempertahankan perbedaan pensil dan bayangan; Black & White dapat dicoba bila hanya membutuhkan garis tegas.'
        : 'Dokumen teks dapat dipindai dalam Grayscale atau Black & White, bergantung pada kebutuhan keterbacaan dan ukuran file.';
    if (objectValue === 'text') expectedMode = 'grayscale';
    const modeIsGood = objectValue === 'sketch' ? ['grayscale', 'bw'].includes(modeValue) : modeValue === expectedMode;
    const dpiIsGood = dpi >= expectedDpi;
    const qualityNote = dpi < 300
      ? 'Resolusi 150 dpi lebih ringan, tetapi detail mungkin kurang memadai untuk kebutuhan cetak.'
      : dpi === 300
        ? '300 dpi merupakan titik awal yang baik untuk latihan dan kebutuhan cetak umum.'
        : '600 dpi menangkap detail lebih banyak, tetapi ukuran file biasanya lebih besar.';
    advice.innerHTML = `<b>${modeIsGood ? '✓ Mode sesuai' : '↗ Coba bandingkan mode lain'}</b><br>${explanation}<br><b>${dpiIsGood ? '✓ Resolusi memadai' : '↗ Pertimbangkan resolusi lebih tinggi'}</b><br>${qualityNote}`;
  }
  [object, mode, resolution].forEach((control) => control.addEventListener('change', recommendScan));
  recommendScan();
})();

// Praktik pendamping Bab 5: inventaris aset sederhana yang hanya tersimpan di tampilan sesi ini.
(() => {
  const $ = (selector) => document.querySelector(selector);
  const name = $('#asset-name');
  const source = $('#asset-source');
  const license = $('#asset-license');
  const add = $('#asset-add-btn');
  const list = $('#asset-list');
  const status = $('#asset-status');
  if (!name || !source || !license || !add || !list || !status) return;

  add.addEventListener('click', () => {
    const fileName = name.value.trim();
    const sourceName = source.value.trim();
    if (!fileName || !sourceName) {
      status.textContent = 'Isi nama file dan sumber terlebih dahulu.';
      status.classList.add('is-warning');
      return;
    }
    const empty = $('.asset-empty', list);
    if (empty) empty.remove();
    const row = document.createElement('li');
    const file = document.createElement('b');
    const origin = document.createElement('span');
    const rights = document.createElement('small');
    file.textContent = fileName;
    origin.textContent = sourceName;
    rights.textContent = `Lisensi: ${license.value}`;
    row.append(file, origin, rights);
    list.append(row);
    status.textContent = 'Aset berhasil dicatat pada daftar sementara ini.';
    status.classList.remove('is-warning');
    name.value = '';
    source.value = '';
  });
})();
