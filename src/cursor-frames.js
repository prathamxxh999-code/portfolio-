export const cursorColors = ['#73e5e7', '#a5edbb', '#ffc2d1', '#c9bdff', '#ffe19d'];

export function cursorSprite(color, rotation = 0) {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 32;
  const brush = sprite.getContext('2d');
  brush.translate(16, 16);
  brush.rotate(rotation);
  brush.beginPath();
  brush.moveTo(-9, -11);
  brush.lineTo(11, 1);
  brush.lineTo(1, 3);
  brush.lineTo(-5, 11);
  brush.closePath();
  brush.fillStyle = color;
  brush.strokeStyle = '#fffdf6';
  brush.lineWidth = 2.2;
  brush.lineJoin = 'round';
  brush.fill();
  brush.stroke();
  return sprite;
}

export function paintCommentCursor(context, sprite, color, x, y, size, width, height) {
  context.drawImage(sprite, x - size * .22, y - size * .17, size, size);
  const pillWidth = size * .86;
  const pillHeight = size * .5;
  const left = x + size * 1.45 > width ? x - size * 1.05 : x + size * .49;
  const top = y + size > height ? y - size * .73 : y + size * .39;
  context.beginPath();
  if (context.roundRect) context.roundRect(left, top, pillWidth, pillHeight, pillHeight / 2);
  else context.rect(left, top, pillWidth, pillHeight);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = .85;
  context.strokeStyle = '#fffdf6cc';
  context.stroke();
  for (let index = 1; index <= 3; index++) {
    context.beginPath();
    context.arc(left + pillWidth * index / 4, top + pillHeight / 2, pillHeight * .105, 0, Math.PI * 2);
    context.fillStyle = '#202c2e';
    context.fill();
  }
}

const canvas = document.querySelector('.portfolio-frames');
const brush = canvas?.getContext('2d');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => value * value * (3 - 2 * value);
const timing = { flight: 420, drag: 620, hold: 490, fade: 570 };
const drawnAt = timing.flight + timing.drag;
const fadeAt = drawnAt + timing.hold;
const duration = fadeAt + timing.fade;
const scrollTargets = [
  '.design-film .film-copy p', '#work-title', '.stats', '#about h2', '#experience h2',
  '#tools h2', '#credentials h2', '#process h2', '#contact h2'
];

let selection;
let frame = 0;
let width = 0;
let height = 0;
let ratio = 0;
let sprites;
let observer;
const visited = new WeakSet();

function selectSection(target, index) {
  if (!brush || motion.matches || document.hidden || !target.getClientRects().length) return false;
  const bounds = target.getBoundingClientRect();
  if (bounds.bottom <= 0 || bounds.top >= innerHeight - 48) return false;
  sprites ??= cursorColors.map(color => cursorSprite(color));
  const hue = index % sprites.length;
  const text = target.matches('h2, .film-copy p') ? new Range() : null;
  text?.selectNodeContents(target);
  selection = { target, text, sprite: sprites[hue], color: cursorColors[hue], start: performance.now() + 115 };
  canvas.hidden = false;
  if (!frame) frame = requestAnimationFrame(draw);
  return true;
}

function draw(now) {
  frame = 0;
  const density = Math.min(devicePixelRatio || 1, 1.4, 1760 / Math.max(innerWidth, 1));
  if (width !== innerWidth || height !== innerHeight || ratio !== density) {
    width = innerWidth;
    height = innerHeight;
    ratio = density;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    brush.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  brush.clearRect(0, 0, width, height);
  const box = (selection.text || selection.target).getBoundingClientRect();
  const age = now - selection.start;
  if (age >= duration || !box.width || box.bottom < 0 || box.top > height) {
    stop();
    return;
  }
  if (age >= 0) {
    const flight = smooth(clamp(age / timing.flight));
    const drag = smooth(clamp((age - timing.flight) / timing.drag));
    const fade = 1 - smooth(clamp((age - fadeAt) / timing.fade));
    const left = Math.max(5, box.left - 4);
    const top = Math.max(5, box.top - 4);
    const frameWidth = (Math.min(width - 5, box.right + 4) - left) * drag;
    const frameHeight = (Math.min(height - 9, box.bottom + 4) - top) * drag;
    const hover = smooth(clamp((age - drawnAt) / 170));
    const cursorX = width / 2 + (left - width / 2) * flight + frameWidth + Math.sin(age * .005) * hover * 4;
    const cursorY = height * .47 + (top - height * .47) * flight + frameHeight + Math.cos(age * .004) * hover * 5;
    if (frameWidth > 2 && frameHeight > 2) drawBox(left, top, frameWidth, frameHeight, fade, drag === 1);
    brush.globalAlpha = fade;
    paintCommentCursor(brush, selection.sprite, selection.color, cursorX, cursorY, 20, width, height);
    brush.globalAlpha = 1;
  }
  frame = requestAnimationFrame(draw);
}

function drawBox(x, y, w, h, opacity, complete) {
  brush.globalAlpha = opacity;
  brush.fillStyle = '#4cd9ff12';
  brush.strokeStyle = '#4cd9ff';
  brush.lineWidth = 1;
  brush.fillRect(x, y, w, h);
  brush.strokeRect(x, y, w, h);
  brush.fillStyle = '#fff';
  for (const [left, top] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    brush.fillRect(left - 2, top - 2, 4, 4);
  }
  if (!complete || w < 54) return;
  const label = `${Math.round(w)} × ${Math.round(h)}`;
  brush.font = '600 10px monospace';
  const labelWidth = brush.measureText(label).width + 10;
  const left = x + (w - labelWidth) / 2;
  const top = y + h + (y + h > height - 24 ? -19 : 5);
  brush.fillStyle = '#4cd9ff';
  brush.fillRect(left, top, labelWidth, 15);
  brush.fillStyle = '#10191e';
  brush.fillText(label, left + 5, top + 11);
}

function stop() {
  cancelAnimationFrame(frame);
  frame = 0;
  selection = null;
  if (!canvas) return;
  canvas.hidden = true;
}

function observeSections() {
  observer?.disconnect();
  if (!brush || motion.matches || !('IntersectionObserver' in window)) return;
  const splash = document.querySelector('.greeting-splash');
  observer = new IntersectionObserver(entries => {
    if (splash?.open) return;
    const next = entries.find(entry => entry.isIntersecting && !visited.has(entry.target))?.target;
    if (!next) return;
    if (selectSection(next, scrollTargets.indexOf(next.dataset.frameTarget))) {
      visited.add(next);
      observer.unobserve(next);
    }
  }, { rootMargin: '0px 0px -24% 0px', threshold: .48 });
  scrollTargets.forEach(selector => {
    const target = document.querySelector(selector);
    if (!target || visited.has(target)) return;
    target.dataset.frameTarget = selector;
    observer.observe(target);
  });
}

document.addEventListener('DOMContentLoaded', observeSections, { once: true });
document.querySelector('.greeting-splash')?.addEventListener('close', observeSections);
motion.addEventListener('change', () => { stop(); observeSections(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
window.addEventListener('hashchange', stop);
