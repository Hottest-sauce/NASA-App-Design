// shared/konami.js — Secret Konami Code System
// Code sequence: UP, UP, DOWN, LEFT, RIGHT, UP
// Skips current and upcoming cutscenes and DadPhone transmissions.

const SECRET_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'];
let buffer = [];

export function initSecretKonamiCode() {
  if (typeof window === 'undefined') return;

  window.addEventListener('keydown', (e) => {
    // Only capture arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      buffer = [];
      return;
    }

    buffer.push(e.key);
    if (buffer.length > SECRET_SEQUENCE.length) {
      buffer.shift();
    }

    // Check if matched
    if (buffer.length === SECRET_SEQUENCE.length && SECRET_SEQUENCE.every((k, idx) => buffer[idx] === k)) {
      buffer = [];
      triggerSkip();
    }
  });
}

export function triggerSkip() {
  window.__SECRET_SKIP_ACTIVE = true;

  // 1. Skip any playing video cutscene immediately
  const skipBtn = document.querySelector('#btn-skip-video');
  if (skipBtn) {
    skipBtn.click();
  }

  // 2. Skip/close active DadPhone dialogues and flush queue
  if (window.DadPhone && typeof window.DadPhone.close === 'function') {
    window.DadPhone.close(true);
  }

  // 3. Skip minigame cutscene if active
  if (window.__skipActiveCutscene && typeof window.__skipActiveCutscene === 'function') {
    window.__skipActiveCutscene();
  }

  // 4. Skip active minigame if running
  if (window.__skipActiveMinigame && typeof window.__skipActiveMinigame === 'function') {
    window.__skipActiveMinigame();
  }

  // Visual confirmation HUD notification
  showToastNotification('⚡ SECRET CODE: UP UP DOWN LEFT RIGHT UP — SKIPPING MINIGAME & CUTSCENES');
}

function showToastNotification(msg) {
  let toast = document.querySelector('#konami-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'konami-toast';
    toast.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      z-index: 9999999;
      background: rgba(10, 25, 47, 0.95);
      border: 2px solid #00e5ff;
      border-radius: 8px;
      color: #00e5ff;
      padding: 10px 22px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      box-shadow: 0 0 25px rgba(0, 229, 255, 0.5);
      pointer-events: none;
      transition: opacity .4s ease, transform .4s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
  }, 2400);
}
