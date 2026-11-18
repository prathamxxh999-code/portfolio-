(() => {
  const greeting = document.querySelector('.greeting');
  if (!greeting) return;

  const stage = greeting.querySelector('.greeting-stage');
  const heading = greeting.querySelector('#greeting-title');
  const language = greeting.querySelector('.greeting-language');
  const control = greeting.querySelector('.greeting-play');
  const canvas = greeting.querySelector('.greeting-swarm');
  const context = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const greetings = [
    ['Hello.', 'en', 'English'],
    ['नमस्कार', 'mr', 'Marathi', true],
    ['Hola.', 'es', 'Spanish'],
    ['こんにちは', 'ja', 'Japanese', true],
    ['Bonjour.', 'fr', 'French', true],
    ['مرحبًا', 'ar', 'Arabic'],
    ['नमस्ते', 'hi', 'Hindi', true],
    ['你好', 'zh', 'Chinese', true],
    ['안녕하세요', 'ko', 'Korean', true],
    ['Hallo.', 'de', 'German']
  ];
  const interval = 1160;
  const duration = interval * greetings.length;

  const colors = ['#a7b7ff', '#ceff80', '#eab1ff', '#8fddfb', '#ffc583', '#ff9abf', '#a0e8cc'];
  const sprites = context ? colors.map(makeCursor) : [];
  let seed = 9217;
  const swarm = context ? Array.from({ length: 1000 }, makeParticle) : [];
  let width = 0;
  let height = 0;
  let inView = false;
  let elapsed = reducedMotion.matches ? duration : 0;
  let previousFrame = null;
  let lastPaint = -Infinity;
  let frame = 0;
  let currentGreeting = 0;
  let playing = !reducedMotion.matches;

  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function makeCursor(color) {
    const sprite = document.createElement('canvas');
    sprite.width = 28;
    sprite.height = 36;
    const brush = sprite.getContext('2d');
    brush.beginPath();
    brush.moveTo(2, 2);
    brush.lineTo(26, 21);
    brush.lineTo(15.5, 22);
    brush.lineTo(20, 32.5);
    brush.lineTo(14, 35);
    brush.lineTo(9.5, 25);
    brush.lineTo(4, 32);
    brush.closePath();
    brush.lineJoin = 'round';
    brush.strokeStyle = '#0b101c';
    brush.lineWidth = 2.5;
    brush.fillStyle = color;
    brush.fill();
    brush.stroke();
    return sprite;
  }

  function makeParticle() {
    let endX, endY;
    do {
      endX = .012 + random() * .976;
      endY = .022 + random() * .94;
    } while (Math.abs(endX - .5) < .305 && Math.abs(endY - .5) < .24);
    const side = Math.floor(random() * 4);
    const atEdge = random();
    return {
      endX, endY,
      startX: side === 0 ? -.06 : side === 1 ? 1.06 : atEdge,
      startY: side === 2 ? -.11 : side === 3 ? 1.11 : atEdge,
      delay: random() * 820,
      phase: random() * Math.PI * 2,
      size: 5.2 + random() * 8.6,
      opacity: .20 + random() * .47,
      sprite: sprites[Math.floor(random() * sprites.length)]
    };
  }

  function draw(time) {
    if (!context || !width || !height) return;
    context.clearRect(0, 0, width, height);
    const settling = Math.min(1, Math.max(0, (duration - time) / 950));
    const scale = width < 540 ? .77 : 1;
    const beat = time * .0019;
    for (const particle of swarm) {
      const travel = Math.max(0, Math.min(1, (time - particle.delay) / 1350));
      if (!travel) continue;
      const eased = 1 - (1 - travel) ** 3;
      const offset = particle.phase + beat;
      const x = (particle.startX + (particle.endX - particle.startX) * eased) * width +
        Math.sin(offset) * 11 * eased * settling;
      const y = (particle.startY + (particle.endY - particle.startY) * eased) * height +
        Math.cos(offset) * 8 * eased * settling;
      const size = particle.size * scale;
      context.globalAlpha = particle.opacity * Math.min(1, travel * 5);
      context.drawImage(particle.sprite, x, y, size, size * 1.29);
    }
    context.globalAlpha = 1;
  }

  function resize() {
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height || !context) return;
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(elapsed);
  }

  function showGreeting(index) {
    if (index === currentGreeting) return;
    currentGreeting = index;
    const [word, code, name, wide] = greetings[index];
    const span = document.createElement('span');
    span.lang = code;
    span.dir = 'auto';
    span.toggleAttribute('data-wide', Boolean(wide));
    span.textContent = word;
    heading.replaceChildren(span);
    language.textContent = name;
  }

  function updateControl() {
    control.textContent = reducedMotion.matches ? 'Next greeting' :
      playing ? 'Pause animation' : elapsed >= duration ? 'Replay greeting' : 'Resume animation';
  }

  function syncPlayback() {
    const active = playing && inView && !document.hidden && !reducedMotion.matches;
    greeting.toggleAttribute('data-playing', active);
    if (active && !frame) frame = requestAnimationFrame(tick);
    if (!active) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previousFrame = null;
    }
  }

  function tick(now) {
    frame = 0;
    if (previousFrame !== null) elapsed = Math.min(duration, elapsed + now - previousFrame);
    previousFrame = now;
    if (elapsed >= duration) {
      playing = false;
      syncPlayback();
      showGreeting(0);
      draw(duration);
      updateControl();
      return;
    }
    showGreeting(Math.floor(elapsed / interval));
    if (now - lastPaint >= 30) {
      draw(elapsed);
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }

  control.addEventListener('click', () => {
    if (reducedMotion.matches) {
      showGreeting((currentGreeting + 1) % greetings.length);
      return;
    }
    if (elapsed >= duration) {
      elapsed = 0;
      showGreeting(0);
      draw(0);
    }
    playing = !playing;
    updateControl();
    syncPlayback();
  });

  reducedMotion.addEventListener('change', () => {
    playing = false;
    elapsed = duration;
    syncPlayback();
    draw(duration);
    updateControl();
  });
  document.addEventListener('visibilitychange', syncPlayback);

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= .16;
      syncPlayback();
    }, { threshold: .16 }).observe(stage);
  } else {
    inView = true;
    syncPlayback();
  }
  control.hidden = false;
  updateControl();
  resize();
})();
