(() => {
  const inline = document.querySelector('.greeting');
  const splash = document.querySelector('.greeting-splash');
  const hero = document.querySelector('.hero');
  if (!inline || !splash || !hero) return;

  const panel = inline.querySelector('.greeting-window');
  const stage = panel.querySelector('.greeting-stage');
  const canvas = panel.querySelector('.greeting-swarm');
  const heading = panel.querySelector('#greeting-title span');
  const language = panel.querySelector('.greeting-language');
  const replay = panel.querySelector('.greeting-play');
  const skip = panel.querySelector('.greeting-skip');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const context = canvas.getContext('2d');
  const mask = document.createElement('canvas');
  const ink = mask.getContext('2d', { willReadFrequently: true });
  const supportsSplash = Boolean(context && ink && typeof splash.showModal === 'function');

  const greetings = [
    ['Hello', 'en', 'English'],
    ['नमस्कार', 'mr', 'Marathi'],
    ['Hola', 'es', 'Spanish'],
    ['こんにちは', 'ja', 'Japanese'],
    ['Bonjour', 'fr', 'French'],
    ['مرحبًا', 'ar', 'Arabic'],
    ['नमस्ते', 'hi', 'Hindi'],
    ['你好', 'zh', 'Chinese'],
    ['안녕하세요', 'ko', 'Korean'],
    ['Hallo', 'de', 'German']
  ];
  const opening = [0, 1, 2, 3, 0];
  const fullSequence = [...greetings.keys(), 0];
  const cursorCount = 1000;
  const orbitEnd = 430;
  const assembleEnd = 1100;
  const morphStart = 1530;
  const beat = 640;
  const morphLength = 360;
  const sessionKey = 'portfolio-cursor-splash-v2';
  let seen = false;
  let width = 0;
  let height = 0;
  let activeGreeting = 0;
  let playback = null;
  let nextFrame = 0;
  let leaveTimer = 0;
  let arrivalTimer = 0;
  let seed = 11987;
  const shapes = new Map();

  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function cursor(color) {
    const sprite = document.createElement('canvas');
    sprite.width = 24;
    sprite.height = 30;
    const brush = sprite.getContext('2d');
    brush.beginPath();
    brush.moveTo(2, 2);
    brush.lineTo(22, 17);
    brush.lineTo(14, 18);
    brush.lineTo(18, 26);
    brush.lineTo(13, 28);
    brush.lineTo(9, 20);
    brush.lineTo(4, 25);
    brush.closePath();
    brush.fillStyle = color;
    brush.strokeStyle = '#101a0d';
    brush.lineWidth = 1.35;
    brush.lineJoin = 'round';
    brush.fill();
    brush.stroke();
    return sprite;
  }

  const sprites = context ? ['#c6ff46', '#dbff8e', '#f1ffd9', '#82b846', '#a2e6a4'].map(cursor) : [];
  const swarm = context ? Array.from({ length: cursorCount }, (_, index) => ({
    angle: index % 13 * Math.PI * 2 / 13 + (random() - .5) * .5,
    radius: .45 + random() * .62,
    delay: random() * .21,
    scale: .83 + random() * .34,
    sprite: sprites[Math.floor(random() * sprites.length)]
  })) : [];

  function shape(index) {
    if (shapes.has(index)) return shapes.get(index);
    const [word, code] = greetings[index];
    const ratio = Math.min(1, 1000 / width, 560 / height);
    const maskWidth = Math.max(1, Math.round(width * ratio));
    const maskHeight = Math.max(1, Math.round(height * ratio));
    mask.width = maskWidth;
    mask.height = maskHeight;
    const font = 'Arial Black, Arial, Nirmala UI, sans-serif';
    let size = Math.min(maskHeight * .56, maskWidth * .41, 250);
    ink.direction = code === 'ar' ? 'rtl' : 'ltr';
    ink.textAlign = 'center';
    ink.font = `900 ${size}px ${font}`;
    size *= Math.min(1, maskWidth * .78 / Math.max(1, ink.measureText(word).width));
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
    const [word, code, name] = greetings[index];
    heading.textContent = word;
    heading.lang = code;
    language.textContent = name;
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
    const incoming = shape(toIndex);
    const outgoing = fromIndex === null ? null : shape(fromIndex);
    panel.toggleAttribute('data-rendered', Boolean(incoming));
    context.clearRect(0, 0, width, height);
    if (!incoming) return;

    const ring = Math.min(width, height);
    for (let index = 0; index < cursorCount; index++) {
      const particle = swarm[index];
      const next = incoming.points[index];
      const previous = outgoing?.points[index];
      const angle = particle.angle + Math.min(time, orbitEnd + 210) * .004;
      const startX = previous?.x ?? width / 2 + Math.cos(angle) * ring * .33 * particle.radius;
      const startY = previous?.y ?? height / 2 + Math.sin(angle) * ring * .23 * particle.radius;
      const progress = ease(Math.max(0, Math.min(1, (amount - particle.delay) / (1 - particle.delay))));
      const size = ((outgoing?.size ?? Math.max(3.8, ring * .012)) * (1 - progress) +
        incoming.size * progress) * particle.scale;
      const x = startX + (next.x - startX) * progress;
      const y = startY + (next.y - startY) * progress;
      context.globalAlpha = inOrbit ? .60 : .96;
      context.drawImage(particle.sprite, x - size * .46, y - size * .56, size, size * 1.25);
    }
    context.globalAlpha = 1;
  }

  function resize() {
    const bounds = stage.getBoundingClientRect();
    const nextWidth = Math.round(bounds.width);
    const nextHeight = Math.round(bounds.height);
    if (!context || !nextWidth || !nextHeight || (width === nextWidth && height === nextHeight)) return;
    width = nextWidth;
    height = nextHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.8);
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
    if (playback && !playback.leaving && !document.hidden && !nextFrame) {
      nextFrame = requestAnimationFrame(tick);
    } else if (document.hidden) {
      stopClock();
    }
  }

  function tick(now) {
    nextFrame = 0;
    if (!playback || playback.leaving) return;
    if (playback.previous !== null) playback.elapsed += now - playback.previous;
    playback.previous = now;
    if (playback.elapsed >= playback.duration) {
      paint(playback.duration);
      closeSplash(true);
      return;
    }
    if (now - playback.paintTime >= 30) {
      paint(playback.elapsed);
      playback.paintTime = now;
    }
    syncClock();
  }

  function openSplash(isOpening) {
    if (!supportsSplash || motion.matches || splash.open) return;
    const sequence = isOpening ? opening : fullSequence;
    playback = {
      sequence, isOpening, originalScroll: window.scrollY, elapsed: 0, previous: null, paintTime: -Infinity, leaving: false,
      duration: morphStart + (sequence.length - 1) * beat + 180
    };
    label(0);
    replay.hidden = true;
    skip.hidden = false;
    panel.dataset.phase = 'orbit';
    inline.style.minHeight = `${inline.offsetHeight}px`;
    splash.append(panel);
    document.documentElement.classList.add('greeting-lock');
    splash.showModal();
    resize();
    paint(0);
    syncClock();
  }

  function closeSplash(animate) {
    if (!playback || (playback.leaving && animate)) return;
    const { isOpening, originalScroll } = playback;
    playback.leaving = true;
    stopClock();
    clearTimeout(leaveTimer);
    function restore() {
      inline.append(panel);
      splash.close();
      splash.removeAttribute('data-leaving');
      document.documentElement.classList.remove('greeting-lock');
      inline.style.minHeight = '';
      playback = null;
      skip.hidden = true;
      replay.hidden = false;
      replay.textContent = motion.matches || !supportsSplash ? 'Next greeting' : 'Replay greeting';
      label(0);
      resize();
      paint(0);
      if (Math.abs(window.scrollY - originalScroll) > 1) window.scrollTo({ top: originalScroll, behavior: 'instant' });
      (isOpening ? hero : replay).focus({ preventScroll: true });
    }
    if (animate && !motion.matches) {
      if (isOpening) {
        hero.classList.add('greeting-arrival');
        clearTimeout(arrivalTimer);
        arrivalTimer = setTimeout(() => hero.classList.remove('greeting-arrival'), 1400);
      }
      splash.setAttribute('data-leaving', '');
      leaveTimer = setTimeout(restore, 560);
    } else {
      restore();
    }
  }

  replay.hidden = false;
  replay.textContent = motion.matches || !supportsSplash ? 'Next greeting' : 'Replay greeting';
  replay.addEventListener('click', () => {
    if (motion.matches || !supportsSplash) {
      label((activeGreeting + 1) % greetings.length);
      paint(0);
    } else {
      openSplash(false);
    }
  });
  skip.addEventListener('click', () => closeSplash(false));
  splash.addEventListener('cancel', event => {
    event.preventDefault();
    closeSplash(false);
  });
  motion.addEventListener('change', () => {
    if (splash.open) closeSplash(false);
    replay.textContent = motion.matches || !supportsSplash ? 'Next greeting' : 'Replay greeting';
  });
  document.addEventListener('visibilitychange', syncClock);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);

  try { seen = sessionStorage.getItem(sessionKey) === '1'; } catch {}
  if (!seen && !motion.matches && supportsSplash && (!location.hash || location.hash === '#top') &&
      window.scrollY < 60) {
    openSplash(true);
    try { sessionStorage.setItem(sessionKey, '1'); } catch {}
  } else {
    resize();
    if (location.hash === '#greeting') {
      requestAnimationFrame(() => inline.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
  }
})();
