// shared/video-player.js — Cinematic Video Cutscene Player
// Plays mission videos automatically, then smoothly exits to the next section upon completion.
// Includes a "Skip Video ▸▸" button and error-safe fallbacks.

export function playCutscene(videoSrc, title = 'Mission Briefing') {
  return new Promise((resolve) => {
    // If running in an environment without DOM, resolve immediately
    if (typeof document === 'undefined' || !document.body) {
      return resolve();
    }

    const overlay = document.createElement('div');
    overlay.id = 'video-cutscene-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 999999;
      background: #000;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      animation: fade-in .3s ease-out;
    `;

    overlay.innerHTML = `
      <div style="position:absolute; top:18px; left:24px; color:#00e5ff; font-family:ui-monospace,monospace; font-size:.9rem; letter-spacing:.1em; z-index:10; background:rgba(0,0,0,0.6); padding:6px 12px; border-radius:6px; border:1px solid #1a365d;">
        ▶ TRANSMISSION // ${title.toUpperCase()}
      </div>

      <button id="btn-skip-video" style="
        position: absolute; top: 18px; right: 24px; z-index: 10;
        background: rgba(13, 27, 42, 0.85);
        color: #00e5ff; border: 1px solid #00bcd4;
        border-radius: 20px; padding: 8px 18px;
        font: 700 0.85rem ui-monospace, monospace;
        cursor: pointer; transition: all .2s;
        box-shadow: 0 0 12px rgba(0, 188, 212, 0.3);
      ">
        Skip Video ▸▸
      </button>

      <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; max-width:1100px; padding:20px;">
        <video id="cutscene-video" playsinline controls autoplay style="
          width: 100%; max-height: 85vh; border-radius: 8px;
          box-shadow: 0 0 40px rgba(0,0,0,0.9), 0 0 25px rgba(0, 188, 212, 0.2);
          background: #000;
        ">
          <source src="${encodeURI(videoSrc)}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    `;

    document.body.appendChild(overlay);

    const video = overlay.querySelector('#cutscene-video');
    const skipBtn = overlay.querySelector('#btn-skip-video');

    skipBtn.onmouseenter = () => { skipBtn.style.background = '#00bcd4'; skipBtn.style.color = '#000'; };
    skipBtn.onmouseleave = () => { skipBtn.style.background = 'rgba(13, 27, 42, 0.85)'; skipBtn.style.color = '#00e5ff'; };

    let finished = false;
    function cleanup() {
      if (finished) return;
      finished = true;
      if (video) {
        video.pause();
        video.src = '';
      }
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity .35s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 350);
    }

    // Video events
    video.onended = cleanup;
    skipBtn.onclick = cleanup;

    // Handle autoplay restrictions gracefully
    video.play().catch(() => {
      // If browser blocks unmuted audio autoplay, try muted autoplay
      video.muted = true;
      video.play().catch(() => {
        // If still blocked, user can click play or skip
      });
    });

    video.onerror = () => {
      console.warn('Video failed to load, continuing to activity:', videoSrc);
      cleanup();
    };
  });
}
