(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const hub = $('.mission-hub');
  if (!hub) return;

  const feedback = $('#mission-hub-feedback', hub);
  const startLayout = $('[data-mission-start="layout"]', hub);
  const startFix = $('[data-mission-start="fix"]', hub);

  function focusMission(target, message) {
    if (feedback) feedback.textContent = message;
    if (!target) return;
    target.classList.add('mission-target-pulse');
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
    window.setTimeout(() => target.classList.remove('mission-target-pulse'), 1500);
  }

  startLayout?.addEventListener('click', () => {
    const challenge = $('#mini-lab');
    focusMission(challenge, 'Misi Layout Architect dimulai. Susun tiga elemen poster, lalu lanjutkan ke tantangan kontras dan hierarki visual.');
    const firstItem = $('[data-layout="navbar"]', challenge || document);
    if (firstItem) window.setTimeout(() => firstItem.focus({ preventScroll: true }), 450);
  });

  startFix?.addEventListener('click', () => {
    const fixPanel = $('#fix-this-design-panel') || $('.fix-mission-panel');
    focusMission(fixPanel, 'Misi Fix This Design dimulai. Amati poster awal, lalu perbaiki kontras, hierarki, dan komposisinya.');
  });
})();
