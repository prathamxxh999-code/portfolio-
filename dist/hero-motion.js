import { cursorSprite, paintCommentCursor } from './cursor-frames.js';

const turn = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const progress = (time, from, to) => clamp((time - from) / (to - from));
const ease = value => value * value * (3 - 2 * value);
const mix = (from, to, amount) => from.map((value, index) => value + (to[index] - value) * amount);

function drawWave(context, width, height, phase) {
  context.clearRect(0, 0, width, height);
  const light = context.createLinearGradient(0, 0, 0, height);
  light.addColorStop(0, '#52815c12');
  light.addColorStop(.58, '#79b77c72');
  light.addColorStop(1, '#a8e58286');
  context.strokeStyle = light;
  context.lineWidth = 1;
  context.beginPath();

  const rows = 14;
  const columns = width < 600 ? 23 : 37;
  for (let row = 0; row <= rows; row++) {
    const z = row / rows;
    const spread = width * (.34 + z * .34);
    for (let column = 0; column <= columns; column++) {
      const across = 2 * column / columns - 1;
      const wave = (.047 + z * .083) * Math.sin(across * 5.1 + z * 4.6 - phase)
        + .034 * Math.sin(across * 8.7 - z * 3.1 + phase * 2);
      const x = width / 2 + across * spread;
      const y = height * (.08 + z ** 1.78 * .96 + wave);
      if (column === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
  }
  for (let column = 0; column <= columns; column++) {
    const across = 2 * column / columns - 1;
    for (let row = 0; row <= rows; row++) {
      const z = row / rows;
      const wave = (.047 + z * .083) * Math.sin(across * 5.1 + z * 4.6 - phase)
        + .034 * Math.sin(across * 8.7 - z * 3.1 + phase * 2);
      const x = width * (.5 + across * (.34 + z * .34));
      const y = height * (.08 + z ** 1.78 * .96 + wave);
      if (row === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
  }
  context.stroke();
}

function normalToEdge([x, y], [nextX, nextY]) {
  const length = Math.hypot(nextX - x, nextY - y);
  return [(y - nextY) / length, (nextX - x) / length];
}

function asteriskMesh() {
  const outline = [];
  const halfArm = .165;
  for (let arm = 0; arm < 6; arm++) {
    const angle = arm * turn / 6;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    outline.push([x + y * halfArm, y - x * halfArm], [x - y * halfArm, y + x * halfArm]);
    outline.push([Math.cos(angle + turn / 12) * halfArm * 2, Math.sin(angle + turn / 12) * halfArm * 2]);
  }
  const inset = outline.map(([x, y], index) => {
    const before = normalToEdge(outline.at(index - 1), outline[index]);
    const after = normalToEdge(outline[index], outline[(index + 1) % outline.length]);
    const offset = .047 / (1 + before[0] * after[0] + before[1] * after[1]);
    return [x + (before[0] + after[0]) * offset, y + (before[1] + after[1]) * offset];
  });
  const layers = [[inset, .22], [outline, .168], [outline, -.168], [inset, -.22]]
    .map(([ring, depth]) => ring.map(([x, y]) => [x, y, depth]));
  const vertices = layers.flat();
  const count = outline.length;
  const front = Array.from({ length: count }, (_, index) => index);
  const back = front.map(index => vertices.length - 1 - index);
  const faces = [{ corners: front, type: 'plate' }, { corners: back, type: 'plate' }];
  for (let layer = 0; layer < layers.length - 1; layer++) {
    for (let index = 0; index < count; index++) {
      const next = (index + 1) % count;
      const upper = layer * count;
      const lower = upper + count;
      const corners = [upper + index, lower + index, lower + next, upper + next];
      faces.push({ corners, type: layer === 1 ? 'wall' : 'bevel' });
    }
  }
  return { outline, vertices, faces };
}

const asterisk = asteriskMesh();
const sketch = [...asterisk.outline, asterisk.outline[0]].map(([x, y]) => [.5 + x * .36, .48 - y * .36]);
const pathLengths = [0];
for (let index = 1; index < sketch.length; index++) {
  const [x, y] = sketch[index];
  const [previousX, previousY] = sketch[index - 1];
  pathLengths.push(pathLengths[index - 1] + Math.hypot(x - previousX, y - previousY));
}

function faceNormal([a, b, c]) {
  const [ux, uy, uz] = b.map((value, index) => value - a[index]);
  const [vx, vy, vz] = c.map((value, index) => value - a[index]);
  const x = uy * vz - uz * vy;
  const y = uz * vx - ux * vz;
  const z = ux * vy - uy * vx;
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

function drawAsterisk(context, width, height, { yaw, pitch, roll, depth, alpha }) {
  context.save();
  context.globalAlpha = alpha;
  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height * .48;
  const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosZ = Math.cos(roll), sinZ = Math.sin(roll);
  const turned = asterisk.vertices.map(([x, y, originalZ]) => {
    const z = originalZ * depth;
    const tiltY = y * cosX - z * sinX;
    const tiltZ = y * sinX + z * cosX;
    const turnX = x * cosY + tiltZ * sinY;
    return [turnX * cosZ - tiltY * sinZ, turnX * sinZ + tiltY * cosZ, -x * sinY + tiltZ * cosY];
  });
  const projected = turned.map(([x, y, z]) => {
    const scale = size * .36 * 4.5 / (4.5 - z);
    return [cx + x * scale, cy - y * scale];
  });
  const visible = [];
  for (const { corners, type } of asterisk.faces) {
    const positions = corners.map(index => turned[index]);
    const normal = faceNormal(positions);
    const [x, y, z] = positions.reduce((center, position) => center.map((value, index) => value + position[index] / positions.length), [0, 0, 0]);
    if (-normal[0] * x - normal[1] * y + normal[2] * (4.5 - z) <= 0) continue;
    visible.push({ corners, type, normal, depth: z });
  }
  visible.sort((a, b) => a.depth - b.depth);

  const aura = context.createRadialGradient(cx, cy, size * .09, cx, cy, size * .49);
  aura.addColorStop(0, '#75c7561e');
  aura.addColorStop(.48, '#63c26f0c');
  aura.addColorStop(1, '#63c26f00');
  context.fillStyle = aura;
  context.fillRect(0, 0, width, height);

  const reflection = context.createRadialGradient(cx, height * .88, 0, cx, height * .88, size * .29);
  reflection.addColorStop(0, '#92d85735');
  reflection.addColorStop(1, '#92d85700');
  context.save();
  context.translate(cx, height * .88);
  context.scale(1, .21);
  context.translate(-cx, -height * .88);
  context.fillStyle = reflection;
  context.fillRect(0, 0, width, height * 2);
  context.restore();

  context.lineJoin = 'round';
  context.lineWidth = .66;
  for (const { corners, type, normal: [nx, ny, nz] } of visible) {
    const light = Math.max(0, -.48 * nx + .66 * ny + .56 * nz);
    const gloss = Math.max(0, -.28 * nx + .39 * ny + .88 * nz) ** 10;
    const bevel = type === 'bevel';
    const plate = type === 'plate';
    const fill = context.createLinearGradient(cx - size * .26, cy - size * .35, cx + size * .22, cy + size * .31);
    const hue = bevel ? 85 : 105;
    const highlight = (bevel ? 30 : plate ? 24 : 17) + light * 32 + gloss * 19;
    fill.addColorStop(0, `hsl(${hue - 13} 63% ${highlight}%)`);
    fill.addColorStop(.45, `hsl(${hue} 52% ${Math.max(13, highlight - 19)}%)`);
    fill.addColorStop(.64, `hsl(${hue + 22} 52% ${13 + light * 17}%)`);
    fill.addColorStop(1, `hsl(${hue + 27} 47% ${10 + light * 9}%)`);
    context.beginPath();
    for (const index of corners) context.lineTo(...projected[index]);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = `rgba(208, 242, 135, ${bevel ? .12 + light * .28 : .16})`;
    context.stroke();
  }
  context.restore();
}

function traceAt(amount) {
  const distance = amount * pathLengths.at(-1);
  const next = pathLengths.findIndex(length => length > distance);
  if (next === -1) return { last: sketch.length - 1, tip: sketch.at(-1) };
  return {
    last: next - 1,
    tip: mix(sketch[next - 1], sketch[next], progress(distance, pathLengths[next - 1], pathLengths[next])),
  };
}

function drawSketch(context, width, height, trace, alpha) {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = '#b8ecab';
  context.lineWidth = 1.25;
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(sketch[0][0] * width, sketch[0][1] * height);
  for (let index = 1; index <= trace.last; index++) {
    context.lineTo(sketch[index][0] * width, sketch[index][1] * height);
  }
  context.lineTo(trace.tip[0] * width, trace.tip[1] * height);
  if (trace.last === sketch.length - 1) {
    context.fillStyle = '#81b8762e';
    context.fill();
  }
  context.stroke();
  for (let index = 0; index <= Math.min(trace.last, sketch.length - 2); index++) {
    const [x, y] = sketch[index];
    context.fillStyle = '#15271c';
    context.fillRect(x * width - 1.7, y * height - 1.7, 3.4, 3.4);
    context.strokeRect(x * width - 1.7, y * height - 1.7, 3.4, 3.4);
  }
  context.restore();
}

const cycle = {
  framePress: .72, frameStart: .88, frameEnd: 1.9,
  traceStart: 2.67, traceEnd: 5.97,
  depthStart: 6.59, depthEnd: 7.65, fadeStart: 10.81, end: 11.59,
};

function clickPulse(time, at) {
  return time >= at ? 1 - progress(time, at, at + .24) : 0;
}

function drawingPose(time, direction) {
  const frameSize = ease(progress(time, cycle.frameStart, cycle.frameEnd));
  const traceAmount = progress(time, cycle.traceStart, cycle.traceEnd);
  const trace = traceAt(traceAmount);
  const depth = ease(progress(time, cycle.depthStart, cycle.depthEnd));
  const fade = 1 - ease(progress(time, cycle.fadeStart, cycle.end));
  const frameStart = [.17, .17];
  const frameEnd = [.83, .83];
  const park = [direction < 0 ? .045 : .88, .045];
  const depthStart = [direction < 0 ? .22 : .78, .46];
  const depthEnd = [direction < 0 ? .04 : .96, .68];
  const depthPark = [depthEnd[0], .78];
  const firstPoint = sketch[0].map(value => .03 + value * .94);
  let leadPoint;
  if (time < cycle.frameStart) {
    leadPoint = mix(park, frameStart, ease(progress(time, 0, cycle.framePress)));
  } else if (time < cycle.frameEnd) {
    leadPoint = mix(frameStart, frameEnd, frameSize);
  } else if (time < cycle.traceStart) {
    leadPoint = mix(frameEnd, firstPoint, ease(progress(time, cycle.frameEnd, cycle.traceStart - .11)));
  } else if (time < cycle.traceEnd) {
    leadPoint = trace.tip.map(value => .03 + value * .94);
  } else {
    leadPoint = mix(firstPoint, park, ease(progress(time, cycle.traceEnd, cycle.depthStart + .38)));
  }
  let depthPoint = mix(depthPark, depthStart, ease(progress(time, cycle.traceEnd - .14, cycle.depthStart)));
  if (time >= cycle.depthStart) depthPoint = mix(depthStart, depthEnd, depth);
  if (time >= cycle.depthEnd) depthPoint = mix(depthEnd, depthPark, ease(progress(time, cycle.depthEnd, cycle.depthEnd + .5)));
  return { time, frameSize, traceAmount, trace, depth, fade, leadPoint, depthPoint, depthStart };
}

function makeObjectScene(root, direction, offset) {
  const canvas = root.querySelector('.hero-asterisk');
  const frame = root.querySelector('.hero-object-frame');
  const lead = root.querySelector('.hero-object-cursor--lead');
  const depthCursor = root.querySelector('.hero-object-cursor--second');
  const scene = { canvas };
  let animations = [];
  let playing = false;
  let size = [0, 0];

  for (const cursor of root.querySelectorAll('.hero-object-cursor')) {
    const artwork = document.createElement('img');
    artwork.className = 'hero-cursor-art';
    artwork.alt = '';
    artwork.width = artwork.height = 24;
    artwork.src = cursorSprite(getComputedStyle(cursor).getPropertyValue('--cursor-color').trim()).toDataURL();
    cursor.prepend(artwork);
    cursor.setAttribute('data-glossy', '');
  }

  function cursorFrame(point, time) {
    return {
      offset: time / cycle.end,
      transform: 'translate3d(' + (point[0] * size[0]).toFixed(2) + 'px, ' + (point[1] * size[1]).toFixed(2) + 'px, 0)',
    };
  }

  scene.resize = (clock, reduced) => {
    for (const animation of animations) animation.cancel();
    animations = [];
    playing = false;
    size = [root.clientWidth, root.clientHeight];
    root.toggleAttribute('data-drawing', !reduced);
    if (reduced) return;

    const moments = new Set([0, cycle.end, ...Object.values(cycle)]);
    for (let time = 0; time < cycle.end; time += 1 / 30) moments.add(time);
    for (const distance of pathLengths) moments.add(cycle.traceStart + distance / pathLengths.at(-1) * (cycle.traceEnd - cycle.traceStart));
    const poses = [...moments].sort((a, b) => a - b).map(time => drawingPose(time, direction));
    const leadFrames = poses.map(pose => cursorFrame(pose.leadPoint, pose.time));
    const depthFrames = poses.map(pose => cursorFrame(pose.depthPoint, pose.time));
    const frameFrames = poses.map(pose => ({
      offset: pose.time / cycle.end,
      transform: 'scale(' + pose.frameSize.toFixed(4) + ')',
      opacity: pose.fade * clamp(pose.frameSize * 8) * (1 - pose.depth * .48),
    }));
    const pulseFrames = clicks => poses.map(pose => {
      const pulse = Math.max(...clicks.map(at => clickPulse(pose.time, at)));
      return {
        offset: pose.time / cycle.end,
        opacity: pulse,
        transform: 'scale(' + (1.85 - pulse * 1.2).toFixed(2) + ')',
      };
    });
    const tracks = [
      [lead, leadFrames], [depthCursor, depthFrames], [frame, frameFrames],
      [lead.querySelector('.hero-cursor-pulse'), pulseFrames([cycle.framePress, cycle.traceStart])],
      [depthCursor.querySelector('.hero-cursor-pulse'), pulseFrames([cycle.depthStart])],
    ];
    for (const [target, keyframes] of tracks) {
      const animation = target.animate(keyframes, { duration: cycle.end * 1000, iterations: Infinity, easing: 'linear' });
      animation.pause();
      animation.currentTime = (clock + offset) * 1000;
      animations.push(animation);
    }
  };

  scene.setPlayback = (active, clock) => {
    if (active === playing) return;
    playing = active;
    for (const animation of animations) {
      animation.currentTime = (clock + offset) * 1000;
      if (active) animation.play();
      else animation.pause();
    }
  };

  scene.draw = (context, width, height, clock, reduced, paint) => {
    if (!paint) return;
    context.clearRect(0, 0, width, height);
    if (reduced) {
      drawAsterisk(context, width, height, { yaw: -.46 * direction, pitch: -.31, roll: -.13, depth: 1, alpha: 1 });
      return;
    }
    const time = ((animations[0]?.currentTime ?? (clock + offset) * 1000) / 1000) % cycle.end;
    const pose = drawingPose(time, direction);
    if (pose.depth > 0) {
      const turning = Math.max(0, time - cycle.depthEnd);
      drawAsterisk(context, width, height, {
        yaw: direction * (pose.depth * .42 + turning * .69),
        pitch: pose.depth * (-.28 + Math.sin(turning) * .14),
        roll: pose.depth * -.13,
        depth: .03 + pose.depth * .97,
        alpha: pose.fade * clamp(pose.depth * 2.6),
      });
    }
    if (time >= cycle.traceStart && pose.depth < 1) drawSketch(context, width, height, pose.trace, 1 - pose.depth);
    if (time >= cycle.depthStart && time < cycle.depthEnd) {
      const pointInCanvas = point => [(point[0] - .03) / .94 * width, (point[1] - .03) / .94 * height];
      context.strokeStyle = '#bce6d5b0';
      context.setLineDash([3, 4]);
      context.beginPath();
      context.moveTo(...pointInCanvas(pose.depthStart));
      context.lineTo(...pointInCanvas(pose.depthPoint));
      context.stroke();
      context.setLineDash([]);
    }
  };
  return scene;
}

function makeRoleSelection(canvas) {
  const color = '#789e96';
  const sprite = cursorSprite(color);
  const smooth = value => { value = clamp(value); return value * value * (3 - 2 * value); };
  return {
    canvas,
    draw(context, width, height, clock, reduced, paint) {
      if (!paint) return;
      context.clearRect(0, 0, width, height);
      const time = clock % 9.6;
      const flight = smooth(time / .85);
      const drag = reduced ? 1 : smooth((time - .85) / 1.1);
      const fade = reduced ? .65 : 1 - smooth((time - 5.6) / 1.0);
      if (fade <= 0) return;
      const left = 44;
      const top = 27;
      const frameWidth = Math.max(0, width - 88) * drag;
      const frameHeight = Math.max(0, height - 54) * drag;
      if (frameWidth > 2 && frameHeight > 2) {
        context.globalAlpha = fade;
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.strokeRect(left, top, frameWidth, frameHeight);
        context.fillStyle = '#c1d4cb';
        for (const [x, y] of [[left,top],[left+frameWidth,top],[left,top+frameHeight],[left+frameWidth,top+frameHeight]]) {
          context.fillRect(x-1.5,y-1.5,3,3);
        }
      }
      if (!reduced) {
        const hover = smooth((time - 1.95) / .4);
        const x = left - 23 * (1-flight) + frameWidth + Math.sin(time * 2.8) * hover * 3;
        const y = top - 14 * (1-flight) + frameHeight + Math.cos(time * 2.4) * hover * 3;
        context.globalAlpha = fade * smooth(time / .2);
        paintCommentCursor(context, sprite, color, x, y, 21, width, height);
      }
      context.globalAlpha = 1;
    },
  };
}

export function mountHeroMotion(hero, motion) {
  const greeting = document.querySelector('.greeting-splash');
  const roleCanvas = hero.querySelector('.role-tag-canvas');
  const layers = [
    { canvas: hero.querySelector('.hero-wave'), draw: (context, width, height, time, reduced, paint) => {
      if (paint) drawWave(context, width, height, reduced ? 0 : time * turn / 13);
    } },
    ...(roleCanvas ? [makeRoleSelection(roleCanvas)] : []),
    makeObjectScene(hero.querySelector('.hero-object--left'), -1, 0),
    makeObjectScene(hero.querySelector('.hero-object--right'), 1, 1.4),
  ].map(layer => ({ ...layer, context: layer.canvas.getContext('2d') })).filter(layer => layer.context);
  let frame = 0;
  let visible = true;
  let clock = 0;
  let previous = 0;
  let lastFrame = 0;
  let resizeNeeded = true;

  function request() {
    const active = visible && !document.hidden && !greeting?.open;
    const moving = active && !motion.matches;
    if (hero.hasAttribute('data-objects-moving') !== moving) hero.toggleAttribute('data-objects-moving', moving);
    for (const layer of layers) layer.setPlayback?.(moving, clock);
    if (active && !frame) frame = requestAnimationFrame(render);
  }

  function render(now) {
    frame = 0;
    if (!visible || document.hidden || greeting?.open) return;
    if (resizeNeeded) {
      const ratio = Math.min(devicePixelRatio || 1, innerWidth <= 650 ? 1.25 : 1.5);
      for (const layer of layers) {
        layer.width = layer.canvas.clientWidth;
        layer.height = layer.canvas.clientHeight;
        if (!layer.width || !layer.height) continue;
        layer.canvas.width = Math.round(layer.width * ratio);
        layer.canvas.height = Math.round(layer.height * ratio);
        layer.context.setTransform(ratio, 0, 0, ratio, 0, 0);
        layer.resize?.(clock, motion.matches);
        layer.setPlayback?.(!motion.matches, clock);
      }
    }
    if (!motion.matches && previous) clock += (now - previous) / 1000;
    previous = now;
    const paint = resizeNeeded || motion.matches || now - lastFrame >= 30;
    if (paint) lastFrame = now;
    resizeNeeded = false;
    for (const { draw, context, width, height } of layers) {
      if (width && height) draw(context, width, height, clock, motion.matches, paint);
    }
    if (!motion.matches) request();
  }

  function resize() {
    resizeNeeded = true;
    request();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      previous = 0;
      request();
    }).observe(hero);
  }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(resize);
    for (const { canvas } of layers) observer.observe(canvas);
  } else window.addEventListener('resize', resize, { passive: true });
  motion.addEventListener('change', () => { previous = 0; resize(); });
  greeting?.addEventListener('close', request);
  document.addEventListener('visibilitychange', () => { previous = 0; request(); });
  request();
}
