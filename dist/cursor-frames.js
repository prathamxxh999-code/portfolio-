export const cursorColors = ['#73e5e7', '#a5edbb', '#ffc2d1', '#c9bdff', '#ffe19d'];

export function cursorSprite(color, rotation = 0) {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 80;
  const brush = sprite.getContext('2d');
  brush.scale(2.5, 2.5);
  brush.translate(16, 16);
  brush.rotate(rotation);
  brush.beginPath();
  brush.moveTo(-9, -11);
  brush.lineTo(11, 1);
  brush.lineTo(1, 3);
  brush.lineTo(-5, 11);
  brush.closePath();
  const finish = brush.createLinearGradient(-7, -11, 8, 11);
  finish.addColorStop(0, '#ffffff');
  finish.addColorStop(.27, color);
  finish.addColorStop(.5, '#f5fffb');
  finish.addColorStop(.61, color);
  finish.addColorStop(1, color);
  brush.fillStyle = finish;
  brush.strokeStyle = '#f8fffd';
  brush.lineWidth = 1.3;
  brush.lineJoin = 'round';
  brush.shadowColor = '#0110117a';
  brush.shadowBlur = 2.8;
  brush.shadowOffsetY = 1.5;
  brush.fill();
  brush.shadowColor = 'transparent';
  brush.stroke();
  brush.beginPath();
  brush.moveTo(-7, -8);
  brush.lineTo(7, .4);
  brush.lineTo(.1, 1.2);
  brush.strokeStyle = '#ffffffd9';
  brush.lineWidth = .9;
  brush.stroke();
  return sprite;
}

const commentSprites = new Map();

export function paintCommentCursor(context, sprite, color, x, y, size, width, height) {
  if (!commentSprites.has(color)) {
    const pill = document.createElement('canvas');
    pill.width = 72;
    pill.height = 48;
    const ink = pill.getContext('2d');
    ink.scale(3, 3);
    const finish = ink.createLinearGradient(0, 1, 0, 14);
    finish.addColorStop(0, '#ffffff');
    finish.addColorStop(.3, color);
    finish.addColorStop(.49, '#effffbe6');
    finish.addColorStop(.55, color);
    finish.addColorStop(1, color);
    ink.beginPath();
    if (ink.roundRect) ink.roundRect(1, 1, 22, 13, 6.5);
    else ink.rect(1, 1, 22, 13);
    ink.fillStyle = finish;
    ink.fill();
    ink.strokeStyle = '#f8fffcd9';
    ink.lineWidth = .8;
    ink.stroke();
    ink.fillStyle = '#25382f';
    for (let dot = 1; dot <= 3; dot++) {
      ink.beginPath();
      ink.arc(1 + 22 * dot / 4, 7.5, 1.1, 0, Math.PI * 2);
      ink.fill();
    }
    commentSprites.set(color, pill);
  }
  const tipX = Math.min(width - size * 1.5, Math.max(size * .25, x));
  const tipY = Math.min(height - size, Math.max(size * .2, y));
  context.drawImage(sprite, tipX - size * .22, tipY - size * .17, size, size);
  context.drawImage(commentSprites.get(color), tipX + size * .43, tipY + size * .32, size * .97, size * .65);
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
let previousPaint = 0;
const visited = new WeakSet();

function selectSection(target, index) {
  if (!brush || motion.matches || document.hidden || !target.getClientRects().length) return false;
  const bounds = target.getBoundingClientRect();
  const navigation = document.querySelector('.nav').getBoundingClientRect();
  if (bounds.top < navigation.bottom + 8 || bounds.top >= innerHeight - 48) return false;
  sprites ??= cursorColors.map(color => cursorSprite(color));
  const hue = index % sprites.length;
  const text = target.matches('h2, .film-copy p') ? new Range() : null;
  text?.selectNodeContents(target);
  selection = { target, text, sprite: sprites[hue], color: cursorColors[hue], start: performance.now() + 115 };
  previousPaint = 0;
  canvas.hidden = false;
  if (!frame) frame = requestAnimationFrame(draw);
  return true;
}

function draw(now) {
  frame = 0;
  if (now - previousPaint < 28) {
    frame = requestAnimationFrame(draw);
    return;
  }
  previousPaint = now;
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
