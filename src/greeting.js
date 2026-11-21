import { cursorColors, cursorSprite, paintCommentCursor } from './cursor-frames.js';
import { createRetroIntro } from './retro-intro.js';

(() => {
  const finishBoot = () => document.dispatchEvent(new Event('portfolio:intro-ready'));
  const splash = document.querySelector('.greeting-splash');
  const hero = document.querySelector('.hero');
  if (!splash || !hero) { finishBoot(); return; }
  if (new URLSearchParams(location.search).get('pc-screen') === '1') {
    document.documentElement.classList.add('pc-embedded');
    splash.remove();
    const notify = () => parent.postMessage({ type: 'pc:ready' }, location.origin);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', notify, { once: true });
    else notify();
    document.addEventListener('keydown', event => { if (event.key === 'Escape') parent.postMessage({ type: 'pc:desktop' }, location.origin); });
    return;
  }

  const panel = splash.querySelector('.greeting-window');
  const stage = panel.querySelector('.greeting-stage');
  const canvas = panel.querySelector('.greeting-swarm');
  const heading = panel.querySelector('#greeting-title span');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const retro = createRetroIntro(splash, { onEnter: enterPortfolio, onRestart: restartGreeting, motion });
  const context = canvas.getContext('2d');
  const mask = document.createElement('canvas');
  const ink = mask.getContext('2d', { willReadFrequently: true });
  const supportsSplash = Boolean(context && ink && typeof splash.showModal === 'function');
  const atHome = () => ['', '#top', '#intro', '#home'].includes(location.hash);

  const greetings = [
    ['Hello', 'en'],
    ['नमस्कार', 'mr'],
    ['Hola', 'es'],
    ['こんにちは', 'ja']
  ];
  const opening = [0, 1, 2, 3, 0];
  const cursorCount = 1000;
  const orbitEnd = 560;
  const assembleEnd = 1460;
  const morphStart = 1730;
  const beat = 735;
  const morphLength = 435;
  const handoff = 620;
  const collaborators = [[.13, .31], [.23, .74], [.77, .24], [.88, .65], [.66, .78]];
  let width = 0;
  let height = 0;
  let activeGreeting = 0;
  let playback = null;
  let nextFrame = 0;
  let leaveTimer = 0;
  let seed = 11987;
  const shapes = new Map();

  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const sprites = context ? cursorColors.map(color =>
    Array.from({ length: 8 }, (_, direction) => cursorSprite(color, direction * Math.PI / 4))) : [];
  const swarm = context ? Array.from({ length: cursorCount }, (_, index) => ({
    angle: index % 13 * Math.PI * 2 / 13 + (random() - .5) * .5,
    radius: .45 + random() * .62,
    delay: random() * .21,
    scale: .83 + random() * .34,
    sprites: sprites[Math.floor(random() * sprites.length)]
  })) : [];

  function shape(index) {
    if (shapes.has(index)) return shapes.get(index);
    const [word] = greetings[index];
    const ratio = Math.min(1, 1000 / width, 560 / height);
    const maskWidth = Math.max(1, Math.round(width * ratio));
    const maskHeight = Math.max(1, Math.round(height * ratio));
    mask.width = maskWidth;
    mask.height = maskHeight;
    const font = 'Arial Black, Arial, Nirmala UI, sans-serif';
    let size = Math.min(maskHeight * .56, maskWidth * .41, 250);
    ink.direction = 'ltr';
    ink.textAlign = 'center';
    ink.font = `900 ${size}px ${font}`;
    size *= Math.min(1, maskWidth * .78 / Math.max(1, ink.measureText(word).width));
    size *= retro?.wordScale() ?? 1;
    ink.font = `900 ${size}px ${font}`;
    const metrics = ink.measureText(word);
    const ascent = metrics.actualBoundingBoxAscent ?? size * .72;
    const descent = metrics.actualBoundingBoxDescent ?? size * .12;
    ink.fillText(word, maskWidth / 2, (maskHeight + ascent - descent) / 2);

    const pixels = ink.getImageData(0, 0, maskWidth, maskHeight).data;
    let area = 0;
    for (let alpha = 3; alpha < pixels.length; alpha += 4) if (pixels[alpha] > 127) area++;
    let step = Math.max(1, Math.sqrt(area / cursorCount) * .78);
    let samples = [];
    for (let attempt = 0; attempt < 4; attempt++) {
      samples = [];
      for (let row = 0, y = step / 2; y < maskHeight; y += step, row++) {
        for (let x = row % 2 ? step / 2 : 0; x < maskWidth; x += step) {
          if (pixels[(Math.floor(y) * maskWidth + Math.floor(x)) * 4 + 3] > 127) {
            samples.push({ x: x / ratio, y: y / ratio, strip: Math.floor(x / (step * 2)) });
          }
        }
      }
      if (samples.length >= cursorCount || step === 1) break;
      step = Math.max(1, step * .78);
    }
    samples.sort((first, second) => first.strip - second.strip ||
      (first.strip % 2 ? second.y - first.y : first.y - second.y));
    const result = samples.length ? {
      size: Math.max(1.7, Math.min(13, step * 1.34 / ratio)),
      points: Array.from({ length: cursorCount }, (_, point) =>
        samples[Math.floor((point + .5) * samples.length / cursorCount)])
    } : null;
    shapes.set(index, result);
    return result;
  }

  function label(index) {
    if (activeGreeting === index) return;
    activeGreeting = index;
    const [word, code] = greetings[index];
    heading.textContent = word;
    heading.lang = code;
  }

  function ease(value) {
    return value * value * (3 - 2 * value);
  }

  function paint(time) {
    if (!context || !ink || !width || !height) return;
    let fromIndex = activeGreeting;
    let toIndex = activeGreeting;
    let amount = 1;
    let inOrbit = false;
    if (playback) {
      const sequence = playback.sequence;
      if (time < morphStart) {
        fromIndex = null;
        toIndex = sequence[0];
        inOrbit = time < orbitEnd;
        amount = Math.max(0, Math.min(1, (time - orbitEnd) / (assembleEnd - orbitEnd)));
      } else {
        const offset = time - morphStart;
        const segment = Math.min(sequence.length - 2, Math.floor(offset / beat));
        fromIndex = sequence[segment];
        toIndex = sequence[segment + 1];
        amount = Math.max(0, Math.min(1, (offset - segment * beat) / morphLength));
      }
      label(amount >= .5 ? toIndex : (fromIndex ?? toIndex));
    }
    const phase = inOrbit ? 'orbit' : amount < 1 ? 'compose' : 'formed';
    if (panel.dataset.phase !== phase) panel.dataset.phase = phase;
    const selectionProgress = time < morphStart ? ease(amount) : 1;
    panel.style.setProperty('--frame-open', selectionProgress);
    panel.style.setProperty('--frame-opacity', Math.min(1, selectionProgress * 5));
    const incoming = shape(toIndex);
    const outgoing = fromIndex === null ? null : shape(fromIndex);
    panel.toggleAttribute('data-rendered', Boolean(incoming));
    context.clearRect(0, 0, width, height);
    if (!incoming) return;

    const ring = Math.min(width, height);
    const openingDepth = Math.min(1, time / orbitEnd);
    const openingRadius = .32 + .68 * ease(openingDepth);
    const orbitTip = Math.max(4.3, Math.min(9.8, ring * .011));
    for (let index = 0; index < cursorCount; index++) {
      const particle = swarm[index];
      const next = incoming.points[index];
      const previous = outgoing?.points[index];
      const angle = particle.angle + Math.min(time, orbitEnd + 290) * .0028;
      const startX = previous?.x ?? width / 2 + Math.cos(angle) * ring * .35 * particle.radius * openingRadius;
      const startY = previous?.y ?? height / 2 + Math.sin(angle) * ring * .22 * particle.radius * openingRadius;
      const progress = ease(Math.max(0, Math.min(1, (amount - particle.delay) / (1 - particle.delay))));
      const size = ((outgoing?.size ?? orbitTip * (1 + Math.sin(angle) * .23)) * (1 - progress) +
        incoming.size * progress) * particle.scale;
      const drift = time * .00245 + particle.angle * 4;
      const x = startX + (next.x - startX) * progress + Math.sin(drift) * progress * 2.3;
      const y = startY + (next.y - startY) * progress + Math.cos(drift * 1.13) * progress * 2.7;
      context.globalAlpha = inOrbit ? .75 + Math.sin(angle) * .12 : .96;
      const direction = inOrbit ? Math.round((angle + 1.6) / (Math.PI / 4)) & 7 : 0;
      context.drawImage(particle.sprites[direction], x - size * .62, y - size * .62, size * 1.24, size * 1.24);
    }
    const driftDistance = Math.min(width, height);
    collaborators.forEach(([anchorX, anchorY], index) => {
      const motion = time * .0011 + index * 1.22;
      const x = width * anchorX + Math.sin(motion) * driftDistance * .047;
      const y = height * anchorY + Math.cos(motion * 1.22) * driftDistance * .039;
      context.globalAlpha = Math.min(1, time / 620);
      paintCommentCursor(context, sprites[index][0], cursorColors[index], x, y,
        width <= 600 ? 13 : 20, width, height);
    });
    context.globalAlpha = 1;
    if (selectionProgress > 0 && selectionProgress < 1) {
      const x = width * (.09 + .82 * selectionProgress);
      const y = height * (.22 + .56 * selectionProgress);
      context.drawImage(sprites[0][0], x - 4, y - 3, 22, 22);
    }
  }

  function resize() {
    if (!splash.open) return;
    const bounds = stage.getBoundingClientRect();
    retro?.resize();
    const logical = retro?.logicalSize();
    const nextWidth = logical?.width ?? Math.round(bounds.width);
    const nextHeight = logical?.height ?? Math.round(bounds.height);
    if (!context || !nextWidth || !nextHeight || (width === nextWidth && height === nextHeight)) return;
    width = nextWidth;
    height = nextHeight;
    const ratio = logical ? 1 : Math.min(devicePixelRatio || 1, width <= 650 ? 1.35 : 1.8);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    shapes.clear();
    paint(playback?.elapsed ?? 0);
  }

  function stopClock() {
    if (nextFrame) cancelAnimationFrame(nextFrame);
    nextFrame = 0;
    if (playback) playback.previous = null;
  }

  function syncClock() {
    if (playback && !playback.leaving && !playback.waiting && !document.hidden && !nextFrame) {
      nextFrame = requestAnimationFrame(tick);
    } else if (document.hidden) {
      stopClock();
    }
  }

  function tick(now) {
    nextFrame = 0;
    if (!playback || playback.leaving) return;
    const delta = playback.previous === null ? 0 : Math.min(80, now - playback.previous);
    playback.previous = now;
    if (playback.entering) {
      playback.entryElapsed += delta;
      retro?.enter(playback.entryElapsed);
      if (playback.entryElapsed >= retro.entryDuration) {
        playback.waiting = true;
        playback.entering = false;
        playback.previous = null;
        retro.showDesktop();
        return;
      }
      syncClock();
      return;
    }
    playback.elapsed += delta;
    if (retro && playback.elapsed >= retro.greetingEndAt) {
      playback.elapsed = retro.greetingEndAt;
      playback.waiting = true;
      playback.previous = null;
      const current = playback;
      retro.revealWelcome().then(completed => { if (completed && playback === current) retro.wait(); });
      return;
    }
    if (!retro && playback.elapsed >= playback.duration) {
      paint(Math.max(0, playback.duration - (retro?.greetingStart ?? 0)));
      retro?.update(playback.duration);
      closeSplash(true);
      return;
    }
    if ((!retro || playback.elapsed < retro.greetingEndAt) && now - playback.paintTime >= 30) {
      paint(Math.max(0, playback.elapsed - (retro?.greetingStart ?? 0)));
      playback.paintTime = now;
    }
    retro?.update(playback.elapsed);
    syncClock();
  }

  function enterPortfolio() {
    if (!playback || playback.leaving || playback.entering || !playback.waiting || !retro) return;
    playback.waiting = false;
    playback.entering = true;
    playback.entryElapsed = 0;
    playback.previous = null;
    retro.beginEntry();
    syncClock();
  }

  function restartGreeting() {
    stopClock();clearTimeout(leaveTimer);retro?.stop();
    if(splash.open)splash.close();
    playback=null;document.documentElement.classList.remove('greeting-lock');
    openSplash();
  }

  function openSplash() {
    if (!supportsSplash || (motion.matches && !retro) || splash.open) return;
    playback = {
      sequence: opening, elapsed: 0, previous: null, paintTime: -Infinity, leaving: false,
      waiting: false, entering: false, entryElapsed: 0,
      duration: morphStart + (opening.length - 1) * beat + 160
    };
    label(0);
    panel.dataset.phase = 'orbit';
    retro?.reset();
    hero.classList.add('portrait-awaiting-light');
    splash.showModal();
    document.documentElement.classList.add('greeting-lock');
    resize();
    paint(0);
    // Reveal the document only after the modal is open and laid out. The
    // inline head guard prevents the homepage from painting before this.
    finishBoot();
    if (retro) retro.ready.then(loaded => {
      if (!playback) return;
      if (!loaded) resize();
      retro.start();
      if (motion.matches) { playback.waiting = true; retro.showDesktop(); return; }
      syncClock();
    });
    else syncClock();
  }

  function closeSplash(animate) {
    if (!playback || (playback.leaving && animate)) return;
    playback.leaving = true;
    retro?.stop();
    stopClock();
    clearTimeout(leaveTimer);
    function restore() {
      splash.close();
      splash.removeAttribute('data-leaving');
      document.documentElement.classList.remove('greeting-lock');
      playback = null;
      hero.classList.remove('portrait-awaiting-light');
      if (atHome()) {
        if (!motion.matches) hero.classList.add('portrait-light-on');
        hero.focus({ preventScroll: true });
      }
    }
    if (animate && !motion.matches) {
      splash.setAttribute('data-leaving', '');
      leaveTimer = setTimeout(restore, handoff);
    } else {
      restore();
    }
  }

  splash.addEventListener('cancel', event => {
    event.preventDefault();
    if (retro) { stopClock(); playback.waiting = true; playback.entering = false; retro.escape(); }
    else closeSplash(false);
  });
  motion.addEventListener('change', () => {
    if (splash.open && retro && motion.matches) { stopClock(); playback.waiting = true; playback.entering = false; retro.showDesktop(); }
    else if (splash.open && !retro) closeSplash(false);
  });
  window.addEventListener('hashchange', () => {
    if (splash.open && !atHome() && !retro?.persistent) closeSplash(false);
  });
  document.addEventListener('visibilitychange', syncClock);
  if ('ResizeObserver' in window) { const observer = new ResizeObserver(resize); if (!retro) observer.observe(stage); observer.observe(splash); }
  else window.addEventListener('resize', resize);

  if (supportsSplash && (atHome() || retro?.persistent)) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    openSplash();
  } else finishBoot();
})();
